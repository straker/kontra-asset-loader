/**
 * Functionality shared between kontra-asset-loader and kontra.js
 */
var kontra = (function(kontra, document) {
  /**
   * Determine if a value is a String.
   * @memberOf kontra
   *
   * @param {*} value - Value to test.
   *
   * @returns {boolean}
   */
  kontra.isString = function isString(value) {
    return typeof value === 'string';
  };

  return kontra;
})(kontra || {}, document);