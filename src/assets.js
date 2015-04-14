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