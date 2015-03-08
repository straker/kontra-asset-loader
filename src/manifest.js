/**
 * Load an asset manifest file.
 * @public
 * @memberof AssetLoader
 * @param {string} url - The URL to the asset manifest file.
 * @returns {Promise} A deferred promise.
 */
AssetLoader.prototype.loadManifest = function(url) {
  var _this = this;
  var deferred = q.defer();
  var i, len, bundle, bundles;

  // load the manifest only if it hasn't been loaded
  if (this.manifestUrl !== url) {
    this.loadJSON(url)
    .then(function loadMainfestJSONSuccess(manifest) {

      _this.manifest = manifest;
      _this.manifestUrl = url;
      _this.assetRoot = manifest.assetRoot || './';

      // create bundles and add assets
      try {
        for (i = 0, len = manifest.bundles.length; i < len; i++) {
          bundle = manifest.bundles[i];
          _this.createBundle(bundle.name, true);
          _this.addBundleAsset(bundle.name, bundle.assets, true);
        }
      }
      catch (err) {
        deferred.reject(err);
      }

      // load bundles
      if (manifest.loadBundles) {

        if (isString(manifest.loadBundles)) {
          // load all bundles
          if (manifest.loadBundles === 'all') {
            bundles = Object.keys(_this.bundles || {});
          }
          else {
            bundles = [manifest.loadBundles];
          }
        }
        else if (manifest.loadBundles instanceof Array) {
          bundles = manifest.loadBundles;
        }

        _this.loadBundle(bundles)
        .then(function loadMainfestSuccess() {
          deferred.resolve();
        }, function loadMainfestError(err) {
          deferred.reject(err);
        }, function loadMainfestNotify(progress) {
          deferred.notify(progress);
        });
      }
      else {
        deferred.resolve();
      }
    }, function loadMainfestJSONError(err) {
      err.message = err.message.replace('JSON', 'manifest');
      deferred.reject(err);
    });
  }
  else {
    deferred.resolve();
  }

  return deferred.promise;
};