/**
 * @fileoverview Asset Manager Example - Manifest Loading.
 * @author steven@sklambert.com (Steven Lambert)
 *
 * Art assets by Master484 {@link http://opengameart.org/users/master484}
 * Audio assets by BossLevelVGM {@link http://opengameart.org/users/bosslevelvgm}
 */
(function() {
  var pBar = document.getElementById('progress-bar');
  var percent = document.getElementById('percent')

  kontra.loadManifest('manifest.json').then(function() {
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