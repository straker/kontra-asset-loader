function getCSS(id, property) {
  return window.getComputedStyle(document.getElementById(id),null).getPropertyValue(property);
}

module('AssetManager', {
  setup: function() {
    AM = new AssetManager();
  },
  teardown: function() {
    AM = undefined;
  }
});

test('should be instantiable', function() {
  ok(new AssetManager(), 'successfully called new on AssetManager.');
});





/***************************************************************
 *
 * loadScript
 *
 ***************************************************************/
module('AssetManager.loadScript', {
  setup: function() {
    AM = new AssetManager();
  },
  teardown: function() {
    AM = undefined;
  }
});

asyncTest('should load the script into the DOM.', function() {
  expect(2);

  AM.loadScript('//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js').then(function() {
    equal($('body').length, 1, 'jQuery successfully loaded.');
    equal($('script[src="//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"]').length, 1, 'script was added to the DOM.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should throw an error if the script fails to load.', function() {
  expect(1);

  AM.loadScript('someFile.js').then(function() {
  }, function(err) {
    ok(1, 'deferred promise was rejected.');
    start();
  });
});




/***************************************************************
 *
 * loadCSS
 *
 ***************************************************************/
module('AssetManager.loadCSS', {
  setup: function() {
    AM = new AssetManager();
  },
  teardown: function() {
    AM = undefined;
  }
});

asyncTest('should load the css into the DOM.', function() {
  expect(2);

  AM.loadCSS('./css/test.css').then(function() {
    equal(document.querySelectorAll('style[data-url="./css/test.css"]').length, 1, 'css was added to the DOM.');
    equal(getCSS('testDiv', 'position'), 'relative', 'css successfully loaded.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should throw an error if the css fails to load.', function() {
  expect(1);

  AM.loadCSS('someFile.css').then(function() {
  }, function(err) {
    ok(1, 'deferred promise was rejected.');
    start();
  });
});





/***************************************************************
 *
 * loadJSON
 *
 ***************************************************************/
module('AssetManager.loadJSON', {
  setup: function() {
    AM = new AssetManager();
  },
  teardown: function() {
    AM = undefined;
  }
});

asyncTest('should load the parsed JSON.', function() {
  expect(3);

  AM.loadJSON('./json/test.json').then(function(json) {
    ok(json, 'json successfully loaded.');
    ok(json.test, 'property \'test\' exists.');
    equal(json.test, 'hello', 'property \'test\' is correct.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should throw an error if the json fails to load.', function() {
  expect(1);

  AM.loadCSS('someFile.json').then(function() {
  }, function(err) {
    ok(1, 'deferred promise was rejected.');
    start();
  });
});





/***************************************************************
 *
 * createBundle
 *
 ***************************************************************/
module('AssetManager.createBundle', {
  setup: function() {
    AM = new AssetManager();
  },
  teardown: function() {
    AM = undefined;
  }
});

test('should accept a string as an argument.', function() {
  AM.createBundle('testBundle');
  ok(AM.bundles.testBundle, 'bundle \'testBundle\' successfully created.');
});

test('should accept an array as an argument.', function() {
  AM.createBundle(['anotherBundle', 'anotherSecondBundle']);
  ok(AM.bundles.anotherBundle, 'bundle \'anotherBundle\' successfully created.');
  ok(AM.bundles.anotherSecondBundle, 'bundle \'anotherSecondBundle\' successfully created.');
});

test('should throw an error if the bundle name already exists.', function() {
  AM.createBundle('testBundle');
  throws(
    function() {
      AM.createBundle('testBundle');
    },
    'bundle \'testBundle\' already created.'
  );
});





/***************************************************************
 *
 * addBundleAsset
 *
 ***************************************************************/
module('AssetManager.addBundleAsset', {
  setup: function() {
    AM = new AssetManager();
  },
  teardown: function() {
    AM = undefined;
  }
});

test('should add a single asset to a bundle.', function() {
  AM.createBundle('myBundle');
  AM.addBundleAsset('myBundle', {'myAsset': 'myAssetUrl'});

  equal(AM.bundles.myBundle.myAsset, 'myAssetUrl', 'asset \'myAsset\' successfully added to the bundle \'myBundle\'.');
});

test('should add multiple assets to a bundle.', function() {
  AM.createBundle('myBundle');
  AM.addBundleAsset('myBundle', {'myAsset1': 'myAsset1Url', 'myAsset2': 'myAsset2Url'});

  equal(AM.bundles.myBundle.myAsset1, 'myAsset1Url', 'asset \'myAsset1\' successfully added to the bundle \'myBundle\'.');
  equal(AM.bundles.myBundle.myAsset2, 'myAsset2Url', 'asset \'myAsset2\' successfully added to the bundle \'myBundle\'.');
});

test('should throw an error if the bundle has not been created.', function() {
  throws(
    function() {
      AM.addBundleAsset('myBundle', {'myAsset1': 'myAsset1Url'});
    },
    'bundle \'myBundle\' not created before adding assets.'
  );
});





/***************************************************************
 *
 * loadAsset
 *
 ***************************************************************/
module('AssetManager.loadAsset', {
  setup: function() {
    AM = new AssetManager();
  },
  teardown: function() {
    AM = undefined;
  }
});

asyncTest('should load image assets as Images.', function() {
  expect(4);

  var counter = 4;
  function done() {
    --counter || start();
  }

  AM.loadAsset({'jpeg': './imgs/bullet.jpeg'}).then(function() {
    ok(AM.assets.jpeg instanceof Image, '.jpeg loaded as an Image.');
    done();
  }, function(err) {
    done();
  });

  AM.loadAsset({'jpg': './imgs/bullet.jpg'}).then(function() {
    ok(AM.assets.jpg instanceof Image, '.jpg loaded as an Image.');
    done();
  }, function(err) {
    done();
  });

  AM.loadAsset({'gif': './imgs/bullet.gif'}).then(function() {
    ok(AM.assets.gif instanceof Image, '.gif loaded as an Image.');
    done();
  }, function(err) {
    done();
  });

  AM.loadAsset({'png': './imgs/bullet.png'}).then(function() {
    ok(AM.assets.png instanceof Image, '.png loaded as an Image.');
    done();
  }, function(err) {
    done();
  });
});

asyncTest('should throw an error if the browser cannot play an audio format.', function() {
  expect(1);

  AM.loadAsset({'nope': ['./audio/shoot.nope']}).then(function() {
  }, function(err) {
    ok(1, 'browser could not load asset.');
    start();
  });
});

// Testing audio is both browser dependent and unreliable, but we can at least test .wav files for the majority of browsers.
asyncTest('should load a single audio assets as Audios.', function() {
  expect(1);

  AM.loadAsset({'wav': './audio/shoot.wav'}).then(function() {
    ok(AM.assets.wav instanceof Audio, '.wav loaded as an Audio.');
    start();
  }, function(err) {
    ok(!AM.canPlay.wav, '.wav is not playable in this browser, so this test is ok to not work.');
    start();
  });
});

asyncTest('should load multiple audio assets as Audios.', function() {
  expect(1);

  AM.loadAsset({'shoot': ['./audio/shoot.wav', './audio/shoot.mp3', './audio/shoot.ogg', './audio/shoot.aac', './audio/shoot.m4a']}).then(function() {
    ok(AM.assets.shoot instanceof Audio, 'asset \'shoot\' loaded as an Audio.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should load .js assets.', function() {
  expect(1);

  AM.loadAsset({'testScript': './js/testScript.js'}).then(function() {
    equal(window.myGlobalVariable, 'loaded', '.js loaded as JavaScript.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should load .css assets.', function() {
  expect(1);

  AM.loadAsset({'testCSS': './css/testCSS.css'}).then(function() {
    equal(getCSS('testDiv', 'position'), 'absolute', '.css loaded as Stylesheet.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should load .json assets.', function() {
  expect(1);

  AM.loadAsset({'manifest': './json/test.json'}).then(function(json) {
    ok(AM.assets.manifest, '.json loaded as JSON.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should throw an error if the file extension is not supported.', function() {
  expect(1);

  AM.loadAsset({'blah': 'blah.blah'}).then(function() {
  }, function(err) {
    ok(1, 'file extension \.blah\' not supported.');
    start();
  });
});

asyncTest('should immediately resolve if the asset is empty.', function() {
  expect(2);

  var counter = 2;
  function done() {
    --counter || start();
  }

  AM.loadAsset({}).then(function() {
    ok(1, 'deferred resolved with empty object.');
    done();
  }, function(err) {
    done();
  });

  AM.loadAsset().then(function() {
    ok(1, 'deferred resolved with undefined.');
    done();
  }, function(err) {
    done();
  });
});

asyncTest('should propagate errors.', function() {
  expect(1);

  AM.loadAsset({'test': 'test.css'}).then(function() {
  }, function(err) {
    ok(1, 'error propagated.');
    start();
  });
});

asyncTest('should notify user of progress.', function() {
  expect(1);

  AM.loadAsset({'test': './css/test.css'}).then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event.');
    start();
  });
});




/***************************************************************
 *
 * loadBunle
 *
 ***************************************************************/
 module('AssetManager.loadBundle', {
  setup: function() {
    AM = new AssetManager();
  },
  teardown: function() {
    AM = undefined;
  }
});

asyncTest('should throw an error if the bundle has not been created.', function() {
  expect(1);

  AM.loadBundle('myBundle').then(function() {
  }, function(err) {
    ok(1, 'bundle \'myBundle\' not created.');
    start();
  });
});

asyncTest('should load all assets from a single bundle.', function() {
  expect(1);

  AM.createBundle('myBundle');
  AM.addBundleAsset('myBundle', {'bullet': './imgs/bullet.jpeg'});

  AM.loadBundle('myBundle').then(function() {
    ok(AM.assets.bullet, 'asset \'bullet\' successfully loaded from bundle \'myBundle\'.');
    start();
  });
});

asyncTest('should load all assets from multiple bundles.', function() {
  expect(2);

  AM.createBundle(['myBundle', 'otherBundle']);
  AM.addBundleAsset('myBundle', {'bullet': './imgs/bullet.jpeg'});
  AM.addBundleAsset('otherBundle', {'other': './imgs/bullet.jpeg'});

  AM.loadBundle(['myBundle', 'otherBundle']).then(function() {
    ok(AM.assets.bullet, 'asset \'bullet\' successfully loaded from bundle \'myBundle\'.');
    ok(AM.assets.other, 'asset \'other\' successfully loaded from bundle \'otherBundle\'.')
    start();
  });
});

asyncTest('should propagate errors.', function() {
  expect(1);

  AM.createBundle('myBundle');
  AM.addBundleAsset('myBundle', {'test': 'test.css'})

  AM.loadBundle('myBundle').then(function() {
  }, function(err) {
    ok(1, 'error propagated.');
    start();
  });
});

asyncTest('should notify user of progress.', function() {
  expect(1);

  AM.createBundle(['myBundle', 'otherBundle']);
  AM.addBundleAsset('myBundle', {'bullet': './imgs/bullet.jpeg'});

  AM.loadBundle('myBundle').then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event.');
    start();
  });
});




/***************************************************************
 *
 * loadManifest
 *
 ***************************************************************/
module('AssetManager.loadManifest', {
  setup: function() {
    AM = new AssetManager();
  },
  teardown: function() {
    AM = undefined;
  }
});

asyncTest('should load all bundles in the manifest.', function() {
  expect(2);

  AM.loadManifest('./json/test.json').then(function() {
    ok(AM.bundles.level1, 'bundle \'level1\' successfully loaded.');
    ok(AM.bundles.level2, 'bundle \'level2\' successfully loaded.');
    start();
  });
});

asyncTest('should add all assets to their bundles.', function() {
  expect(2);

  AM.loadManifest('./json/test.json').then(function() {
    ok(AM.bundles.level1.bg, 'asset \'bg\' successfully added to bundle \'level1\'.');
    ok(AM.bundles.level2.bg, 'asset \'bg\' successfully added to bundle \'level2\'.');
    start();
  });
});

asyncTest('should not auto load assets if property \'loadBundles\' is false.', function() {
  expect(1);

  AM.loadManifest('./json/test.json').then(function() {
    ok(!AM.assets.bg, 'asset \'bg\' not loaded.');
    start();
  });
});

asyncTest('should auto load assets if property \'loadBundles\' is set to a single bundle name.', function() {
  expect(1);

  AM.loadManifest('./json/loadBundlesSingle.json').then(function() {
    ok(AM.assets.bg, 'asset \'bg\' loaded.');
    start();
  });
});

asyncTest('should auto load assets if property \'loadBundles\' is set to multiple bundle names.', function() {
  expect(2);

  AM.loadManifest('./json/loadBundlesMultiple.json').then(function() {
    ok(AM.assets.bg, 'asset \'bg\' loaded.');
    ok(AM.assets.bullet, 'asset \'bullet\' loaded.');
    start();
  });
});

asyncTest('should auto load assets if property \'loadBundles\' is set to \'all\'.', function() {
  expect(2);

  AM.loadManifest('./json/loadBundlesAll.json').then(function() {
    ok(AM.assets.bg, 'asset \'bg\' loaded.');
    ok(AM.assets.bullet, 'asset \'bullet\' loaded.');
    start();
  });
});

asyncTest('should immediately resolve if the manifest has already been loaded.', function() {
  expect(2);

  AM.loadManifest('./json/test.json').then(function() {
    ok(1, 'manifest loaded the first time.');
    AM.loadManifest('./json/test.json').then(function() {
      ok(1, 'manifest loaded the second time');
      start();
    });
  });
});

asyncTest('should throw an error if the manifest fails to load.', function() {
  expect(1);

  AM.loadManifest('someFile.json').then(function() {
  }, function(err) {
    ok(1, 'deferred promise was rejected.');
    start();
  });
});

asyncTest('should propagate errors.', function() {
  expect(1);

  AM.loadManifest('./json/badBunle.json').then(function() {
  }, function(err) {
    ok(1, 'error propagated.');
    start();
  });
});

asyncTest('should notify user of progress.', function() {
  expect(1);

  AM.loadManifest('./json/loadBundlesSingle.json').then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event.');
    start();
  });
});