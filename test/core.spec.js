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
  var extension;
  for (var i = 0, len = AL.supportedAssets.length; i < len; i++) {
    extension = AL.supportedAssets[i];

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