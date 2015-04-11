/*jshint -W084 */

var kontra = (function(kontra, q) {
  /**
   * Load an Image file.
   * @memberof kontra
   *
   * @param {string} url - The URL to the Image file.
   * @param {string} [name] - The name used to access <code>kontra.assets</code>. Name will default to the name of the Image.
   *
   * @returns {Promise} A deferred promise. Promise resolves with the Image.
   *
   * @example
   * kontra.loadImage('car.png');
   * kontra.loadImage('autobots/truck.png', 'optimus');
   */
  kontra.loadImage = function(url, name) {
    var deferred = q.defer();
    var image;

    url = this.paths.images + url;
    name = name || this.getAssetName(url);
    image = this.assets[name] = new Image();

    image.onload = function loadImageOnLoad() {
      deferred.resolve(this);
    };

    image.onerror = function loadImageOnError(error) {
      deferred.reject(error);
    };

    image.src = url;

    return deferred.promise;
  };

  /**
   * Load an Audio file. Supports loading multiple audio formats which be resolved by
   * the browser.
   * @memberof kontra
   *
   * @param {string|string[]} url - The URL to the Audio file.
   * @param {string} [name] - The name used to access <code>kontra.assets</code>. Name will default to the name of the Audio.
   *
   * @returns {Promise} A deferred promise. Promise resolves with the Audio.
   *
   * @example
   * kontra.loadAudio('explosion.mp3');
   * kontra.loadAudio('sound_effects/laser.ogg', 'ship_laser');
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
   * a time whereas iOS 6+ can handle more than one.
   * See this article for more details (http://pupunzi.open-lab.com/2013/03/13/making-html5-audio-actually-work-on-mobile/)
   *
   * Both iOS and Android will download an Audio through JavaScript, but neither will play
   * it until user interaction. You can get around this issue by having a splash screen
   * that requires user interaction to start the game and using that event to play the audio.
   * (http://jsfiddle.net/straker/5dsm6jgt/)
   */
  kontra.loadAudio = function(url, name) {
    var deferred = q.defer();
    var audio, playableSource;

    if (this.isString(url)) {
      url = [url];
    }

    // determine which audio format the browser can play
    for (var i = 0, source; source = url[i]; i++) {
      if ( this.canUse( this.getAssetExtension(source) ) ) {
        playableSource = source;
        break;
      }
    }

    if (!playableSource) {
      deferred.reject('Browser cannot play any of the audio formats provided');
    }
    else {
      source = this.paths.audios + source;
      name = name || this.getAssetName(source);
      audio = this.assets[name] = new Audio();

      audio.addEventListener('canplay', function loadAudioOnLoad() {
        deferred.resolve(this);
      });

      audio.onerror = function loadAudioOnError(error) {
        deferred.reject(error);
      };

      audio.src = source;
      audio.preload = 'auto';
      audio.load();
    }

    return deferred.promise;
  };


  /**
   * Load a data file (be it text or JSON).
   * @memberof kontra
   *
   * @param {string} url - The URL to the data file.
   * @param {string} [name] - The name used to access <code>kontra.assets</code>. Name will default to the name of the file.
   *
   * @returns {Promise} A deferred promise. Resolves with the data or parsed JSON.
   *
   * @example
   * kontra.loadData('dimensions.json');
   * kontra.loadData('autobiography.txt', 'bio');
   */
  kontra.loadData = function(url, name) {
    var deferred = q.defer();
    var req = new XMLHttpRequest();

    url = this.paths.data + url;
    name = name || this.getAssetName(url);

    req.addEventListener('load', function loadDataOnLoad() {
      if (req.status !== 200) {
        deferred.reject(req.responseText);
        return;
      }

      try {
        var json = JSON.parse(req.responseText);
        kontra.assets[name] = json;

        deferred.resolve(json);
      }
      catch (error) {
        var data = req.responseText;
        kontra.assets[name] = data;

        deferred.resolve(data);
      }
    });

    req.open('GET', url, true);
    req.send();

    return deferred.promise;
  };

  return kontra;
})(kontra || {}, q);