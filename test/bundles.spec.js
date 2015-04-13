/***************************************************************
 *
 * createBundle
 *
 ***************************************************************/
module('kontra.createBundle', {
  teardown: function() {
    resetKontra();
  }
});

test('should accept a string as an argument.', function() {
  kontra.createBundle('testBundle');
  ok(kontra.bundles.testBundle, 'bundle \'testBundle\' successfully created.');
});

test('should accept an array of assets to add to the bundle.', function() {
  kontra.createBundle('anotherBundle', ['imgs/bullet.gif', 'audio/shoot.mp3']);

  ok(kontra.bundles.anotherBundle, 'bundle \'anotherBundle\' successfully created.');
  equal(kontra.bundles.anotherBundle[0], 'imgs/bullet.gif', 'asset \'imgs/bullet.gif\' added to the bundle.');
  equal(kontra.bundles.anotherBundle[1], 'audio/shoot.mp3', 'asset \'audio/shoot.mp3\' added to the bundle.');
});





/***************************************************************
 *
 * loadBundles
 *
 ***************************************************************/
module('kontra.loadBundles', {
  teardown: function() {
    resetKontra();
  }
});

asyncTest('should throw an error if the bundle has not been created.', function() {
  expect(1);

  kontra.loadBundles('myBundle').then(function() {
  }, function(err) {
    ok(1, 'bundle \'myBundle\' not created.');
    start();
  });
});

asyncTest('should load all assets from a single bundle.', function() {
  expect(1);

  kontra.createBundle('myBundle', ['./imgs/bullet.jpeg']);

  kontra.loadBundles('myBundle').then(function() {
    ok(kontra.images['./imgs/bullet.jpeg'], 'asset \'./imgs/bullet.jpeg\' successfully loaded from bundle \'myBundle\'.');
    start();
  });
});

asyncTest('should load all assets from multiple bundles.', function() {
  expect(2);

  kontra.createBundle('myBundle', ['./imgs/bullet.jpeg']);
  kontra.createBundle('otherBundle', ['./imgs/bullet.png']);

  kontra.loadBundles('myBundle', 'otherBundle').then(function() {
    ok(kontra.images['./imgs/bullet.jpeg'], 'asset \'./imgs/bullet.jpeg\' successfully loaded from bundle \'myBundle\'.');
    ok(kontra.images['./imgs/bullet.png'], 'asset \'./imgs/bullet.png\' successfully loaded from bundle \'otherBundle\'.')
    start();
  });
});

asyncTest('should propagate errors.', function() {
  expect(1);

  kontra.createBundle('myBundle', ['test.png']);

  kontra.loadBundles('myBundle').then(function() {
  }, function(err) {
    ok(1, 'error propagated.');
    start();
  });
});

asyncTest('should notify user of progress and properly count the number of assets for a single bundle with a single asset.', function() {
  expect(2);

  kontra.createBundle('myBundle', ['./imgs/bullet.jpeg']);

  kontra.loadBundles('myBundle').then(function() {
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
  expect(3);

  kontra.createBundle('otherBundle', [
    './imgs/bullet.jpeg',
    './json/test.json',
  ]);

  kontra.loadBundles('otherBundle').then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event fired ' + progress.loaded + ' ' + (progress.loaded === 1 ? 'time' : 'times') + ' for bundle \'otherBundle\'.');  // should fire twice
    if (progress.loaded === progress.total) {
      equal(progress.total, 2, 'assets counted correctly for bundle \'otherBundle\'.');
      start();
    }
  });
});

asyncTest('should notify user of progress and properly count the number of assets for a multiple bundles.', function() {
  expect(4);

  kontra.createBundle('myBundle', ['./imgs/bullet.jpeg']);
  kontra.createBundle('otherBundle', [
    './imgs/bullet.jpeg',
    './json/test.json',
  ]);

  kontra.loadBundles('myBundle', 'otherBundle').then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event fired ' + progress.loaded + ' ' + (progress.loaded === 1 ? 'time' : 'times') + ' for bundles \'myBundle\' and \'otherBundle\'.');  // should fire 3 times
    if (progress.loaded === progress.total) {
      equal(progress.total, 3, 'assets counted correctly for bundles \'myBundle\' and \'otherBundle\'.');
      start();
    }
  });
});