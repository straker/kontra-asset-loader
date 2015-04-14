/**
 * The MIT License
 *
 * Copyright (c) 2010-2012 Google, Inc. http://angularjs.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
window.q = qFactory(function(callback) {
  setTimeout(function() {
    callback();
  }, 0);
}, function(e) {
  console.error('qLite: ' + e.stack);
});

/**
 * Constructs a promise manager.
 *
 * @param {function(Function)} nextTick Function for executing functions in the next turn.
 * @param {function(...*)} exceptionHandler Function into which unexpected exceptions are passed for
 *     debugging purposes.
 * @returns {object} Promise manager.
 */
function qFactory(nextTick, exceptionHandler) {
  var toString = ({}).toString;
  var isFunction = function isFunction(value){return typeof value == 'function';};
  var isArray = function isArray(value) {return toString.call(value) === '[object Array]';};

  function forEach(obj, iterator, context) {
    var key;
    if (obj) {
      if (isFunction(obj)) {
        for (key in obj) {
          // Need to check if hasOwnProperty exists,
          // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
          if (key != 'prototype' && key != 'length' && key != 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
            iterator.call(context, obj[key], key);
          }
        }
      } else if (obj.forEach && obj.forEach !== forEach) {
        obj.forEach(iterator, context);
      } else if (isArray(obj)) {
        for (key = 0; key < obj.length; key++)
          iterator.call(context, obj[key], key);
      } else {
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            iterator.call(context, obj[key], key);
          }
        }
      }
    }
    return obj;
  }

  /**
   * @ngdoc method
   * @name $q#defer
   * @function
   *
   * @description
   * Creates a `Deferred` object which represents a task which will finish in the future.
   *
   * @returns {Deferred} Returns a new instance of deferred.
   */
  var defer = function() {
    var pending = [],
        value, deferred;

    deferred = {

      resolve: function(val) {
        if (pending) {
          var callbacks = pending;
          pending = undefined;
          value = ref(val);

          if (callbacks.length) {
            nextTick(function() {
              var callback;
              for (var i = 0, ii = callbacks.length; i < ii; i++) {
                callback = callbacks[i];
                value.then(callback[0], callback[1], callback[2]);
              }
            });
          }
        }
      },


      reject: function(reason) {
        deferred.resolve(createInternalRejectedPromise(reason));
      },


      notify: function(progress) {
        if (pending) {
          var callbacks = pending;

          if (pending.length) {
            nextTick(function() {
              var callback;
              for (var i = 0, ii = callbacks.length; i < ii; i++) {
                callback = callbacks[i];
                callback[2](progress);
              }
            });
          }
        }
      },


      promise: {
        then: function(callback, errback, progressback) {
          var result = defer();

          var wrappedCallback = function(value) {
            try {
              result.resolve((isFunction(callback) ? callback : defaultCallback)(value));
            } catch(e) {
              result.reject(e);
              exceptionHandler(e);
            }
          };

          var wrappedErrback = function(reason) {
            try {
              result.resolve((isFunction(errback) ? errback : defaultErrback)(reason));
            } catch(e) {
              result.reject(e);
              exceptionHandler(e);
            }
          };

          var wrappedProgressback = function(progress) {
            try {
              result.notify((isFunction(progressback) ? progressback : defaultCallback)(progress));
            } catch(e) {
              exceptionHandler(e);
            }
          };

          if (pending) {
            pending.push([wrappedCallback, wrappedErrback, wrappedProgressback]);
          } else {
            value.then(wrappedCallback, wrappedErrback, wrappedProgressback);
          }

          return result.promise;
        },

        "catch": function(callback) {
          return this.then(null, callback);
        },

        "finally": function(callback) {

          function makePromise(value, resolved) {
            var result = defer();
            if (resolved) {
              result.resolve(value);
            } else {
              result.reject(value);
            }
            return result.promise;
          }

          function handleCallback(value, isResolved) {
            var callbackOutput = null;
            try {
              callbackOutput = (callback ||defaultCallback)();
            } catch(e) {
              return makePromise(e, false);
            }
            if (callbackOutput && isFunction(callbackOutput.then)) {
              return callbackOutput.then(function() {
                return makePromise(value, isResolved);
              }, function(error) {
                return makePromise(error, false);
              });
            } else {
              return makePromise(value, isResolved);
            }
          }

          return this.then(function(value) {
            return handleCallback(value, true);
          }, function(error) {
            return handleCallback(error, false);
          });
        }
      }
    };

    return deferred;
  };


  var ref = function(value) {
    if (value && isFunction(value.then)) return value;
    return {
      then: function(callback) {
        var result = defer();
        nextTick(function() {
          result.resolve(callback(value));
        });
        return result.promise;
      }
    };
  };


  /**
   * @ngdoc method
   * @name $q#reject
   * @function
   *
   * @description
   * Creates a promise that is resolved as rejected with the specified `reason`. This api should be
   * used to forward rejection in a chain of promises. If you are dealing with the last promise in
   * a promise chain, you don't need to worry about it.
   *
   * When comparing deferreds/promises to the familiar behavior of try/catch/throw, think of
   * `reject` as the `throw` keyword in JavaScript. This also means that if you "catch" an error via
   * a promise error callback and you want to forward the error to the promise derived from the
   * current promise, you have to "rethrow" the error by returning a rejection constructed via
   * `reject`.
   *
   * ```js
   *   promiseB = promiseA.then(function(result) {
   *     // success: do something and resolve promiseB
   *     //          with the old or a new result
   *     return result;
   *   }, function(reason) {
   *     // error: handle the error if possible and
   *     //        resolve promiseB with newPromiseOrValue,
   *     //        otherwise forward the rejection to promiseB
   *     if (canHandle(reason)) {
   *      // handle the error and recover
   *      return newPromiseOrValue;
   *     }
   *     return $q.reject(reason);
   *   });
   * ```
   *
   * @param {*} reason Constant, message, exception or an object representing the rejection reason.
   * @returns {Promise} Returns a promise that was already resolved as rejected with the `reason`.
   */
  var reject = function(reason) {
    var result = defer();
    result.reject(reason);
    return result.promise;
  };

  var createInternalRejectedPromise = function(reason) {
    return {
      then: function(callback, errback) {
        var result = defer();
        nextTick(function() {
          try {
            result.resolve((isFunction(errback) ? errback : defaultErrback)(reason));
          } catch(e) {
            result.reject(e);
            exceptionHandler(e);
          }
        });
        return result.promise;
      }
    };
  };


  /**
   * @ngdoc method
   * @name $q#when
   * @function
   *
   * @description
   * Wraps an object that might be a value or a (3rd party) then-able promise into a $q promise.
   * This is useful when you are dealing with an object that might or might not be a promise, or if
   * the promise comes from a source that can't be trusted.
   *
   * @param {*} value Value or a promise
   * @returns {Promise} Returns a promise of the passed value or promise
   */
  var when = function(value, callback, errback, progressback) {
    var result = defer(),
        done;

    var wrappedCallback = function(value) {
      try {
        return (isFunction(callback) ? callback : defaultCallback)(value);
      } catch (e) {
        exceptionHandler(e);
        return reject(e);
      }
    };

    var wrappedErrback = function(reason) {
      try {
        return (isFunction(errback) ? errback : defaultErrback)(reason);
      } catch (e) {
        exceptionHandler(e);
        return reject(e);
      }
    };

    var wrappedProgressback = function(progress) {
      try {
        return (isFunction(progressback) ? progressback : defaultCallback)(progress);
      } catch (e) {
        exceptionHandler(e);
      }
    };

    nextTick(function() {
      ref(value).then(function(value) {
        if (done) return;
        done = true;
        result.resolve(ref(value).then(wrappedCallback, wrappedErrback, wrappedProgressback));
      }, function(reason) {
        if (done) return;
        done = true;
        result.resolve(wrappedErrback(reason));
      }, function(progress) {
        if (done) return;
        result.notify(wrappedProgressback(progress));
      });
    });

    return result.promise;
  };


  function defaultCallback(value) {
    return value;
  }


  function defaultErrback(reason) {
    return reject(reason);
  }


  /**
   * @ngdoc method
   * @name $q#all
   * @function
   *
   * @description
   * Combines multiple promises into a single promise that is resolved when all of the input
   * promises are resolved.
   *
   * @param {Array.<Promise>|Object.<Promise>} promises An array or hash of promises.
   * @returns {Promise} Returns a single promise that will be resolved with an array/hash of values,
   *   each value corresponding to the promise at the same index/key in the `promises` array/hash.
   *   If any of the promises is resolved with a rejection, this resulting promise will be rejected
   *   with the same rejection value.
   */
  function all(promises) {
    var deferred = defer(),
        counter = 0,
        results = isArray(promises) ? [] : {};

    forEach(promises, function(promise, key) {
      counter++;
      ref(promise).then(function(value) {
        if (results.hasOwnProperty(key)) return;
        results[key] = value;
        if (!(--counter)) deferred.resolve(results);
      }, function(reason) {
        if (results.hasOwnProperty(key)) return;
        deferred.reject(reason);
      }, function(reason) {
        if (results.hasOwnProperty(key)) return;
        deferred.notify(reason);
      });
    });

    if (counter === 0) {
      deferred.resolve(results);
    }

    return deferred.promise;
  }

  return {
    defer: defer,
    reject: reject,
    when: when,
    all: all
  };
}
var kontra = (function(kontra) {
  var isImage = /(jpeg|jpg|gif|png)$/;
  var isAudio = /(wav|mp3|ogg|aac|m4a)$/;
  var folderSeparator = /(\\|\/)/g;

  // all assets are stored by name as well as by URL
  kontra.images = {};
  kontra.audios = {};
  kontra.data = {};

  // base asset path for determining asset URLs
  kontra.assetPaths = {
    images: '',
    audios: '',
    data: '',
  };

  // audio playability
  // @see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/audio.js
  var audio = new Audio();
  kontra.canUse = kontra.canUse || {};
  kontra.canUse.wav = '';
  kontra.canUse.mp3 = audio.canPlayType('audio/mpeg;').replace(/^no$/,'');
  kontra.canUse.ogg = audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
  kontra.canUse.aac = audio.canPlayType('audio/aac;').replace(/^no$/,'');
  kontra.canUse.m4a = (audio.canPlayType('audio/x-m4a;') || kontra.canUse.aac).replace(/^no$/,'');

  /**
   * Get the extension of an asset.
   * @see http://jsperf.com/extract-file-extension
   * @memberOf kontra
   *
   * @param {string} url - The URL to the asset.
   *
   * @returns {string}
   */
  kontra.getAssetExtension = function getAssetExtension(url) {
    return url.substr((~-url.lastIndexOf(".") >>> 0) + 2);
  };

  /**
   * Get the type of asset based on its extension.
   * @memberOf kontra
   *
   * @param {string} url - The URL to the asset.
   *
   * @returns {string} Image, Audio, Data.
   */
  kontra.getAssetType = function getAssetType(url) {
    var extension = this.getAssetExtension(url);

    if (extension.match(isImage)) {
      return 'Image';
    }
    else if (extension.match(isAudio)) {
      return 'Audio';
    }
    else {
      return 'Data';
    }
  };

  /**
   * Get the name of an asset.
   * @memberOf kontra
   *
   * @param {string} url - The URL to the asset.
   *
   * @returns {string}
   */
  kontra.getAssetName = function getAssetName(url) {
    return url.replace(/\.[^/.]+$/, "");
  };

  return kontra;
})(kontra || {});
/*jshint -W084 */

var kontra = (function(kontra, q) {
  /**
   * Load an Image, Audio, or data file.
   * @memberOf kontra
   *
   * @param {string|string[]} - Comma separated list of assets to load.
   *
   * @returns {Promise} A deferred promise.
   *
   * @example
   * kontra.loadAsset('car.png');
   * kontra.loadAsset(['explosion.mp3', 'explosion.ogg']);
   * kontra.loadAsset('bio.json');
   * kontra.loadAsset('car.png', ['explosion.mp3', 'explosion.ogg'], 'bio.json');
   */
  kontra.loadAssets = function loadAsset() {
    var deferred = q.defer();
    var promises = [];
    var numLoaded = 0;
    var numAssets = arguments.length;
    var type, name, url;

    if (!arguments.length) {
      deferred.resolve();
    }

    for (var i = 0, asset; asset = arguments[i]; i++) {
      if (!Array.isArray(asset)) {
        url = asset;
      }
      else {
        url = asset[0];
      }

      type = this.getAssetType(url);

      // create a closure for event binding
      (function(assetDeferred) {
        promises.push(assetDeferred.promise);

        kontra['load' + type](url).then(
          function loadAssetSuccess() {
            assetDeferred.resolve();
            deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
          },
          function loadAssetError(error) {
            assetDeferred.reject(error);
        });
      })(q.defer());
    }

    q.all(promises).then(
      function loadAssetsSuccess() {
        deferred.resolve();
      },
      function loadAssetsError(error) {
        deferred.reject(error);
    });

    return deferred.promise;
  };

  /**
   * Load an Image file. Uses assetPaths.images to resolve URL.
   * @memberOf kontra
   *
   * @param {string} url - The URL to the Image file.
   *
   * @returns {Promise} A deferred promise. Promise resolves with the Image.
   *
   * @example
   * kontra.loadImage('car.png');
   * kontra.loadImage('autobots/truck.png');
   */
  kontra.loadImage = function(url) {
    var deferred = q.defer();
    var name = this.getAssetName(url);
    var image = new Image();

    url = this.assetPaths.images + url;

    image.onload = function loadImageOnLoad() {
      kontra.images[name] = kontra.images[url] = this;
      deferred.resolve(this);
    };

    image.onerror = function loadImageOnError() {
      deferred.reject('Unable to load image ' + url);
    };

    image.src = url;

    return deferred.promise;
  };

  /**
   * Load an Audio file. Supports loading multiple audio formats which will be resolved by
   * the browser in the order listed. Uses assetPaths.audios to resolve URL.
   * @memberOf kontra
   *
   * @param {string|string[]} url - The URL to the Audio file.
   *
   * @returns {Promise} A deferred promise. Promise resolves with the Audio.
   *
   * @example
   * kontra.loadAudio('sound_effects/laser.mp3');
   * kontra.loadAudio(['explosion.mp3', 'explosion.m4a', 'explosion.ogg']);
   *
   * There are two ways to load Audio in the web: HTML5 Audio or the Web Audio API.
   * HTML5 Audio has amazing browser support, including back to IE9
   * (http://caniuse.com/#feat=audio). However, the web Audio API isn't supported in
   * IE nor Android Browsers (http://caniuse.com/#search=Web%20Audio%20API).
   *
   * To support the most browsers we'll use HTML5 Audio. However, doing so means we'll
   * have to work around mobile device limitations as well as Audio implementation
   * limitations.
   *
   * Android browsers require playing Audio through user interaction whereas iOS 6+ can
   * play through normal JavaScript. Moreover, Android can only play one sound source at
   * a time whereas iOS 6+ can handle more than one. See this article for more details
   * (http://pupunzi.open-lab.com/2013/03/13/making-html5-audio-actually-work-on-mobile/)
   *
   * Both iOS and Android will download an Audio through JavaScript, but neither will play
   * it until user interaction. You can get around this issue by having a splash screen
   * that requires user interaction to start the game and using that event to play the audio.
   * (http://jsfiddle.net/straker/5dsm6jgt/)
   */
  kontra.loadAudio = function(url) {
    var deferred = q.defer();
    var source, name, playableSource, audio;

    if (!Array.isArray(url)) {
      url = [url];
    }

    // determine which audio format the browser can play
    for (var i = 0; source = url[i]; i++) {
      if ( this.canUse[this.getAssetExtension(source)] ) {
        playableSource = source;
        break;
      }
    }

    if (!playableSource) {
      deferred.reject('Browser cannot play any of the audio formats provided');
    }
    else {
      name = this.getAssetName(playableSource);
      audio = new Audio();

      source = this.assetPaths.audios + playableSource;

      audio.addEventListener('canplay', function loadAudioOnLoad() {
        kontra.audios[name] = kontra.audios[source] = this;
        deferred.resolve(this);
      });

      audio.onerror = function loadAudioOnError() {
        deferred.reject('Unable to load audio ' + source);
      };

      audio.src = source;
      audio.preload = 'auto';
      audio.load();
    }

    return deferred.promise;
  };


  /**
   * Load a data file (be it text or JSON). Uses assetPaths.data to resolve URL.
   * @memberOf kontra
   *
   * @param {string} url - The URL to the data file.
   *
   * @returns {Promise} A deferred promise. Resolves with the data or parsed JSON.
   *
   * @example
   * kontra.loadData('bio.json');
   * kontra.loadData('dialog.txt');
   */
  kontra.loadData = function(url) {
    var deferred = q.defer();
    var req = new XMLHttpRequest();
    var name = this.getAssetName(url);
    var dataUrl = this.assetPaths.data + url;

    req.addEventListener('load', function loadDataOnLoad() {
      if (req.status !== 200) {
        deferred.reject(req.responseText);
        return;
      }

      try {
        var json = JSON.parse(req.responseText);
        kontra.data[name] = kontra.data[dataUrl] = json;

        deferred.resolve(json);
      }
      catch(e) {
        var data = req.responseText;
        kontra.data[name] = kontra.data[dataUrl] = data;

        deferred.resolve(data);
      }
    });

    req.open('GET', dataUrl, true);
    req.send();

    return deferred.promise;
  };

  return kontra;
})(kontra || {}, q);
/*jshint -W084 */

var kontra = (function(kontra, q) {
  kontra.bundles = {};

  /**
   * Create a group of assets that can be loaded using <code>kontra.loadBundle()</code>.
   * @memberOf kontra
   *
   * @param {string} bundle - The name of the bundle.
   * @param {string[]} assets - Assets to add to the bundle.
   *
   * @example
   * kontra.createBundle('myBundle', ['car.png', ['explosion.mp3', 'explosion.ogg']]);
   */
  kontra.createBundle = function createBundle(bundle, assets) {
    if (this.bundles[bundle]) {
      return;
    }

    this.bundles[bundle] = assets || [];
  };

  /**
   * Load all assets that are part of a bundle.
   * @memberOf kontra
   *
   * @param {string|string[]} - Comma separated list of bundles to load.
   *
   * @returns {Promise} A deferred promise.
   *
   * @example
   * kontra.loadBundles('myBundle');
   * kontra.loadBundles('myBundle', 'myOtherBundle');
   */
  kontra.loadBundles = function loadBundles() {
    var deferred = q.defer();
    var promises = [];
    var numLoaded = 0;
    var numAssets = 0;
    var assets;

    for (var i = 0, bundle; bundle = arguments[i]; i++) {
      if (!(assets = this.bundles[bundle])) {
        deferred.reject('Bundle \'' + bundle + '\' has not been created.');
        continue;
      }

      numAssets += assets.length;

      promises.push(this.loadAssets.apply(this, assets));
    }

    q.all(promises).then(
      function loadBundlesSuccess() {
        deferred.resolve();
      },
      function loadBundlesError(error) {
        deferred.reject(error);
      },
      function loadBundlesNofity() {
        deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
    });

    return deferred.promise;
  };

  return kontra;
})(kontra || {}, q);
/*jshint -W084 */

var kontra = (function(kontra, q) {
  /**
   * Load an asset manifest file.
   * @memberOf kontra
   *
   * @param {string} url - The URL to the asset manifest file.
   *
   * @returns {Promise} A deferred promise.
   */
  kontra.loadManifest = function loadManifest(url) {
    var deferred = q.defer();
    var bundles;

    kontra.loadData(url).then(
      function loadManifestSuccess(manifest) {
        kontra.assetPaths.images = manifest.imagePath || '';
        kontra.assetPaths.audios = manifest.audioPath || '';
        kontra.assetPaths.data = manifest.dataPath || '';

        // create bundles and add assets
        for (var i = 0, bundle; bundle = manifest.bundles[i]; i++) {
          kontra.createBundle(bundle.name, bundle.assets);
        }

        if (!manifest.loadBundles) {
          deferred.resolve();
          return;
        }

        // load all bundles
        if (manifest.loadBundles === 'all') {
          bundles = Object.keys(kontra.bundles || {});
        }
        // load a single bundle
        else if (!Array.isArray(manifest.loadBundles)) {
          bundles = [manifest.loadBundles];
        }
        // load multiple bundles
        else {
          bundles = manifest.loadBundles;
        }

        kontra.loadBundles.apply(kontra, bundles).then(
          function loadBundlesSuccess() {
            deferred.resolve();
          },
          function loadBundlesError(error) {
            deferred.reject(error);
          },
          function loadBundlesNotify(progress) {
            deferred.notify(progress);
        });
      },
      function loadManifestError(error) {
        deferred.reject(error);
    });

    return deferred.promise;
  };

  return kontra;
})(kontra || {}, q);