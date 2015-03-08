var gulp = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat-util');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('lint', function() {
  return gulp.src('src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('scripts', function() {
  return gulp.src(['src/core.js', 'src/manifest.js', 'src/bundles.js', 'src/assets.js', 'node_modules/qLite/qLite.js'])
    .pipe(concat('assetLoader.js'))
    .pipe(concat.header('(function(exports, document) {\n\'use strict\';\n'))
    .pipe(concat.footer('\n\nexports.AssetLoader = AssetLoader;\n})(window, document);'))
    .pipe(gulp.dest('.'))
    .pipe(rename('assetLoader.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('.'));
});

gulp.task('watch', function() {
  gulp.watch('js/*.js', ['lint', 'scripts']);
});

gulp.task('default', ['lint', 'scripts', 'watch']);