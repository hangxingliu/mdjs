#!/usr/bin/env node

const TO = 'mdjs.min.js',
	FROM = 'mdjs.js';

var compressor = require('uglify-js'),
	fs = require('fs');

try {
	fs.existsSync(TO) && fs.unlinkSync(TO);
	fs.writeFileSync(TO, compressor.minify(FROM).code);
	console.log('\n  build success!\n');
} catch (e) {
	console.error(e.stack);
	console.log('\n  build failed!\n');	
}