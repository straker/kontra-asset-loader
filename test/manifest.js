/***************************************************************
 *
 * loadManifest
 *
 ***************************************************************/
module('AssetLoader.loadManifest', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

asyncTest('should load all bundles in the manifest.', function() {
  expect(2);

  AL.loadManifest('./json/test.json').then(function() {
    ok(AL.bundles.level1, 'bundle \'level1\' successfully loaded.');
    ok(AL.bundles.level2, 'bundle \'level2\' successfully loaded.');
    start();
  });
});

asyncTest('should add all assets to their bundles.', function() {
  expect(2);

  AL.loadManifest('./json/test.json').then(function() {
    ok(AL.bundles.level1.bg, 'asset \'bg\' successfully added to bundle \'level1\'.');
    ok(AL.bundles.level2.bg, 'asset \'bg\' successfully added to bundle \'level2\'.');
    start();
  });
});

asyncTest('should not auto load assets if property \'loadBundles\' is false.', function() {
  expect(1);

  AL.loadManifest('./json/test.json').then(function() {
    ok(!AL.assets.bg, 'asset \'bg\' not loaded.');
    start();
  });
});

asyncTest('should auto load assets if property \'loadBundles\' is set to a single bundle name.', function() {
  expect(1);

  AL.loadManifest('./json/loadBundlesSingle.json').then(function() {
    ok(AL.assets.bg, 'asset \'bg\' loaded.');
    start();
  });
});

asyncTest('should auto load assets if property \'loadBundles\' is set to multiple bundle names.', function() {
  expect(2);

  AL.loadManifest('./json/loadBundlesMultiple.json').then(function() {
    ok(AL.assets.bg, 'asset \'bg\' loaded.');
    ok(AL.assets.bullet, 'asset \'bullet\' loaded.');
    start();
  });
});

asyncTest('should auto load assets if property \'loadBundles\' is set to \'all\'.', function() {
  expect(2);

  AL.loadManifest('./json/loadBundlesAll.json').then(function() {
    ok(AL.assets.bg, 'asset \'bg\' loaded.');
    ok(AL.assets.bullet, 'asset \'bullet\' loaded.');
    start();
  });
});

asyncTest('should not process the manifest if it has already been loaded.', function() {
  expect(2);

  // fake the manifest already having been loaded
  AL.manifestUrl = './json/test.json';

  AL.loadManifest('./json/test.json').then(function() {
    ok(!AL.bundles.level1, 'bundle \'level1\' was not loaded from the manifest.');
    ok(!AL.assets.bg, 'asset \'bg\' was not loaded from the manifest.')
    start();
  }, function(err) {
    ok(0, err.message);
    start();
  }, function(progress) {
    ok(0, progress);
    start();
  });
});

asyncTest('should throw an error if the manifest fails to load.', function() {
  expect(1);

  AL.loadManifest('someFile.json').then(function() {
  }, function(err) {
    ok(1, 'deferred promise was rejected.');
    start();
  });
});

asyncTest('should propagate errors.', function() {
  expect(1);

  AL.loadManifest('./json/badBunle.json').then(function() {
  }, function(err) {
    ok(1, 'error propagated.');
    start();
  });
});

asyncTest('should notify user of progress.', function() {
  expect(1);

  AL.loadManifest('./json/loadBundlesSingle.json').then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event.');
    start();
  });
});