#!/usr/bin/env node

//@ts-check

const babelCore = require('babel-core');
const fs = require('fs-extra');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const mainInput = path.join(projectRoot, 'mdjs.js');
const polyfillInput = path.join(projectRoot, 'polyfill.js');
const output = path.join(projectRoot, 'mdjs.min.js');
const plugins = [
	"minify-mangle-names",
	"minify-simplify",
	"transform-merge-sibling-variables",
	"transform-minify-booleans",
	["transform-es2015-block-scoping", { throwIfClosureRequired: true }],
	"transform-es2015-template-literals",
	"transform-es2015-arrow-functions"
];

fs.pathExists(output)
	.then(exist => exist && log(`Cleaning target file "${output}"...`).then(() => fs.remove(output)))
	.then(() => log("Babel transforming..."))
	.then(() => Promise.all([polyfillInput, mainInput].map(babel)))
	.then(results => log("writing target file...")
		.then(() => fs.writeFile(output, results.map(it => it.code).join('\n'))))
	.then(() => log("build success!"))
	.catch(throwError);

function throwError(error) {
	console.error(error.stack || error);
	console.error('\n  build failed!\n');
	process.exit(1);
}

function log(msg) { console.log(msg); return Promise.resolve(); }
function babel(file) {
	return new Promise((resolve, reject) =>
		babelCore.transformFile(file, {
			plugins, sourceMaps: true, compact: true, comments: false
		}, (e, r) => e ? reject(e) : resolve(r)));
}
