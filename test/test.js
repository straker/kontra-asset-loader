function getCSS(id, property) {
  return window.getComputedStyle(document.getElementById(id),null).getPropertyValue(property);
}

module('AssetLoader', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

test('should be instantiable', function() {
  ok(new AssetLoader(), 'successfully called new on AssetLoader.');
});





/***************************************************************
 *
 * getExtension
 *
 ***************************************************************/
module('AssetLoader.getExtension', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

test('should return the correct file extension', function() {
  var extensions = ['jpeg', 'jpg', 'gif', 'png', 'wav', 'mp3', 'ogg', 'acc', 'm4a', 'js', 'css', 'json'];

  var extension;
  for (var i = 0, len = extensions.length; i < len; i++) {
    extension = extensions[i];

    equal(AL.getExtension('path.to.file.' + extension), extension, extension.toUpperCase() + ' correctly returned as ' + extension + '.');
  }
});





/***************************************************************
 *
 * getType
 *
 ***************************************************************/
module('AssetLoader.getType', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

test('should return image extensions as images.', function() {
  equal(AL.getType('image.jpeg'), 'image', 'JPEG correctly returned as image.');
  equal(AL.getType('image_gif.jpg'), 'image', 'JPG correctly returned as image.');
  equal(AL.getType('image.new.gif'), 'image', 'GIF correctly returned as image.');
  equal(AL.getType('imageA_1@.png'), 'image', 'PNG correctly returned as image.');
});

test('should return audio extensions as audios.', function() {
  equal(AL.getType('audio.wav'), 'audio', 'WAV correctly returned as audio.');
  equal(AL.getType('audio_1.mp3'), 'audio', 'MP3 correctly returned as audio.');
  equal(AL.getType('audio.new.ogg'), 'audio', 'OGG correctly returned as audio.');
  equal(AL.getType('audioA_1@.aac'), 'audio', 'AAC correctly returned as audio.');
  equal(AL.getType('audio.N64_acc.m4a'), 'audio', 'M4A correctly returned as audio.');
});

test('should return js extensions as js.', function() {
  equal(AL.getType('javascript.js'), 'js', 'JS correctly returned as js.');
});

test('should return css extensions as css.', function() {
  equal(AL.getType('stylesheet.css'), 'css', 'CSS correctly returned as css.');
});

test('should return json extensions as json.', function() {
  equal(AL.getType('jsonp.json'), 'json', 'JSON correctly returned as json.');
});





/***************************************************************
 *
 * loadImage
 *
 ***************************************************************/
module('AssetLoader.loadImage', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

asyncTest('should load the image.', function() {
  expect(3);

  AL.loadImage('./imgs/bullet.gif', 'bullet').then(function(image) {
    ok(image, 'json successfully loaded.');
    ok(AL.assets['./imgs/bullet.gif'], 'asset \'./imgs/bullet.gif\' exists.');
    ok(AL.assets['bullet'], 'asset \'bullet\' exists.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should throw an error if the image fails to load.', function() {
  expect(1);

  AL.loadImage('fakeImage.gif').then(function() {
  }, function(err) {
    ok(1, 'deferred promise was rejected.');
    start();
  });
});





/***************************************************************
 *
 * loadScript
 *
 ***************************************************************/
module('AssetLoader.loadScript', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

asyncTest('should load the script into the DOM.', function() {
  expect(2);

  AL.loadScript('//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js').then(function() {
    equal($('body').length, 1, 'jQuery successfully loaded.');
    equal($('script[src="//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"]').length, 1, 'script was added to the DOM.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should throw an error if the script fails to load.', function() {
  expect(1);

  AL.loadScript('someFile.js').then(function() {
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
module('AssetLoader.loadCSS', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

asyncTest('should load the css into the DOM.', function() {
  expect(2);

  AL.loadCSS('./css/test.css').then(function() {
    equal(document.querySelectorAll('style[data-url="./css/test.css"]').length, 1, 'css was added to the DOM.');
    equal(getCSS('testDiv', 'position'), 'relative', 'css successfully loaded.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should throw an error if the css fails to load.', function() {
  expect(1);

  AL.loadCSS('someFile.css').then(function() {
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
module('AssetLoader.loadJSON', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

asyncTest('should load the parsed JSON.', function() {
  expect(3);

  AL.loadJSON('./json/test.json').then(function(json) {
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

  AL.loadCSS('someFile.json').then(function() {
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
 * loadAsset
 *
 ***************************************************************/
module('AssetLoader.loadAsset', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

asyncTest('should load image assets as Images.', function() {
  expect(4);

  var counter = 4;
  function done() {
    --counter || start();
  }

  AL.loadAsset({'jpeg': './imgs/bullet.jpeg'}).then(function() {
    ok(AL.assets.jpeg instanceof Image, '.jpeg loaded as an Image.');
    done();
  }, function(err) {
    done();
  });

  AL.loadAsset({'jpg': './imgs/bullet.jpg'}).then(function() {
    ok(AL.assets.jpg instanceof Image, '.jpg loaded as an Image.');
    done();
  }, function(err) {
    done();
  });

  AL.loadAsset({'gif': './imgs/bullet.gif'}).then(function() {
    ok(AL.assets.gif instanceof Image, '.gif loaded as an Image.');
    done();
  }, function(err) {
    done();
  });

  AL.loadAsset({'png': './imgs/bullet.png'}).then(function() {
    ok(AL.assets.png instanceof Image, '.png loaded as an Image.');
    done();
  }, function(err) {
    done();
  });
});

asyncTest('should throw an error if the browser cannot play an audio format.', function() {
  expect(1);

  AL.loadAsset({'nope': ['./audio/shoot.nope']}).then(function() {
  }, function(err) {
    ok(1, 'browser could not load asset.');
    start();
  });
});

asyncTest('should load a single audio assets as Audios.', function() {
  expect(1);

  // find the first audio format that is playable and use it for the test
  for (var format in AL.canPlay) {
    if (AL.canPlay.hasOwnProperty(format) && AL.canPlay[format]) {
      AL.loadAsset({'music': './audio/shoot.' + format}).then(function() {
        ok(AL.assets.music instanceof Audio, 'asset \'music\' loaded as an Audio.');
        start();
      }, function(err) {
        start();
      });
      break;
    }
  }
});

asyncTest('should load multiple audio assets as Audios.', function() {
  expect(1);

  AL.loadAsset({'shoot': ['./audio/shoot.wav', './audio/shoot.mp3', './audio/shoot.ogg', './audio/shoot.aac', './audio/shoot.m4a']}).then(function() {
    ok(AL.assets.shoot instanceof Audio, 'asset \'shoot\' loaded as an Audio.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should load .js assets.', function() {
  expect(1);

  AL.loadAsset({'testScript': './js/testScript.js'}).then(function() {
    equal(window.myGlobalVariable, 'loaded', '.js loaded as JavaScript.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should load .css assets.', function() {
  expect(1);

  AL.loadAsset({'testCSS': './css/testCSS.css'}).then(function() {
    equal(getCSS('testDiv', 'position'), 'absolute', '.css loaded as Stylesheet.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should load .json assets.', function() {
  expect(1);

  AL.loadAsset({'manifest': './json/test.json'}).then(function(json) {
    ok(AL.assets.manifest, '.json loaded as JSON.');
    start();
  }, function(err) {
    start();
  });
});

asyncTest('should throw an error if the file extension is not supported.', function() {
  expect(1);

  AL.loadAsset({'blah': 'blah.blah'}).then(function() {
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

  AL.loadAsset({}).then(function() {
    ok(1, 'deferred resolved with empty object.');
    done();
  }, function(err) {
    done();
  });

  AL.loadAsset().then(function() {
    ok(1, 'deferred resolved with undefined.');
    done();
  }, function(err) {
    done();
  });
});

asyncTest('should propagate errors.', function() {
  expect(1);

  AL.loadAsset({'test': 'test.css'}).then(function() {
  }, function(err) {
    ok(1, 'error propagated.');
    start();
  });
});

asyncTest('should notify user of progress and properly count the number of assets for a single asset.', function() {
  expect(2);

  AL.loadAsset({'jpeg': './imgs/bullet.jpeg'}).then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event fired ' + progress.loaded + ' time for single asset.');  // should fire once
    if (progress.loaded === progress.total) {
      equal(progress.total, 1, 'assets counted correctly for single asset.');
      start();
    }
  });
});

asyncTest('should notify user of progress and properly count the number of assets for multiple assets.', function() {
  expect(5);

  AL.loadAsset({
    'jpeg': './imgs/bullet.jpeg',
    'manifest': './json/test.json',
    'testScript': './js/testScript.js',
    'testCSS': './css/testCSS.css'
  }).then(function() {
  }, function(err) {
  }, function(progress) {
    ok(1, 'progress event fired ' + progress.loaded + ' ' + (progress.loaded === 1 ? 'time' : 'times') + ' for multiple assets.');  // should fire four times
    if (progress.loaded === progress.total) {
      equal(progress.total, 4, 'assets counted correctly for multiple assets.');
      start();
    }
  });
});





/***************************************************************
 *
 * assetLoaded
 *
 ***************************************************************/
module('AssetLoader.assetLoaded', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

asyncTest('should return true if asset has been loaded,', function() {
  expect(2);

  AL.loadAsset({'jpeg': './imgs/bullet.jpeg'}).then(function() {
    equal(AL.assetLoaded('jpeg'), true, 'Asset \'jpeg\' has been loaded.');
    equal(AL.assetLoaded('./imgs/bullet.jpeg'), true, 'Asset \'./imgs/bullet.jpeg\' has been loaded.');
    start();
  }, function(err) {
    start();
  });
});

test('should return false if asset has not been loaded,', function() {
  equal(AL.assetLoaded('gif'), false, 'Asset \'gif\' has not been loaded.');
  equal(AL.assetLoaded('gif'), false, 'Asset \'./imgs/bullet.gif\' has not been loaded.');
});

asyncTest('should return false if asset failed to load,', function() {
  expect(2);

  AL.loadAsset({'badImage': 'badImage.gif'}).then(function() {
    start();
  }, function(err) {
    equal(AL.assetLoaded('badImage'), false, 'Asset \'badImage\' was not loaded.');
    equal(AL.assetLoaded('badImage.gif'), false, 'Asset \'badImage.gif\' was not loaded.');
    start();
  });
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