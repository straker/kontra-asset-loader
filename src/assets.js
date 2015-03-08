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
 * @returns {Promise} A deferred promise. Resolves with the parsed JSON.
 * @throws {Error} When the JSON file fails to load.
 */
AssetLoader.prototype.loadJSON = function(url) {
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