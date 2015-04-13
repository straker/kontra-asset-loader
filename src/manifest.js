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
        else if (kontra.isString(manifest.loadBundles)) {
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