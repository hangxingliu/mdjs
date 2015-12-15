/*
 * A gulpfile created by LiuYue(hangxingliu)
 */
var g =require("gulp");
var cl = require("gulp-clean");
var minijs = require('gulp-uglify');
var ren = require("gulp-rename");

g.task('default',['clean'],function(){
	var s = g.src('mdjs.js',{'base':''})
		.pipe(minijs())
		.pipe(ren('mdjs.min.js'))
		.pipe(g.dest(''));
	return s;
});
g.task('clean',function(){
	var s = g.src('mdjs.min.js',{'read': false})
			.pipe(cl());
	return s;
});
