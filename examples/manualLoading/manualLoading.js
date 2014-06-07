/**
 * @fileoverview Asset Manager Example - Manual Loading.
 * @author steven@sklambert.com (Steven Lambert)
 *
 * Art assets by Master484 {@link http://opengameart.org/users/master484}
 * Audio assets by BossLevelVGM {@link http://opengameart.org/users/bosslevelvgm}
 */
(function() {
  var pBar = document.getElementById('progress-bar');
  var percent = document.getElementById('percent')
  var AM = new AssetManager();

  AM.createBundle('level1');
  AM.addBundleAsset('level1', {
    "bg": "../imgs/road.png",
    "player": "../imgs/sports_car.png",
    "car": "../imgs/car.png",
    "car_left": "../imgs/car_left.png",
    "motorcycle": "../imgs/motorcycle.png",
    "motorcycle_left": "../imgs/motorcycle_left.png"
  });

  AM.loadBundle('level1').then(function() {
    showPlayButton();
  }, function(err) {
    console.error(err.message);
  }, function(progress) {
    console.log('Asset loaded. Loaded ' + progress.loaded + ' of ' + progress.total);
    pBar.value = progress.loaded / progress.total;
    percent.innerHTML = Math.round(pBar.value * 100) + "%";
  });

  function showPlayButton() {
    var playButton = document.getElementById('play');
    playButton.style.visibility = 'visible';
  }
})();