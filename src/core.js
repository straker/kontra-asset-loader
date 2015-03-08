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
 * @fileoverview HTML5 JavaScript asset loader. Part of the Kontra game library.
 * @author steven@sklambert.com (Steven Lambert)
 * @requires qLite.js
 */

// save the toString method for objects
var toString = ({}).toString;

/**
 * @class AssetLoader
 * @property {string} manifestUrl - The URL to the manifest file.
 * @property {object} manifest    - The JSON parsed manifest file.
 * @property {object} assets      - List of loaded assets.
 * @property {string} assetRoot   - Root directive for all assets.
 * @property {object} bundles     - List of created bundles.
 * @property {object} canPlay     - List of audio type compatibility.
 */
function AssetLoader() {
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
}

/**
 * Add a bundle to the bundles dictionary.
 * @private
 * @memberof AssetLoader
 * @param {string} bundleName - The name of the bundle.
 * @throws {Error} If the bundle already exists.
 */
function addBundle(bundleName) {
  if (this.bundles[bundleName]) {
    throw new Error('Bundle \'' + bundleName + '\' already created');
  }
  else {
    // make the status property in-enumerable so it isn't returned in a for-in loop
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
 * @memberof AssetLoader
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
 * @memberof AssetLoader
 * @param {object} obj - The object to test.
 * @returns {boolean} True if the object is a string.
 */
function isString(obj) {
  return toString.call(obj) === '[object String]';
}

/**
 * Return the type of asset based on it's extension.
 * @private
 * @memberof AssetLoader
 * @param {string} url - The URL to the asset.
 * @returns {string} image, audio, js, json.
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
 * Return the extension of an asset.
 * @private
 * @memberof AssetLoader
 * @param {string} url - The URL to the asset.
 * @returns {string}
 */
function getExtension(url) {
  // @see {@link http://jsperf.com/extract-file-extension}
  return url.substr((~-url.lastIndexOf(".") >>> 0) + 2);
}

/**
 * Format Error messages for better output.
 * Use this function right before passing the Error to the user.
 * @private
 * @memberOf AssetLoader
 * @param {Error}  err - Error object.
 * @param {string} msg - Custom message.
 * @returns {string} The formated err message.
 */
function formatError(err, msg) {
  err.originalMessage = err.message;
  err.message = 'AssetLoader: ' + msg + '\n\t' + err.stack;
  return err;
}