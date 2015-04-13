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