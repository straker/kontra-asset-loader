/**
 * Helper function for testing that a CSS file was loaded onto the page by getting
 * the property value of the specified element.
 *
 * @param {string} id       - The ID attribute of the element.
 * @param {string} property - The name of the property to get.
 *
 * @returns {string} The property value
 */
function getCSS(id, property) {
  if (!document.getElementById(id)) {
    // append the element to the DOM
    var div = document.createElement('div');
    div.setAttribute('id', id);
    document.body.appendChild(div);
  }

  return window.getComputedStyle(document.getElementById(id),null).getPropertyValue(property);
}





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

asyncTest('should load the image and resolve with it.', function() {
  expect(6);

  AL.loadImage('./imgs/bullet.gif', 'bullet').then(function(image) {
    ok(image, 'image successfully loaded.');
    ok(image instanceof Image, 'image returned as Image object.');

    ok(AL.assets['./imgs/bullet.gif'], 'asset \'./imgs/bullet.gif\' exists.');
    equal(AL.assets['./imgs/bullet.gif'], image, 'asset \'./imgs/bullet.gif\' is the correct image.');

    ok(AL.assets['bullet'], 'asset \'bullet\' exists.');
    equal(AL.assets['bullet'], image, 'asset \'bullet\' is the correct image.');

    start();
  }, function(err) {
    start();
  });
});

asyncTest('should throw an error if the image fails to load.', function() {
  expect(1);

  AL.loadImage('someFile.gif').then(function() {
  }, function(err) {
    ok(1, 'deferred promise was rejected.');
    start();
  });
});





/***************************************************************
 *
 * loadAudio
 *
 ***************************************************************/
module('AssetLoader.loadAudio', {
  setup: function() {
    AL = new AssetLoader();
  },
  teardown: function() {
    AL = undefined;
  }
});

asyncTest('should load the audio and resolve with it.', function() {
  expect(6);

  AL.loadAudio('./audio/shoot.mp3', 'shoot').then(function(audio) {
    ok(audio, 'audio successfully loaded.');
    ok(audio instanceof Audio, 'audio returned as audio object.');

    ok(AL.assets['./audio/shoot.mp3'], 'asset \'./audio/shoot.mp3\' exists.');
    equal(AL.assets['./audio/shoot.mp3'], audio, 'asset \'./audio/shoot.mp3\' is the correct audio.');

    ok(AL.assets['shoot'], 'asset \'shoot\' exists.');
    equal(AL.assets['shoot'], audio, 'asset \'shoot\' is the correct audio.');

    start();
  }, function(err) {
    start();
  });
});

asyncTest('should throw an error if the audio fails to load.', function() {
  expect(1);

  AL.loadAudio('someFile.mp3').then(function() {
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
    equal($('script[src="//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"]').length, 1, 'script was added to the DOM.');
    ok($, 'jQuery successfully loaded.')
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

asyncTest('should load a single audio asset as Audio.', function() {
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