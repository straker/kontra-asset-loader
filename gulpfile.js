var gulp = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat-util');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var size = require('gulp-size');
var karma = require('karma').server;
var shell = require('gulp-shell')

gulp.task('lint', function() {
  return gulp.src('src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter( 'jshint-stylish' ));
});

gulp.task('scripts', function() {
  return gulp.src(['src/core.js', 'src/manifest.js', 'src/bundles.js', 'src/assets.js', 'node_modules/qLite/qLite.js'])
    .pipe(concat('assetLoader.js'))
    .pipe(concat.header('(function(exports, document) {\n\'use strict\';\n'))
    .pipe(concat.footer('\n\nexports.AssetLoader = AssetLoader;\n})(window, document);'))
    .pipe(gulp.dest('.'))
    .pipe(rename('assetLoader.min.js'))
    .pipe(uglify())
    .pipe(size())
    .pipe(gulp.dest('.'));
});

gulp.task('start-server', shell.task([
  './node_modules/http-server/bin/http-server -p 8100 test > /dev/null 2>&1'
]));

gulp.task('test', function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js'
  }, done);
});

gulp.task('watch', function() {
  gulp.watch('src/*.js', ['lint', 'scripts']);
});

gulp.task('default', ['lint', 'scripts', 'start-server', 'test', 'watch']);