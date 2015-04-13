Kontra Asset Loader - HTML5 JavaScript game asset loader.
============

Currently tested on Chrome35, Safari7, FireFox27, IE9+, Kindle Silk, and mobile Safari.

## What is Kontra Asset Loader

Kontra Asset Loader is a JavaScript library that makes it easy to load assets for your game. It was inspired by the [Jaws](https://github.com/ippa/jaws) game library and Boris Smus's [Game Asset Loader](https://github.com/borismus/game-asset-loader).

## Dependencies

Kontra Asset Loader depends on the [qLite.js](https://github.com/straker/qLite) library (3KB minified) for the promises API. It is included in `kontraAssetLoader.js` and `kontraAssetLoader.min.js`, so there is no need to include it separately into your game.

## Usage

1. [Loading an Asset Manifest](#loading-an-asset-manifest)
2. [Loading Assets](#loading-assets)
3. [Loading Images, Audios, and Data/JSON](#loading-images-audios-and-datajson)
4. [Loading Bundles](#loading-bundles)

### Loading an Asset Manifest

Kontra Asset Loader's greatest benefit comes from being able to load a file that defines what assets you need and when you need them. The asset manifest file groups assets into bundles which are then loaded when needed.

An asset manifest can look as follows:

```javascript
{
  "imagePath": "imgs/",
  "audioPath": "audio/",
  "dataPath": "levels/",
  "bundles": [{
    "name": "level1",
    "assets": [
      "bg.png",
      ["music.mp3", "music.aac", "music.ogg"],
      "level1.json"
    ]
  },
  {
    "name": "level2",
    "assets": [
      ...
    ]
  }],
  "loadBundles" : "level1"
}
```

You can define as many bundles as you would like.

The `loadBundles` property tells Kontra Asset Loader to load any bundles automatically when the you call `kontra.loadManifest`. You can tell it to load a single bundle

```javascript
"loadBundles" : "level1"
```

a group of bundles

```javascript
"loadBundles" : ["level1", "level2"]
```

or all bundles

```javascript
"loadBunldes": "all"
```

If the property does not exist, no bundles will be loaded.

You can tell Kontra Asset Loader to load the manifest into your game (and thus the assets) by calling `kontra.loadManifest`. Since `kontra.loadManifest` returns a promise, you can add finish, error, and progress callbacks using `then`.

*see [Promisejs.org](https://www.promisejs.org/) for more details.*

```javascript
kontra.loadManifest("path/to/manifest.json").then(
function finishCallback() {
  console.log("Finished loading manifest.");
}, function errorCallback(err) {
  console.error(err.message);
}, function progressCallback(progress) {
  console.log("Loaded " + progress.loaded + " of " + progress.total + " assets.");
});
```

After the manifest is loaded, you can load any bundles by calling [kontra.loadBundles](#loading-bundles).

### Loading Assets

You can also load an asset or a group of assets by calling `kontra.loadAssets` (returns a Promise).

```javascript
kontra.loadAssets("path/to/image.png", "path/to/audio.mp3", "path/to/data.json").then(
function finishCallback() {
  console.log("Finished loading all assets.");
}, function errorCallback(err) {
  console.error(err.message);
}, function progressCallback(progress) {
  console.log("Loaded " + progress.loaded + " of " + progress.total + " assets.");
});
```

When loading audio assets, you can specify multiple formats and Kontra Asset Loader will determine which format to load based on the current browser's support.

```javascript
kontra.loadAssets(["audio/music.mp3", "audio/music.aac", "audio/music.ogg"])
```

Once loaded, assets can be accessed by their name or URL from `kontra.images`, `kontra.audios`, and `kontra.data`.

```javascript
kontra.loadAssets("car.png", "music.mp3", "level.json");

context.drawImage(kontra.images.car, 0, 0);
context.drawImage(kontra.images["car.png"], 0, 0);

kontra.audios.music.play();
kontra.audios["music.mp3"].play();

canvas.width = kontra.data.level.width;
canvas.width = kontra.data["level.json"].width;
```

If you load multiple audio formats, it is recommended that you don't try to access the audio by URL as you won't know which audio format was loaded by the browser.

If you use folders in your asset path, the name and URL will also include the folder.

```javascript
kontra.loadAssets("images/car.png");

kontra.images["images/car"];
kontra.images["images/car.png"];
```

You can offset the use of folders by setting `kontra.imagePath`, `kontra.audioPath`, or `kontra.dataPath` either manually or in the manifest file. The asset path will be appended to each asset request URL, so you can load the asset without needing to specify the folder. Accessing the asset by its URL will still use the folder however.

```javascript
kontra.imagePath = "images/";  //-> always end the path with a /
kontra.loadAssets("car.png");  //-> file located at images/car.png

kontra.images["car"];  //-> can now access by just its name
kontra.images["images/car.png"];  //-> the URL will still use the folder though
```

### Loading Images, Audios, and Data/JSON

Kontra Asset Loader also allows you to load Image, Audio, and data/JSON assets directly by calling `kontra.loadImage`, `kontra.loadAudio`, and `kontra.loadData` respectively. All three functions return a promise but do not use the progress callback.

```javascript
kontra.loadImage("car.png").then(
function finishCallback(image) {
  console.log("Finished loading image.");
}, function errorCallback(err) {
  console.error(err.message);
});

kontra.loadAudio(["music.mp3", "music.ogg"]).then(
function finishCallback(audio) {
  console.log("Finished loading audio.");
}, function errorCallback(err) {
  console.error(err.message);
});

kontra.loadData("level.json").then(
function finishCallback(json) {
  console.log("Finished loading json.");
}, function errorCallback(err) {
  console.error(err.message);
});
```

`kontra.loadImage` passes the loaded Image object to the success callback of the promise, `kontra.loadAudio` passes the loaded Audio object, and `kontra.loadData` passes either the parsed JSON if the asset is a JSON file, or the plain text of the file.

### Loading Bundles

You can also create a group of assets to load at a later time by calling `createBundle` (does not return a promise).

```javascript
kontra.createBundle("bundleName", ["car.png"]);
kontra.createBundle("level1", ["level.json", ["music.mp3", "music.ogg"] ]);
```

All bundles can be accessed by name from `kontra.bundles`.

```javascript
console.log(kontra.bundles.bundleName); //-> ["car.png"]
```

The bundled assets won't be loaded (i.e. accessible from `kontra.images`, `kontra.audios`, or `kontra.data`) until you call `kontra.loadBundles` (returns a promise).

```javascript
kontra.loadBundles("bundleName", "level1").then(
function finishCallback() {
  console.log("Finished loading bundle.");
}, function errorCallback(err) {
  console.error(err.message);
}, function progressCallback(progress) {
  console.log("Loaded " + progress.loaded + " of " + progress.total + " assets.");
});
```
