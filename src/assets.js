/**
 * Load an asset.
 * @public
 * @memberof AssetLoader
 * @param {object} asset - The asset(s) to load.
 * @returns {Promise} A deferred promise.
 * @throws {TypeError} If the asset type is not supported.
 * @example
 * AssetLoader.loadAsset({'assetName': 'assetUrl'});
 * AssetLoader.loadAsset({'asset1': 'asset1Url', 'asset2': 'asset2Url'});
 */
AssetLoader.prototype.loadAsset = function(asset) {
  var _this = this;
  var numLoaded = 0;
  var numAssets = countAssets.call(this, asset);
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
        type = this.getType(src);
      }
      defer = q.defer();

      // load asset by type
      switch(type) {
        case 'image':
          // create closure for event binding
          (function loadImage(name, src, defer) {
            _this.loadImage(src, name)
            .then(function loadImageSuccess(image) {
              defer.resolve();
              deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
            }, function loadImageError(err) {
              defer.reject(new Error(err.name + ': ' + err.message + ' \'' + name + '\' from src \'' + src + '\''));
            });

            promises.push(defer.promise);
          })(assetName, src, defer);
          break;

        case 'audio':
          // don't count audio in iOS
          if (this.isiOS) {
            numAssets--;
          }
          else {
            promises.push(defer.promise);
          }

          (function loadAudio(name, src, defer) {
            _this.loadAudio(src, name)
            .then(function loadAudioSuccess(image) {
              defer.resolve();
              deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
            }, function loadAudioError(err) {
              defer.reject(new Error(err.name + ': ' + err.message + ' \'' + name + '\' from src \'' + src + '\''));
            });
          })(assetName, src, defer);
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
            _this.loadJSON(src, name)
            .then(function loadJsonSuccess(json) {
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
 * Return if an asset has already been loaded.
 * @public
 * @memberof AssetLoader
 * @param {string} asset - The name or URL of the asset.
 * @returns {boolean}
 */
AssetLoader.prototype.assetLoaded = function(asset) {
  return this.assets[asset] !== undefined;
};

/**
 * Load an Image file.
 * @public
 * @memberof AssetLoader
 * @param {string} url - The URL to the Image file. Resolve with the Image.
 * @param {string} [name] - The name to save to <code>this.assets</code>.
 * @returns {Promise} A deferred promise.
 */
AssetLoader.prototype.loadImage = function(url, name) {
  var _this = this;
  var deferred = q.defer();
  var image = new Image();
  image.status = 'loading';
  image.name = name;
  image.onload = function() {
    image.status = 'loaded';
    _this.assets[url] = image;

    if (name) {
      _this.assets[name] = image;
    }
    deferred.resolve(image);
  };
  image.onerror = function(error) {
    var err = new Error(error.message);
    deferred.reject(formatError(err, 'Unable to load Image'));
  };
  image.src = url;

  return deferred.promise;
};

/**
 * Load an Audio file.
 */
AssetLoader.prototype.loadAudio = function(url, name) {
  var _this = this;
  var deferred = q.defer();

  if (isString(url)) {
    url = [url];
  }

  // check that the browser can play one of the listed audio types
  var source, playableSrc;
  for (var i = 0, len = url.length; i < len; i++) {
    source = url[i];
    var extension = this.getExtension(source);

    // break on first audio type that is playable
    if (this.canPlay[extension]) {
      playableSrc = source;
      break;
    }
  }

  if (!playableSrc) {
    var err = new Error();
    deferred.reject(formatError(err, 'Browser cannot play any of the audio types provided'));
  }
  else {
    (function loadAudio(name, src) {
      var audio = new Audio();
      audio.status = 'loading';
      audio.addEventListener('canplay', function() {
        audio.status = 'loaded';
        _this.assets[url] = audio;

        if (name) {
          _this.assets[name] = audio;
        }
        deferred.resolve(audio);
      });
      audio.onerror = function(error) {
        var err = new Error(error.message);
        deferred.reject(formatError(err, 'Unable to load Audio'));
      };
      audio.src = src;
      audio.preload = 'auto';
      audio.load();

      // for iOS, just load the asset without adding it the promises array
      // the audio will be downloaded on user interaction instead
      if (_this.isiOS) {
        audio.status = 'loaded';
        _this.assets[url] = audio;

        if (name) {
          _this.assets[name] = audio;
        }
      }
    })(name, playableSrc);
  }

  return deferred.promise;
};

/**
 * Load a JavaScript file.
 * <p><strong>NOTE:</strong> This function does not add the asset to the assets dictionary.</p>
 * @public
 * @memberof AssetLoader
 * @param {string} url - The URL to the JavaScript file.
 * @returns {Promise} A deferred promise.
 */
AssetLoader.prototype.loadScript = function(url) {
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
 * <p><strong>NOTE:</strong> This function does not add the asset to the assets dictionary.</p>
 * @public
 * @memberof AssetLoader
 * @param {string} url - The URL to the CSS file.
 * @returns {Promise} A deferred promise.
 */
AssetLoader.prototype.loadCSS = function(url) {
  var deferred = q.defer();

  /*
   * Because of the lack of onload and onerror support for &lt;link> tags, we need to load the CSS
   * file via ajax and then put the contents of the file into a &lt;style> tag.
   * @see {@link http://pieisgood.org/test/script-link-events/}
   */
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
 * @memberof AssetLoader
 * @param {string} url - The URL to the JSON file.
 * @param {string} [name] - The name to save to <code>this.assets</code>.
 * @returns {Promise} A deferred promise. Resolves with the parsed JSON.
 * @throws {Error} When the JSON file fails to load.
 */
AssetLoader.prototype.loadJSON = function(url, name) {
  var _this = this;
  var deferred = q.defer();
  var req = new XMLHttpRequest();
  req.addEventListener('load', function JSONLoaded() {
    if (req.status === 200) {
      try {
        var json = JSON.parse(req.responseText);
        _this.assets[url] = json;

        if (name) {
          _this.assets[name] = json;
        }
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