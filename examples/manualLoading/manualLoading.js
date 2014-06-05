/*
 * Copyright (C) 2014 Steven Lambert
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies
 * or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
 * OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @fileoverview Asset Manager Example - Progress.
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