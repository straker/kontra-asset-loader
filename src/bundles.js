/**
 * Create a bundle.
 * @public
 * @memberof AssetLoader
 *
 * @param {string|array} bundle    - The name of the bundle(s).
 * @param {boolean}      isPromise - If this function is called by a function that uses a promise.
 *
 * @throws {Error} If the bundle name already exists.
 *
 * @example
 * AssetLoader.createBundle('bundleName');
 * AssetLoader.createBundle(['bundle1', 'bundle2']);
 */
AssetLoader.prototype.createBundle = function(bundle, isPromise) {
  try {
    // list of bundle names
    if (bundle instanceof Array) {
      for (var i = 0, len = bundle.length; i < len; i++) {
        addBundle.call(this, bundle[i]);
      }
    }
    // single bundle name
    else {
      addBundle.call(this, bundle);
    }
  }
  catch(err) {
    if (isPromise) {
      throw formatError(err, 'Unable to create bundle');
    }
    else {
      throw err;
    }
  }
};

/**
 * Load all assets in a bundle.
 * @public
 * @memberof AssetLoader
 *
 * @param {string|array} bundle - The name of the bundle(s).
 *
 * @returns {Promise} A deferred promise.
 *
 * @throws {ReferenceError} If the bundle has not be created.
 *
 * @example
 * AssetLoader.loadBundle('bundleName');
 * AssetLoader.loadBundle(['bundle1', 'bundle2']);
 */
AssetLoader.prototype.loadBundle = function(bundle) {
  var _this = this;
  var numLoaded = 0;
  var numAssets = 0;
  var bundles = [];
  var deferred = q.defer();  // defer to return
  var promises = [];  // keep track of all assets loaded
  var assets;

  if (bundle instanceof Array) {
    bundles = bundle;
  }
  else if (isString(bundle)) {
    bundles = [bundle];
  }

  for (var i = 0, len = bundles.length; i < len; i++) {
    assets = this.bundles[ bundles[i] ];

    if (!assets) {
      var err = new ReferenceError('Bundle not created');
      deferred.reject(formatError(err, 'Unable to load bundle \'' + bundle + '\''));
      return deferred.promise;
    }

    numAssets += countAssets.call(this, assets);

    assets.status = 'loading';
    promises.push(this.loadAsset(assets));
  }

  (function(_this, bundles) {
    q.all(promises)
    .then(function loadBundlesSuccess() {
      for (var i = 0, len = bundles.length; i < len; i++) {
        _this.bundles[ bundles[i] ].status = 'loaded';
      }

      deferred.resolve();
    }, function loadBundlesError(err) {
      deferred.reject(err);
    }, function loadBundlesNotify() {
      // notify user of progress
      deferred.notify({'loaded': ++numLoaded, 'total': numAssets});
    });
  })(_this, bundles);

  return deferred.promise;
};

/**
 * Add an asset to a bundle.
 * @public
 * @memberof AssetLoader
 *
 * @param {string}  bundleName - The name of the bundle.
 * @param {object}  asset      - The asset(s) to add to the bundle.
 * @param {boolean} isPromise  - If this function is called by a function that uses a promise.
 *
 * @throws {ReferenceError} If the bundle has not be created.
 *
 * @example
 * AssetLoader.addBundleAsset('bundleName', {'assetName': 'assetUrl'});
 * AssetLoader.addBundleAsset('bundleName', {'asset1': 'asset1Url', 'asset2': 'asset2Url'});
 */
AssetLoader.prototype.addBundleAsset = function(bundleName, asset, isPromise) {
  if (!this.bundles[bundleName]) {
    var err = new ReferenceError('Bundle not created');

    // format the error message for a promises reject
    if (isPromise) {
      throw formatError(err, 'Unable to add asset to bundle \'' + bundleName + '\'');
    }
    else {
      throw err;
    }
  }
  else {
    for (var assetName in asset) {
      if (asset.hasOwnProperty(assetName)) {
        this.bundles[bundleName][assetName] = asset[assetName];
      }
    }
  }
};

/**
 * Add a bundle to the bundles dictionary.
 * @private
 * @memberof AssetLoader
 *
 * @param {string} bundleName - The name of the bundle.
 *
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