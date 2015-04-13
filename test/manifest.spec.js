/***************************************************************
 *
 * loadManifest
 *
 ***************************************************************/
module('kontra.loadManifest', {
  teardown: function() {
    resetKontra();
  }
});

asyncTest('should load all bundles in the manifest.', function() {
  expect(2);

  kontra.loadManifest('./json/test.json').then(function() {
    ok(kontra.bundles.level1, 'bundle \'level1\' successfully loaded.');
    ok(kontra.bundles.level2, 'bundle \'level2\' successfully loaded.');
    start();
  });
});

asyncTest('should add all assets to their bundles.', function() {
  expect(2);

  kontra.loadManifest('./json/test.json').then(function() {
    ok(kontra.bundles.level1[0], 'asset \'bg\' successfully added to bundle \'level1\'.');
    ok(kontra.bundles.level2[0], 'asset \'bg\' successfully added to bundle \'level2\'.');
    start();
  });
});

asyncTest('should not auto load assets if there is no property \'loadBundles\'.', function() {
  expect(1);

  kontra.loadManifest('./json/test.json').then(function() {
    ok(!kontra.data['./imgs/bullet.png'], 'asset \'./imgs/bullet.png\' not loaded.');
    start();
  });
});

asyncTest('should auto load assets if property \'loadBundles\' is set to a single bundle name.', function() {
  expect(1);

  kontra.loadManifest('./json/loadBundlesSingle.json').then(function() {
    ok(kontra.images['./imgs/bullet.png'], 'asset \'./imgs/bullet.png\' loaded.');
    start();
  });
});

asyncTest('should auto load assets if property \'loadBundles\' is set to multiple bundle names.', function() {
  expect(2);

  kontra.loadManifest('./json/loadBundlesMultiple.json').then(function() {
    ok(kontra.images['./imgs/bullet.png'], 'asset \'./imgs/bullet.png\' loaded.');
    ok(kontra.images['./imgs/bullet.jpg'], 'asset \'./imgs/bullet.jpg"\' loaded.');
    start();
  });
});

asyncTest('should auto load assets if property \'loadBundles\' is set to \'all\'.', function() {
  expect(2);

  kontra.loadManifest('./json/loadBundlesAll.json').then(function() {
    ok(kontra.images['./imgs/bullet.png'], 'asset \'./imgs/bullet.png\' loaded.');
    ok(kontra.images['./imgs/bullet.jpg'], 'asset \'./imgs/bullet.jpg"\' loaded.');
    start();
  });
});

asyncTest('should throw an error if the manifest fails to load.', function() {
  expect(1);

  kontra.loadManifest('someFile.json').then(function() {
  }, function(err) {
    ok(1, 'deferred promise was rejected.');
    start();
  });
});

asyncTest('should propagate errors.', function() {
  expect(1);

  kontra.loadManifest('./json/badBunle.json').then(function() {
  }, function(err) {
    ok(1, 'error propagated.');
    start();
  });
});

asyncTest('should notify user of progress.', function() {
  expect(1);

  kontra.loadManifest('./json/loadBundlesSingle.json').then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event.');
    start();
  });
});

asyncTest('should set assetPaths from the manifest.', function() {
  expect(3);

  kontra.loadManifest('./json/test.json').then(function() {
    equal(kontra.assetPaths.images, 'imgs/', 'assetPaths.images correctly set');
    equal(kontra.assetPaths.audios, 'audio/', 'assetPaths.audios correctly set');
    equal(kontra.assetPaths.data, 'json/', 'assetPaths.data correctly set');

    start();
  }, function(err) {
    start();
  });
});