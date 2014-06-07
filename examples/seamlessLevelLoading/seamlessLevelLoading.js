/**
 * @fileoverview Asset Manager Example - Seamless Level Loading.
 * @author steven@sklambert.com (Steven Lambert)
 *
 * Art assets by Master484 {@link http://opengameart.org/users/master484}
 * Audio assets by BossLevelVGM {@link http://opengameart.org/users/bosslevelvgm}
 */
(function() {
  var AM = new AssetManager();

  // load the manifest
  console.log('====== Loading level 1 ======');
  AM.loadManifest('manifest.json').then(function() {
    showPlayButton();
  }, function(err) {
    console.error(err.message);
  }, function(progress) {
    console.log(progress);
    pBar.value = progress.loaded / progress.total;
    percent.innerHTML = Math.round(pBar.value * 100) + "%";
  });

  var pBar = document.getElementById('progress-bar');
  var percent = document.getElementById('percent')
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext('2d');
  var begin, now, last, passed, accumulator = 0, dt = 1000 / 60;
  var counter = 0;
  var vehicles = [];
  var play = true;
  var speed = 5;
  var level = 1;
  var types = [];
  var speeds = [2, 4, 6, 8];
  var laneGap = 4;
  var laneWidth = 32;
  var edge = 14;
  var spawnGaps = [60, 120, 90, 120];
  var hitRadius = 2;
  var score = 0;

  ctx.fillStyle = 'white';
  ctx.font = '16px arial, sans-serif';

  /**
   * player object
   */
  var player = {
    x: 100,
    y: 100,
    width: 62,
    height: 20,
    update: function() {
      // player needs to go twice as fast backwards to have the motion be perceived as the same speed going forward
      if (KEY_STATUS.left) {
        player.x -= speed * 2;
      }
      else if (KEY_STATUS.right) {
        player.x += speed;
      }

      if (KEY_STATUS.up) {
        player.y -= speed;
      }
      else if (KEY_STATUS.down) {
        player.y += speed;
      }

      // bound the player within the game boundaries
      player.x = player.x < 0 ? 0 : player.x > canvas.width - player.width ? canvas.width - player.width : player.x;
      player.y = player.y < 0 ? 0 : player.y > canvas.height - player.height ? canvas.height - player.height : player.y;

      // check for collision against all vehicles
      for (var i = 0, len = vehicles.length; i < len; i++) {
        var vehicle = vehicles[i];

         if (player.x + hitRadius < vehicle.x + vehicle.width - hitRadius &&
             player.x + player.width - hitRadius > vehicle.x + hitRadius &&
             player.y + hitRadius < vehicle.y + vehicle.height - hitRadius &&
             player.y + player.height - hitRadius > vehicle.y + hitRadius) {
          play = false;
        }
      }
    }
  };

  /**
   * background object
   */
  var background = {
    x: 0,
    y: 0,
    speed: speed,
    update: function() {
      this.x -= this.speed;

      if (this.x < 0 - canvas.width) {
        this.x = 0;
      }
    },
    draw: function() {
      ctx.drawImage(AM.assets.bg, this.x, this.y);
      ctx.drawImage(AM.assets.bg, this.x + canvas.width, this.y);
    }
  }

  /**
   * Vehicle
   * @constructor
   * @param {number} lane - Which lane to spawn on (0-3)
   * @param {number} dir  - Direction of movement (1,-1)
   */
  function Vehicle(lane, dir) {
    var index = Math.round(Math.random() * (types.length - 1));
    var type = types[index];

    // vehicle moving to the left
    if (dir == -1) {
      this.img = AM.assets[type + '_left'];
      this.speed = speeds[lane] * dir - speed;
    }
    // vehicle moving to the right
    else {
      this.img = AM.assets[type];
      this.speed = speeds[lane] * dir;
    }

    this.width = this.img.width;
    this.height = this.img.height;

    // determine where the vehicle should be placed on a lane
    var y;
    if (type === 'bus' || type === 'garbage_truck') {
      y = -12;
    }
    else if (type === 'van' || type === 'truck') {
      y = 2;
    }
    else {
      y = 4;
    }

    var position = edge + (laneWidth + laneGap) * lane + y;

    if (dir == -1) {
      this.y = position;
      this.x = canvas.width + this.width;
    }
    else {
      this.y = canvas.height - position - this.height;
      this.x = -this.width;
    }
  }

  /**
   * Spawn a vehicle at the specified lane.
   * @param {number} lane - Which lane to spawn on (0-3)
   */
  function spawnVehicle(lane) {
    // 50/50 chance to be left/right
    var dir = Math.random() > .5 ? 1 : -1;

    // 50% chance to spawn in lane
    if (Math.random() > .5) {
      vehicles.push(new Vehicle(lane, dir));
    }

    // 50% chance to spawn in opposite lane
    if (Math.random() > .5) {
      vehicles.push(new Vehicle(lane, dir*-1));
    }
  }

  /**
   * Load a new level's assets
   * @param {string} bundle - Name of the bundle to laod
   */
  function loadBundle(bundle) {
    console.log('\n====== Loading level ' + (level+1) + ' ======');
    AM.loadBundle(bundle).then(function() {
      AM.bundles[bundle];

      // add the new vehicles types
      for (assetName in AM.bundles[bundle]) {

        // ignore the assets that are made for moving left
        if (AM.bundles[bundle].hasOwnProperty(assetName) && assetName.indexOf('_left') === -1) {
          types.push(assetName);
        }
      }

      level++;
    }, function(err) {
      console.error(err.message);
    }, function(progress) {
      console.log(progress);
    });
  }

  /**
   * Request animation shim
   */
  var requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback, element){
              window.setTimeout(callback, 1000 / 60);
            };
  })();

  /**
   * Animation loop
   */
  function animate() {
    if (play) {
      requestAnimFrame(animate);

      ctx.clearRect(0,0,canvas.width,canvas.height);

      // determine how much to update
      var vehicle, i, len;
      now = new Date().getTime();
      passed = now - last;
      last = now;
      accumulator += passed;
      while (accumulator >= dt) {
        background.update();

        // update all vehicles
        for (i = 0; i < vehicles.length; i++) {
          vehicle = vehicles[i];
          vehicle.x += vehicle.speed;

          // remove vehicles that have moved off screen
          if (vehicle.x < -vehicle.width || vehicle.x > canvas.width + vehicle.width) {
            vehicles.splice(i,1);
            i--;
          }
        }

        player.update();

        accumulator -= dt;
        counter++;

        // spawn cars in their respected lanes
        for (i = 0, len = spawnGaps.length; i < len; i++) {
          if (counter % spawnGaps[i] === 0) {
            spawnVehicle(i);
          }

          if (i === spawnGaps.length-1) {
            score++;
          }
        }
      }

      background.draw();

      ctx.drawImage(AM.assets.player, player.x, player.y);

      // draw vehicles
      for (i = 0, len = vehicles.length; i < len; i++) {
        vehicle = vehicles[i];
        ctx.drawImage(vehicle.img, vehicle.x, vehicle.y);
      }

      // draw score
      ctx.fillText('Score: ' + score + 'm', canvas.width - 140, 30);

      // load level 2 at 10 seconds
      if (AM.bundles.level2.status === 'created' && now - begin > 10000) {
        loadBundle('level2');
      }
      // load level 3 at 30 seconds
      if (AM.bundles.level3.status === 'created' && now - begin > 30000) {
        loadBundle('level3');
      }
    }
    else {
      gameOver();
    }
  }

  /**
   * Start the game when all of the assets have loaded
   */
  function start() {
    types = ['car', 'motorcycle'];
    AM.assets.music.play();
    AM.assets.music.loop = true;
    last = begin = new Date().getTime();
    requestAnimFrame(animate);
  }

  /**
   * Game over
   */
  function gameOver() {
    AM.assets.music.pause();
  }

  /**
   * Key status
   */
  KEY_CODES = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
  }

  KEY_STATUS = {};
  for (code in KEY_CODES) {
    KEY_STATUS[KEY_CODES[code]] = false;
  }

  document.onkeydown = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
  }

  document.onkeyup = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
  }

  function showPlayButton() {
    var playButton = document.getElementById('play');
    playButton.style.visibility = 'visible';
    playButton.onclick = function() {
      document.getElementById('progress').style.display = 'none';
      start();
    }
  }
})();