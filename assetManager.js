/**
 * @requires Q.js
 */
(function(exports) {

if (typeof Q !== 'function') {
  throw new Error('AssetManager requires the Q.js library. https://github.com/kriskowal/q');
}

/**
 * @constructor
 * @property {string} manifestUrl - The URL to the manifest file.
 * @property {object} manifest    - The JSON parsed manifest file.
 * @property {object} assets      - List of loaded assets.
 * @property {string} assetRoot   - Root directive for all assets.
 * @property {object} bundles     -
 */
var AssetManager = function() {
  // manifest
  this.manifestUrl = '';
  this.manifest  = {};

  // assets
  this.assets = {};
  this.assetRoot = './';
  this.bundles = {};

  this.supportedAssets = ['jpeg', 'jpg', 'gif', 'png', 'wav', 'mp3', 'ogg', 'acc', 'm4a', 'js', 'css', 'json'];

  // audio playability (taken from Modernizr)
  var audio = new Audio();
  this.canPlay = {};
  this.canPlay.wav = audio.canPlayType('audio/wav; codecs="1"').replace(/no/, '');
  this.canPlay.mp3 = audio.canPlayType('audio/mpeg;').replace(/no/, '');
  this.canPlay.ogg = audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '');
  this.canPlay.aac = audio.canPlayType('audio/aac;').replace(/no/, '');
  this.canPlay.m4a = (audio.canPlayType('audio/x-m4a;') || this.canPlay.acc).replace(/no/, '');
};
var AM = AssetManager.prototype;

/**
 * Load an asset manifest file.
 * @public
 * @param {string} url - The URL to the asset manifest file.
 * @returns Deferred promise.
 */
AM.loadManifest = function(url) {
  var _this = this;
  var numLoaded = 0;
  var numAssets = 0;
  var deferred = Q.defer();
  var promises = [];
  var i, len, bundle, bundles;

  // load the manifest only if it hasn't been loaded
  if (this.manifestUrl !== url) {
    this.loadJSON(url)
    .then(function loadMainfestJSONSuccess(manifest) {

      _this.manifest = manifest;
      _this.manifestUrl = url;
      _this.assetRoot = manifest.assetRoot || './';

      // create bundles and add assets
      try {
        for (i = 0, len = manifest.bundles.length; i < len; i++) {
          bundle = manifest.bundles[i];
          _this.createBundle(bundle.name, true);
          _this.addBundleAsset(bundle.name, bundle.assets, true);
        }
      }
      catch (err) {
        deferred.reject(err);
      }

      // load bundles
      if (manifest.loadBundles) {

        if (isString(manifest.loadBundles)) {
          // load all bundles
          if (manifest.loadBundles === 'all') {
            bundles = Object.keys(_this.bundles || {});
          }
          else {
            bundles = [manifest.loadBundles];
          }
        }
        else if (manifest.loadBundles instanceof Array) {
          bundles = manifest.loadBundles;
        }

        _this.loadBundle(bundles)
        .then(function loadMainfestSuccess() {
          deferred.resolve();
        }, function loadMainfestError(err) {
          deferred.reject(err);
        }, function loadMainfestNotify(progress) {
          deferred.notify(progress);
        });
      }
      else {
        deferred.resolve();
      }
    }, function loadMainfestJSONError(err) {
      err.message = err.message.replace('JSON', 'manifest');
      deferred.reject(err);
    })
    .done();
  }
  else {
    console.info('Manifest \'' + url + '\' already loaded.');
    deferred.resolve();
  }

  return deferred.promise;
};

/**
 * Create a bundle.
 * @public
 * @param {string|array} bundle     - The name of the bundle(s).
 * @param {boolean}      isPromise  - If this function is called by a function that uses a promise.
 * @example
 * AssetManager.createBundle('bundleName');
 * AssetManager.createBundle(['bundle1', 'bundle2']);
 */
AM.createBundle = function(bundle, isPromise) {
  try {
    // list of bundle names
    if (bundle instanceof Array) {
      for (var i = 0, len = bundle.length; i < len; i++) {
        addBundle.call(this, bundle[i]);
      }
    }
    // single bundle name
    else {
      addBundle.call(this, bundle);
    }
  }
  catch(err) {
    if (isPromise) {
      throw formatError(err, 'Unable to create bundle');
    }
    else {
      throw err;
    }
  }
};

/**
 * Load all assets in a bundle.
 * @public
 * @param {string|array} bundle - The name of the bundle(s).
 * @returns Deferred promise.
 * @throws If the bundle has not be created
 * @example
 * AssetManager.loadBundle('bundleName');
 * AssetManager.loadBundle(['bundle1', 'bundle2']);
 */
AM.loadBundle = function(bundle) {
  var _this = this;
  var bundles = [];
  var numLoaded = 0;
  var numAssets = 0;
  var deferred = Q.defer();  // defer to return
  var promises = [];  // keep track of all assets loaded
  var assets;

  if (bundle instanceof Array) {
    bundles = bundle;
  }
  else if (isString(bundle)) {
    bundles = [bundle];
  }

  for (var i = 0, len = bundles.length; i < len; i++) {
    assets = this.bundles[ bundles[i] ];

    if (!assets) {
      var err = new ReferenceError('Bundle not created');
      deferred.reject(formatError(err, 'Unable to load bundle \'' + bundle + '\''));
      return deferred.promise;
    }

    assets.status = 'loading';
    numAssets += Object.keys(assets || {}).length;
    promises.push(this.loadAsset(assets));
  }

  (function(_this, bundles) {
    Q.all(promises)
    .then(function loadBundlesSuccess() {
      for (var i = 0, len = bundles.length; i < len; i++) {
        _this.bundles[ bundles[i] ].status = 'loaded';
      }

      deferred.resolve();
    }, function loadBundlesError(err) {
      deferred.reject(err);
    }, function loadBundlesNotify(progress) {
      // notify user of progress
      deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
    })
    .done();
  })(_this, bundles);

  return deferred.promise;
};

/**
 * Add an asset to a bundle.
 * @public
 * @param {string}  bundleName - The name of the bundle.
 * @param {object}  asset      - The asset to add to the bundle.
 * @param {boolean} isPromise  - If this function is called by a function that uses a promise.
 * @throws If the bundle has not been created or if the asset is empty or not an object.
 * @example
 * AssetManager.addAsset('bundleName', {'assetName': 'assetUrl'});
 * AssetManager.addAsset('bundleName', {'asset1': 'asset1Url', 'asset2': 'asset2Url'});
 */
AM.addBundleAsset = function(bundleName, asset, isPromise) {
  if (!this.bundles[bundleName]) {
    var err = new ReferenceError('Bundle not created');

    // format the error message for a promises reject
    if (isPromise) {
      throw formatError(err, 'Unable to add asset to bundle \'' + bundleName + '\'');
    }
    else {
      throw err;
    }
  }
  else {
    for (var assetName in asset) {
      if (asset.hasOwnProperty(assetName)) {
        this.bundles[bundleName][assetName] = asset[assetName];
      }
    }
  }
};

/**
 * Load an asset.
 * @param {object} asset - The asset to load.
 * @returns Deferred promise.
 * @example
 * AssetManager.loadAsset({'assetName': 'assetUrl'});
 * AssetManager.loadAsset({'asset1': 'asset1Url', 'asset2': 'asset2Url'});
 */
AM.loadAsset = function(asset) {
  var _this = this;
  var numLoaded = 0;
  var numAssets = Object.keys(asset || {}).length;
  var deferred = Q.defer();
  var promises = [];
  var src, type, defer;

  for (var assetName in asset) {
    if (asset.hasOwnProperty(assetName)) {
      src = asset[assetName];

      // multiple audio formats
      if (src instanceof Array) {
        type = 'audio';
      }
      else {
        type = getType(src);
      }
      defer = Q.defer();

      // load asset by type
      switch(type) {
        case 'image':
          // create closure for event binding
          (function loadImage(name, src, defer) {
            var image = new Image();
            image.status = 'loading';
            image.name = name;
            image.onload = function() {
              image.status = 'loaded';
              _this.assets[name] = image;
              defer.resolve();
              deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
            };
            image.onerror = function(e) {
              defer.reject(new Error('Unable to load Image \'' + name + '\''));
            };
            image.src = src;

            promises.push(defer.promise);
          })(assetName, src, defer);
          break;

        case 'audio':
          if (isString(src)) {
            src = [src];
          }

          // check that the browser can play one of the listed audio types
          var source, playableSrc;
          for (var i = 0, len = src.length; i < len; i++) {
            source = src[i];
            var audioType = getType(source);
            var extension = getExtension(source);

            // break on first audio type that is playable
            if (this.canPlay[extension]) {
              playableSrc = source;
              break;
            }
          }

          if (!playableSrc) {
            defer.reject(new Error('Browser cannot play any of the audio types provided for asset \'' + assetName + '\''));
            promises.push(defer.promise);
          }
          else {
            (function loadAudio(name, src, defer) {
              var audio = new Audio();
              audio.status = 'loading';
              audio.name = name;
              audio.addEventListener('canplay', function() {
                if (audioLoaded(audio)) {
                  audio.status = 'loaded';
                  _this.assets[name] = audio;
                  defer.resolve();
                  deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
                }
              });
              audio.onerror = function() {
                defer.reject(new Error('Unable to load Audio ' + name + ': ' + e.message));
              };
              audio.src = src;
              audio.preload = 'auto';
              audio.load();

              promises.push(defer.promise);
            })(assetName, playableSrc, defer);
          }
          break;

        case 'js':
          this.loadScript(src)
          .then(function loadScriptSuccess() {
            defer.resolve();
            deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
          }, function loadScriptError(err) {
            defer.reject(new Error(err.name + ': ' + err.message + ' \'' + assetName + '\' from src \'' + src + '\''));
          });

          promises.push(defer.promise);
          break;

        case 'css':
          this.loadCSS(src)
          .then(function loadCSSSuccess() {
            defer.resolve();
            deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
          }, function loadCSSError(err) {
            defer.reject(new Error(err.name + ': ' + err.message + ' \'' + assetName + '\' from src \'' + src + '\''));
          });

          promises.push(defer.promise);
          break;

        case 'json':
          (function loadJSONFile(name, src, defer) {
            _this.loadJSON(src)
            .then(function loadJsonSuccess(json) {
              _this.assets[name] = json;
              defer.resolve();
              deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
            }, function loadJSONError(err) {
              defer.reject(new Error(err.name + ': ' + err.message + ' \'' + name + '\' from src \'' + src + '\''));
            });

            promises.push(defer.promise);
          })(assetName, src, defer);
          break;

        default:
          err = new TypeError('Unsupported asset type');
          deferred.reject(formatError(err, 'File type for asset \'' + assetName + '\' is not supported. Please use ' + this.supportedAssets.join(', ')));
      }
    }
  }

  if (numAssets === 0) {
    deferred.resolve();
    return deferred.promise;
  }

  Q.all(promises)
  .then(function loadAssetSuccess(value) {
    deferred.resolve(value);
  },
  function loadAssetError(err) {
    deferred.reject(err);
  });

  return deferred.promise;
};

/**
 * Load a JavaScript file.
 * NOTE: This function does not add the asset to the assets dictionary.
 * @public
 * @param {string} url - The URL to the JavaScript file.
 * @returns Deferred promise.
 */
AM.loadScript = function(url) {
  var deferred = Q.defer();
  var script = document.createElement('script');
  script.async = true;
  script.onload = function() {
    deferred.resolve();
  };
  script.onerror = function() {
    var err = new Error();
    deferred.reject(formatError(err, 'Unable to load JavaScript file'));
  };
  script.src = url;
  document.body.appendChild(script);

  return deferred.promise;
};

/**
 * Load a CSS file.
 * NOTE: This function does not add the asset to the assets dictionary.
 * @public
 * @param {string} url = The URL to the CSS file.
 * @returns Deferred promise.
 */
AM.loadCSS = function(url) {
  var deferred = Q.defer();
  var link = document.createElement('link');
  link.async = true;
  link.rel = 'stylesheet';
  link.onload = function() {
    deferred.resolve();
  };
  link.onerror = function() {
    var err = new Error();
    deferred.reject(formatError(err, 'Unable to load CSS file'));
  };
  link.href = url;
  document.getElementsByTagName('head')[0].appendChild(link);

  return deferred.promise;
};

/**
 * Load a JSON file.
 * @public
 * @param {string} url - The URL to the asset.
 * @returns Deferred promise.
 * @resolves Parsed JSON.
 * @throws When the JSON file fails to load.
 */
AM.loadJSON = function(url) {
  var deferred = Q.defer();
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.addEventListener('load', function JSONLoaded() {
    if (req.status == 200) {
      try {
        var json = JSON.parse(req.responseText);
        deferred.resolve(json);
      }
      catch (err) {
        deferred.reject(formatError(err, 'Unable to parse JSON file'));
      }
    }
    else {
      var err = new Error(req.responseText);
      deferred.reject(formatError(err, 'Unable to load JSON file'));
    }
  });
  req.send();

  return deferred.promise;
};

/**
 * Add a bundle to the bundles dictionary.
 * @private
 * @param {string} bundleName - The name of the bundle.
 * @throws If the bundle already exists.
 */
function addBundle(bundleName) {
  if (this.bundles[bundleName]) {
    throw new Error('Bundle \'' + bundleName + '\' already created');
  }
  else {
    this.bundles[bundleName] = Object.create(Object.prototype, { status: {
      value: 'created',
      writable: true,
      enumerable: false,
      configurable: false }
    });
  }
}

/**
 * Test if an object is a string.
 * @private
 * @param {object} obj - The object to test.
 * @returns True if the object is a string.
 */
function isString(obj) {
  return toString.call(obj) === '[object String]';
}

/**
 * Return the type of file based on it's extension.
 * @private
 * @param {string} url - The URL to the asset.
 * @returns {string} image, audio, js, json.
 * @throws If the file type is not recognized.
 */
function getType(url) {
  if (url.match(/\.(jpeg|jpg|gif|png)$/)) {
    return 'image';
  }
  else if (url.match(/\.(wav|mp3|ogg|aac|m4a)$/)) {
    return 'audio';
  }
  else if(url.match(/\.(js)$/)) {
    return 'js';
  }
  else if(url.match(/\.(css)$/)) {
    return 'css';
  }
  else if(url.match(/\.(json)$/)) {
    return 'json';
  }
}

/**
 * Return the extension of a file.
 */
function getExtension(url) {
  var extension = (url.toLowerCase().match(/\.([a-z]*)$/) || ['',''])[1];
  return extension ? extension : 'unknown';
}

/**
 * Check the loading state of an Audio.
 * @private
 * @param {Audio} audio - The Audio object to check.
 * @returns True if the audio is loaded.
 */
function audioLoaded(audio) {
  if (audio.status === 'loading' && audio.readyState === 4) {
    return true;
  }

  return false;
}

/**
 * Format Error messages for better output.
 * Use this function right before passing the Error to the user.
 * @private
 * @param {Error}  err - Error object.
 * @param {string} msg - Custom message.
 */
function formatError(err, msg) {
  err.originalMessage = err.message;
  err.message = 'AssetManager: ' + msg + '\n\t' + err.stack;
  return err;
}

exports.AssetManager = AssetManager;

})(window);