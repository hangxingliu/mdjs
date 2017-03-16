#!/usr/bin/env node

var fs = require('fs'),
	content = fs.readFileSync(`${__dirname}/md-js.d.ts`, 'utf8');
if (fs.existsSync('node_modules/@types'))
	install2types();
else if (fs.existsSync('typings'))
	install2typings();
else
	install2types();

function install2typings() {
	const to = 'typings/md-js.d.ts';
	fs.writeFileSync(to, content);
	_success(to);
}

function install2types() {
	_mkdirIfNotExists('node_modules');
	_mkdirIfNotExists('node_modules/@types');
	_mkdirIfNotExists('node_modules/@types/md-js');
	const to = 'node_modules/@types/md-js/index.d.ts';
	fs.writeFileSync(to, content);
	_success(to);
}

function _mkdirIfNotExists(path) {
	fs.existsSync(path) || fs.mkdirSync(path);
}
function _success(to) {
	console.log(`  success: install typescript declaration file to "${to}"`);
}