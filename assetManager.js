/*
 * Copyright (C) 2014 Steven Lambert
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies
 * or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
 * OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @fileoverview Asset Manager Library.
 * @author steven@sklambert.com (Steven Lambert)
 * @requires qLite.js
 */
(function(exports) {

// save the toString method for objects
var toString = ({}).toString;

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

  this.supportedAssets = ['jpeg', 'jpg', 'gif', 'png', 'wav', 'mp3', 'ogg', 'aac', 'm4a', 'js', 'css', 'json'];

  // detect iOS so we can deal with audio assets not pre-loading
  this.isiOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);

  // audio playability (taken from Modernizr)
  var audio = new Audio();
  this.canPlay = {};
  this.canPlay.wav = audio.canPlayType('audio/wav; codecs="1"').replace(/no/, '');
  this.canPlay.mp3 = audio.canPlayType('audio/mpeg;').replace(/no/, '');
  this.canPlay.ogg = audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '');
  this.canPlay.aac = audio.canPlayType('audio/aac;').replace(/no/, '');
  this.canPlay.m4a = (audio.canPlayType('audio/x-m4a;') || this.canPlay.aac).replace(/no/, '');
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
  var deferred = q.defer();
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
    });
  }
  else {
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
  var numLoaded = 0;
  var numAssets = 0;
  var bundles = [];
  var deferred = q.defer();  // defer to return
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

    numAssets += countAssets(assets);

    assets.status = 'loading';
    promises.push(this.loadAsset(assets));
  }

  (function(_this, bundles) {
    q.all(promises)
    .then(function loadBundlesSuccess() {
      for (var i = 0, len = bundles.length; i < len; i++) {
        _this.bundles[ bundles[i] ].status = 'loaded';
      }

      deferred.resolve();
    }, function loadBundlesError(err) {
      deferred.reject(err);
    }, function loadBundlesNotify() {
      // notify user of progress
      deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
    });
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
  var numAssets = countAssets(asset);
  var deferred = q.defer();
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
      defer = q.defer();

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
            image.onerror = function() {
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
            // don't count audio in iOS
            if (this.isiOS) {
              numAssets--;
            }

            (function loadAudio(name, src, defer) {
              var audio = new Audio();
              audio.status = 'loading';
              audio.name = name;
              audio.addEventListener('canplay', function() {
                audio.status = 'loaded';
                _this.assets[name] = audio;
                defer.resolve();
                deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
              });
              audio.onerror = function() {
                defer.reject(new Error('Unable to load Audio \'' + name + '\''));
              };
              audio.src = src;
              audio.preload = 'auto';
              audio.load();

              // for iOS, just load the asset without adding it the promises array
              // the audio will be downloaded on user interaction instead
              if (_this.isiOS) {
                audio.status = 'loaded';
                _this.assets[name] = audio;
              }
              else {
                promises.push(defer.promise);
              }
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
          var err = new TypeError('Unsupported asset type');
          deferred.reject(formatError(err, 'File type for asset \'' + assetName + '\' is not supported. Please use ' + this.supportedAssets.join(', ')));
      }
    }
  }

  if (numAssets === 0) {
    deferred.resolve();
    return deferred.promise;
  }

  q.all(promises)
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
  var deferred = q.defer();
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
 * Because of the lack of onload and onerror support for <link> tags, we need to load the CSS
 * file via ajax and then put the contents of the file into a <style> tag.
 * @see {@link http://pieisgood.org/test/script-link-events/}
 * NOTE: This function does not add the asset to the assets dictionary.
 * @public
 * @param {string} url - The URL to the CSS file.
 * @returns Deferred promise.
 */
AM.loadCSS = function(url) {
  var deferred = q.defer();
  var req = new XMLHttpRequest();
  req.addEventListener('load', function CSSLoaded() {
    // ensure we have a css file before creating the <style> tag
    if (req.status === 200 && req.getResponseHeader('content-type').indexOf('text/css') !== -1) {
      var style = document.createElement('style');
      style.innerHTML = req.responseText;
      style.setAttribute('data-url', url);  // set data attribute for testing purposes
      document.getElementsByTagName('head')[0].appendChild(style);
      deferred.resolve();
    }
    else {
      var err = new Error(req.responseText);
      deferred.reject(formatError(err, 'Unable to load CSS file'));
    }
  });
  req.open('GET', url, true);
  req.send();

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
  var deferred = q.defer();
  var req = new XMLHttpRequest();
  req.addEventListener('load', function JSONLoaded() {
    if (req.status === 200) {
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
  req.open('GET', url, true);
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
 * Count the number of assets.
 * @private
 * @param {object} assets - The assets to count.
 * @return {number} Total number of assets.
 */
function countAssets(assets) {
  var total = 0;
  var asset, type;

  for (var assetName in assets) {
    if (assets.hasOwnProperty(assetName)) {
      asset = assets[assetName];

      if (asset instanceof Array) {
        type = 'audio';
      }
      else {
        type = getType(asset);
      }

      // only count audio assets if this is not iOS
      if (type === 'audio' && !this.isiOS) {
        total++;
      }
      else {
        total++;
      }
    }
  }

  return total;
}

/**
 * Test if an object is a string.
 * @private
 * @param {object} obj - The object to test.
 * @returns {boolean} True if the object is a string.
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
 * @see {@link http://jsperf.com/extract-file-extension}
 */
function getExtension(url) {
  return url.substr((~-url.lastIndexOf(".") >>> 0) + 2);
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