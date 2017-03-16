#!/usr/bin/env node

const TO = 'mdjs.min.js',	
	TO_SOURCE_MAP = 'mdjs.min.js.map',
	FROM = 'mdjs.js',
	POLYFILL = 'polyfill.js';

var compressor = require('uglify-js'),
	babel = require('babel-core'),
	{ existsSync, unlinkSync, writeFileSync, readFileSync } = require('fs');

(function main() {
	console.log(`Cleaning target file "${TO}"...`);
	cleanTargetFile();

	console.log("Babel transforming...");
	babel.transformFile(FROM, {
		plugins: [
			"transform-es2015-template-literals",
			"transform-es2015-arrow-functions"
		],
		sourceMaps: true
	}, (err, { code, map}) => {
		err && throwError(err);
		try {
			console.log("Concatenating polyfill scripts...");
			code = readFileSync(POLYFILL, 'utf8') + '\n' + code;
			//TODO handle source map
			console.log("UglifyJs minifying codes...");
			var result = compressor.minify(code, {
				fromString: true,
				inSourceMap: map,
				outSourceMap: TO_SOURCE_MAP
			});

			console.log("Writing to target file...");
			writeFileSync(TO, result.code);
			
			//TODO handle source map			
			// writeFileSync(TO_SOURCE_MAP, result.map );
			
			console.log('\n  build success!\n');

		} catch (e) {
			throwError(e);
		}
	});

	
} )();

function cleanTargetFile() {
	try {
		existsSync(TO) && unlinkSync(TO);
	} catch (e) {
		throwError(e);
	}
}

function throwError(error) {
	console.error(error.stack || error);
	console.error('\n  build failed!\n');
	process.exit(1);
}