/***************************************************************
 *
 * createBundle
 *
 ***************************************************************/
module('AssetLoader.createBundle', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

test('should accept a string as an argument.', function() {
  AL.createBundle('testBundle');
  ok(AL.bundles.testBundle, 'bundle \'testBundle\' successfully created.');
});

test('should accept an array as an argument.', function() {
  AL.createBundle(['anotherBundle', 'anotherSecondBundle']);
  ok(AL.bundles.anotherBundle, 'bundle \'anotherBundle\' successfully created.');
  ok(AL.bundles.anotherSecondBundle, 'bundle \'anotherSecondBundle\' successfully created.');
});

test('should throw an error if the bundle name already exists.', function() {
  AL.createBundle('testBundle');
  throws(
    function() {
      AL.createBundle('testBundle');
    },
    'bundle \'testBundle\' already created.'
  );
});





/***************************************************************
 *
 * addBundleAsset
 *
 ***************************************************************/
module('AssetLoader.addBundleAsset', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

test('should add a single asset to a bundle.', function() {
  AL.createBundle('myBundle');
  AL.addBundleAsset('myBundle', {'myAsset': 'myAssetUrl'});

  equal(AL.bundles.myBundle.myAsset, 'myAssetUrl', 'asset \'myAsset\' successfully added to the bundle \'myBundle\'.');
});

test('should add multiple assets to a bundle.', function() {
  AL.createBundle('myBundle');
  AL.addBundleAsset('myBundle', {'myAsset1': 'myAsset1Url', 'myAsset2': 'myAsset2Url'});

  equal(AL.bundles.myBundle.myAsset1, 'myAsset1Url', 'asset \'myAsset1\' successfully added to the bundle \'myBundle\'.');
  equal(AL.bundles.myBundle.myAsset2, 'myAsset2Url', 'asset \'myAsset2\' successfully added to the bundle \'myBundle\'.');
});

test('should throw an error if the bundle has not been created.', function() {
  throws(
    function() {
      AL.addBundleAsset('myBundle', {'myAsset1': 'myAsset1Url'});
    },
    'bundle \'myBundle\' not created before adding assets.'
  );
});





/***************************************************************
 *
 * loadBundle
 *
 ***************************************************************/
module('AssetLoader.loadBundle', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

asyncTest('should throw an error if the bundle has not been created.', function() {
  expect(1);

  AL.loadBundle('myBundle').then(function() {
  }, function(err) {
    ok(1, 'bundle \'myBundle\' not created.');
    start();
  });
});

asyncTest('should load all assets from a single bundle.', function() {
  expect(1);

  AL.createBundle('myBundle');
  AL.addBundleAsset('myBundle', {'bullet': './imgs/bullet.jpeg'});

  AL.loadBundle('myBundle').then(function() {
    ok(AL.assets.bullet, 'asset \'bullet\' successfully loaded from bundle \'myBundle\'.');
    start();
  });
});

asyncTest('should load all assets from multiple bundles.', function() {
  expect(2);

  AL.createBundle(['myBundle', 'otherBundle']);
  AL.addBundleAsset('myBundle', {'bullet': './imgs/bullet.jpeg'});
  AL.addBundleAsset('otherBundle', {'other': './imgs/bullet.jpeg'});

  AL.loadBundle(['myBundle', 'otherBundle']).then(function() {
    ok(AL.assets.bullet, 'asset \'bullet\' successfully loaded from bundle \'myBundle\'.');
    ok(AL.assets.other, 'asset \'other\' successfully loaded from bundle \'otherBundle\'.')
    start();
  });
});

asyncTest('should propagate errors.', function() {
  expect(1);

  AL.createBundle('myBundle');
  AL.addBundleAsset('myBundle', {'test': 'test.css'})

  AL.loadBundle('myBundle').then(function() {
  }, function(err) {
    ok(1, 'error propagated.');
    start();
  });
});

asyncTest('should notify user of progress and properly count the number of assets for a single bundle with a single asset.', function() {
  expect(2);

  AL.createBundle('myBundle');
  AL.addBundleAsset('myBundle', {'bullet': './imgs/bullet.jpeg'});

  AL.loadBundle('myBundle').then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event fired ' + progress.loaded + ' time for bundle \'myBundle\'.');  // should fire once
    if (progress.loaded === progress.total) {
      equal(progress.total, 1, 'assets counted correctly for bundle \'myBundle\'.');
      start();
    }
  });
});

asyncTest('should notify user of progress and properly count the number of assets for a single bundle with a multiple assets.', function() {
  expect(5);

  AL.createBundle('otherBundle');
  AL.addBundleAsset('otherBundle', {
    'jpeg': './imgs/bullet.jpeg',
    'manifest': './json/test.json',
    'testScript': './js/testScript.js',
    'testCSS': './css/testCSS.css'
  });

  AL.loadBundle('otherBundle').then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event fired ' + progress.loaded + ' ' + (progress.loaded === 1 ? 'time' : 'times') + ' for bundle \'otherBundle\'.');  // should fire four times
    if (progress.loaded === progress.total) {
      equal(progress.total, 4, 'assets counted correctly for bundle \'otherBundle\'.');
      start();
    }
  });
});

asyncTest('should notify user of progress and properly count the number of assets for a multiple bundles.', function() {
  expect(6);

  AL.createBundle(['myBundle', 'otherBundle']);
  AL.addBundleAsset('myBundle', {'bullet': './imgs/bullet.jpeg'});
  AL.addBundleAsset('otherBundle', {
    'jpeg': './imgs/bullet.jpeg',
    'manifest': './json/test.json',
    'testScript': './js/testScript.js',
    'testCSS': './css/testCSS.css'
  });

  AL.loadBundle(['myBundle', 'otherBundle']).then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event fired ' + progress.loaded + ' ' + (progress.loaded === 1 ? 'time' : 'times') + ' for bundles \'myBundle\' and \'otherBundle\'.');  // should fire five times
    if (progress.loaded === progress.total) {
      equal(progress.total, 5, 'assets counted correctly for bundles \'myBundle\' and \'otherBundle\'.');
      start();
    }
  });
});