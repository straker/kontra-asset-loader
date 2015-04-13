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