// (function() {
  var AM = new AssetManager();

  AM.loadManifest('manifest.json').then(function() {
    start();
  }, function(err) {
    console.error(err.message);
  }, function(progress) {
    console.log(progress);
  })
  .done();

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext('2d');
  var begin, now, last, passed, accumulator = 0, dt = 1000 / 60;
  var counter = 0, spawnNew = 500;
  var obstacles = [];
  var play = true;
  var speed = 2;
  var level = 1;
  var types = [];

  var player = {
    x: 100,
    y: 100,
    width: 62,
    height: 20,
    update: function() {
      if (KEY_STATUS.left) {
        player.x -= 3;
      }
      else if (KEY_STATUS.right) {
        player.x += 3;
      }

      if (KEY_STATUS.up) {
        player.y -= 3;
      }
      else if (KEY_STATUS.down) {
        player.y += 3;
      }

      player.x = player.x < 0 ? 0 : player.x > canvas.width - player.width ? canvas.width - player.width : player.x;
      player.y = player.y < 0 ? 0 : player.y > canvas.height - player.height ? canvas.height - player.height : player.y;

      for (var i = 0, len = obstacles.length; i < len; i++) {
        var obstacle = obstacles[i];

        if (player.x                 < obstacle.x + obstacle.width  &&
            player.x + player.width  > obstacle.x                   &&
            player.y                 < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
          play = false;
          gameOver();
        }
      }
    }
  };

  var background = {
    x: 0,
    y: 0,
    speed: 3,
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

  function loadBundle(bundle) {
    AM.loadBundle(bundle).then(function() {
      AM.bundles[bundle];
      for (assetName in AM.bundles[bundle]) {
        if (AM.bundles[bundle].hasOwnProperty(assetName)) {
          types.push(assetName);
        }
      }
    }, function(err) {
      console.error(err.message);
    }, function(progress) {
      console.log(progress);
    })
    .done();
  }

  function Obstacle(x,y,width,height,type) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 31;
    this.height = height || 12;
    this.type = type || 'car';
  }

  function spawnObstacle() {
    var index = Math.round(Math.random() * (types.length - 1));
    var type = types[index];
    var img = AM.assets[type];
    var x = canvas.width + img.width;
    var y = Math.max(100, Math.min(Math.random() * canvas.height | 0, canvas.height - 100));

    obstacles.push(new Obstacle(x,y,img.width,img.height, type));
  }

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

  function animate() {
    if (play) {
      requestAnimationFrame(animate);

      ctx.clearRect(0,0,canvas.width,canvas.height);

      now = new Date().getTime();
      passed = now - last;
      last = now;
      accumulator += passed;
      while (accumulator >= dt) {
        background.update();

        for (var i = 0, len = obstacles.length; i < len; i++) {
          var obstacle = obstacles[i];
          obstacle.x -= speed;

          if (obstacle.x < 0 - obstacle.width) {
            obstacle.x = canvas.width + obstacle.width;
          }
        }

        player.update();

        accumulator -= dt;
        counter++;

        if (counter >= spawnNew) {
          counter = 0;
          spawnNew--;

          // spawnObstacle();
          speed += 0.1;
        }
      }

      background.draw();

      ctx.drawImage(AM.assets.player, player.x, player.y);

      for (var i = 0, len = obstacles.length; i < len; i++) {
        var obstacle = obstacles[i];
        ctx.drawImage(AM.assets[obstacle.type], obstacle.x, obstacle.y);
      }

      // load level 2 at 10 seconds
      if (AM.bundles.level2.status === 'created' && now - begin > 10000) {
        loadBundle('level2');
      }
      // load level 3 at 10 seconds
      if (AM.bundles.level3.status === 'created' && now - begin > 30000) {
        loadBundle('level3');
      }
    }
  }

  function start() {
    types = ['car', 'motorcycle'];
    // AM.assets.music.play();
    // AM.assets.music.loop = true;
    spawnObstacle();
    last = begin = new Date().getTime();
    requestAnimationFrame(animate);
  }

  function gameOver() {
    AM.assets.music.pause();
  }

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
// })();