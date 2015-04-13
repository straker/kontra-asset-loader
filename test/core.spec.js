// reset kontra to it's original state
function resetKontra() {
  kontra.images = {};
  kontra.audios = {};
  kontra.data = {};

  kontra.assetPaths = {
    images: '',
    audios: '',
    data: '',
  };

  kontra.bundles = {};
}





/***************************************************************
 *
 * getAssetExtension
 *
 ***************************************************************/
module('kontra.getAssetExtension', {
  teardown: function() {
    resetKontra();
  }
});

test('should return the correct file extension', function() {
  var extension;
  ['jpeg', 'jpg', 'gif', 'png', 'wav', 'mp3', 'ogg' ,'aac', 'm4a', 'json', 'txt'].forEach(function(extension) {

    equal(kontra.getAssetExtension('path.to.file.' + extension), extension, extension.toUpperCase() + ' correctly returned as ' + extension + '.');
  });
});





/***************************************************************
 *
 * getAssetType
 *
 ***************************************************************/
module('kontra.getAssetType', {
  teardown: function() {
    resetKontra();
  }
});

test('should return image extensions as images.', function() {
  equal(kontra.getAssetType('image.jpeg'), 'Image', 'JPEG correctly returned as Image.');
  equal(kontra.getAssetType('image_gif.jpg'), 'Image', 'JPG correctly returned as Image.');
  equal(kontra.getAssetType('image.new.gif'), 'Image', 'GIF correctly returned as Image.');
  equal(kontra.getAssetType('imageA_1@.png'), 'Image', 'PNG correctly returned as Image.');
});

test('should return audio extensions as audios.', function() {
  equal(kontra.getAssetType('audio.wav'), 'Audio', 'WAV correctly returned as Audio.');
  equal(kontra.getAssetType('audio_1.mp3'), 'Audio', 'MP3 correctly returned as Audio.');
  equal(kontra.getAssetType('audio.new.ogg'), 'Audio', 'OGG correctly returned as Audio.');
  equal(kontra.getAssetType('audioA_1@.aac'), 'Audio', 'AAC correctly returned as Audio.');
  equal(kontra.getAssetType('audio.N64_acc.m4a'), 'Audio', 'M4A correctly returned as Audio.');
});

test('should return json extensions as data.', function() {
  equal(kontra.getAssetType('jsonp.json'), 'Data', 'JSON correctly returned as Data.');
  equal(kontra.getAssetType('text.txt'), 'Data', 'TXT correctly returned as Data.');
});





/***************************************************************
 *
 * getAssetName
 *
 ***************************************************************/
module('kontra.getAssetName', {
  teardown: function() {
    resetKontra();
  }
});

test('should return the file name without the extension.', function() {
  equal(kontra.getAssetName('image.jpeg'), 'image', 'Asset name \'image\' returned correctly.');
  equal(kontra.getAssetName('image.test.gif'), 'image.test', 'Asset name \'image.test\' returned correctly.');
  equal(kontra.getAssetName('audio/explosion.ogg'), 'audio/explosion', 'Asset name \'audio/explosion\' returned correctly.');
  equal(kontra.getAssetName('my_json_object1@.json'), 'my_json_object1@', 'Asset name \'my_json_object1@\' returned correctly.');
});