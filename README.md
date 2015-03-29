AssetLoader - HTML5 JavaScript game asset manager
============

Currently tested on Chrome35, Safari7, FireFox27, IE9+, Kindle Silk, and mobile Safari.

## What is AssetLoader

AssetLoader is a JavaScript library that makes it easy to load assets for your game. It was inspired by the [Jaws](https://github.com/ippa/jaws) game library and Boris Smus's [Game Asset Loader](https://github.com/borismus/game-asset-loader).

## Dependencies

AssetLoader depends on the [qLite.js](https://github.com/straker/qLite) library (3KB minified) for the promises API. It is included in the `assetLoader.js` and `assetLoader.min.js`, so there is no need to include it separately into your game.

## Documentation

Visit [my site](http://sklambert.com/assetManager/docs/) for the full AssetLoader documentation, or you can view the docs from this repo using [htmlPreview](http://htmlpreview.github.io/?https://raw.github.com/straker/kontra-asset-loader/master/docs/index.html).

## Usage Examples

### Getting Started

Start by initializing the AssetLoader.

```javascript
AL = new AssetLoader();
```

#### Loading an Asset Manifest

AssetLoader's greatest benefit comes from being able to load a file that defines what assets you need and when you need them. The asset manifest file groups assets into bundles which are then loaded when needed.

An asset manifest can look as follows:

```javascript
{
  "bundles": [{
    "name": "level1",
    "assets": {
      // an asset is defined as {name: url}
      "bg": "imgs/bg.png",
      "music": ["audio/music.mp3", "audio/music.aac", "audio/music.ogg"],
      "myScript": "js/myScript.js",
      "myCSS": "css/myCSS.css",
      "level1Data": "levels/level1.json"
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
```

You can define as many bundles as you would like.

The `loadBundle` property tells AssetLoader to load any bundles automatically when the you call `loadManifest`. You can tell it to load a single bundle

```javascript
"loadBundles" : "level1"
```

a list of bundles

```javascript
"loadBundles" : ["level1", "level2"]
```

or all bundles

```javascript
"loadBunldes": "all"
```

You can tell AssetLoader to load the manifest into your game (and thus the assets) by calling `loadManifest`. Since `loadManifest` returns a promise, you can add finish, error, and progress callbacks using `then`.

*see [Promisejs.org](https://www.promisejs.org/) for more details.*

```javascript
AL.loadManifest("path/to/manifest").then(
function finishCallback() {
  console.log("Finished loading manifest.");
}, function errorCallback(err) {
  console.error(err.message);
}, function progressCallback(progress) {
  console.log("Loaded " + progress.loaded + " of " + progress.total + " assets.");
});
```

Once loaded, all assets can be accessed by name from `AL.assets`.

After the manifest is loaded, you can load any bundles by calling [loadBundle](#loading-bundles).

#### Loading Assets

You can also load an asset (or a group of assets) by calling `loadAsset` (returns a promise).

```javascript
AL.loadAsset({
  "assetName1" : "path/to/asset",
  "assetName2" : "path/to/asset"
  ...
}).then(
function finishCallback() {
  console.log("Finished loading all assets.");
}, function errorCallback(err) {
  console.error(err.message);
}, function progressCallback(progress) {
  console.log("Loaded " + progress.loaded + " of " + progress.total + " assets.");
});
```

When loading audio assets, you can specify multiple formats and AssetLoader will determine which format to load based on the current browser's support.

```javascript
AL.loadAsset({
  "music": ["audio/music.mp3", "audio/music.aac", "audio/music.ogg"]
})
...
```

#### Loading JSON, JavaScript, and CSS

AssetLoader also allows you to load JSON, JavaScript, and CSS assets directly by calling `loadJSON`, `loadScript`, and `loadCSS` respectively. All three functions return a promise but do not use the progress callback.

```javascript
AL.loadJSON("path/to/json").then(
function finishCallback(json) {
  console.log("Finished loading json.");
}, function errorCallback(err) {
  console.error(err.message);
});
```

`loadJSON` automatically parses the file and returns the parsed JSON in the finish callback. `loadScript` and `loadCSS` do not add the script and css to `AL.assets` since they load the asset into the DOM.

#### Loading Bundles

You can also create a group of assets to load at a later time by calling `createBundle` (does not return a promise).

```javascript
AL.createBundle("bundleName");
```

All bundles can be accessed by name from `AL.bundles`.

You can then add assets to the bundle by calling `addBundleAsset` (does not return a promise).
```javascript
AL.addBundleAsset("bundleName", {
  "assetName1" : "path/to/asset",
  "assetName2" : "path/to/asset"
  ...
});
```

The assets won't be loaded (i.e. accessible from `AL.assets`) until you call `AL.loadBundle` (returns a promise).

```javascript
AL.loadBundle("bundleName").then(
function finishCallback() {
  console.log("Finished loading bundle.");
}, function errorCallback(err) {
  console.error(err.message);
}, function progressCallback(progress) {
  console.log("Loaded " + progress.loaded + " of " + progress.total + " assets.");
});
```

LoadBundles also accepts an array of bundle names.
