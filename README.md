AssetManager - HTML5 JavaScript game asset manager
============

Currently tested on Chrome35, Safari7, FireFox27, IE11, Kindle Silk, iPad3, and iPhone 5s.

## What is AssetManager

AssetManager is a JavaScript library that makes it easy to load assets for your game. It was inspired by the [Jaws](https://github.com/ippa/jaws) game library and Boris Smus's [Game Asset Loader]([https://github.com/borismus/game-asset-loader).

## Dependencies

AssetManager depends on the [qLite.js](https://github.com/straker/qLite) library (3KB minified) for the promises API.

## Usage Examples

### Getting Started

Start by creating a new AssetManager object.

    AM = new AssetManager();

#### Loading an Asset Manifest

AssetManager's greatest benefit is being able to load a file that defines what assets you need and when you need them. The asset manifest file groups assets into bundles which are then loaded when needed.

An asset manifest can look as follows:

    {
      "bundles": [{
        "name": "level1",
        "assets": {
          "bg": "imgs/road.png",
          "player": "imgs/sports_car.png",
          "car": "imgs/car.png",
          "car_left": "imgs/car_left.png",
          "motorcycle": "imgs/motorcycle.png",
          "motorcycle_left": "imgs/motorcycle_left.png"
        }
      },
      {
        "name": "level2",
        "assets": {
          ...
        }
      }],
      "loadBundles" : "level1"
    }

You can define as many bundles as you would like.

The `loadBundle` property tells AssetManager to load a single bundle

    "loadBundles" : "level1"

a list of bundles

    "loadBundles" : ["level1", "level2"]

or all bundles

    "loadBunldes": "all"

You can tell AssetManager to load the manifest into your game (and thus the assets) by calling `loadManifest`. Since `loadManifest` returns a promise, you can add finish, error, and progress callbacks using `then`.

*see [Promisejs.org](https://www.promisejs.org/) for more details.*

    AM.loadManifest('path/to/manifest').then(
    function finishCallback() {
      console.log('Finished loading manifest.');
    }, function errorCallback(err) {
      console.err(err.message);
    }, function progressCallback(progress) {
      console.log('Loaded ' + progress.loaded + ' of ' + progress.total + ' assets.');
    });

Once loaded, all assets can be accessed by name from `AM.assets`.

#### Loading Assets

You can tell AssetManger to load an asset (or a group of assets) by calling `loadAsset` (returns a promise).

    AM.loadAsset({
      'assetName1' : 'path/to/asset',
      'assetName2' : 'path/to/asset'
      ...
    }).then(
    function finishCallback() {
      console.log('Finished loading all assets.');
    }, function errorCallback(err) {
      console.err(err.message);
    }, function progressCallback(progress) {
      console.log('Loaded ' + progress.loaded + ' of ' + progress.total + ' assets.');
    });

When loading audio assets, you can specify multiple formats and AssetManager will determine which format to load based on the current browser's support.

    AM.loadAsset({
      'music': ['audio/music.mp3', 'audio/music.aac', 'audio/music.ogg']
    })
    ...

#### Loading JSON, JavaScript, and CSS

AssetManager also allows you to load JSON, JavaScript, and CSS assets directly by calling `loadJSON`, `loadScript`, and `loadCSS` respectively. All three functions return a promise but do not make use of the progress callback.

    AM.loadJSON('path/to/json').then(
    function finishCallback(json) {
      console.log('Finished loading json.');
    }, function errorCallback(err) {
      console.err(err.message);
    });

`loadJSON` automatically parses the file and returns the parsed JSON in the finish callback. `loadScript` and `loadCSS` do not add the script and css to `AM.assets` since it loads the asset into the DOM.

#### Loading a Group of Assets

You can also create a group of assets to load at a later time by calling `createBundle` (does not return a promise).

    AM.createBundle('bundleName');

All bundles can be accessed from `AM.bundles`.

You can then add assets to the bundle by calling `addBundleAsset` (does not return a promise).

    AM.addBundleAsset('bundleName', {
      'assetName1' : 'path/to/asset',
      'assetName2' : 'path/to/asset'
      ...
    });

The assets won't be loaded (i.e. accessible from `AM.assets`) until you call `AM.loadBundle` (returns a promise).

    AM.loadBundle('bundleName').then(
    function finishCallback() {
      console.log('Finished loading bundle.');
    }, function errorCallback(err) {
      console.err(err.message);
    }, function progressCallback(progress) {
      console.log('Loaded ' + progress.loaded + ' of ' + progress.total + ' assets.');
    });
