var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var gzip = require('gulp-gzip')
var pump = require('pump');

gulp.task('scripts', function(cb) {
  return gulp.src('js/*.js')
    .pipe(concat('app.js'))
    .pipe(uglify({mangle: false}))
    .pipe(gzip())
    .pipe(gulp.dest('page'));
});

gulp.task('styles', function(cb) {
  return gulp.src('css/*.css')
    .pipe(concat('app.css'))
    //.pipe(clean_css({}))
    .pipe(gzip())
    .pipe(gulp.dest('page'));
});
