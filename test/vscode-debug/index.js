//@ts-check

const { Mdjs } = require('../..');

const mdjs = new Mdjs();

const markdown = [
	'``` javascript',
	'	let a = true & false;',
	'```',
].join('\n');

console.log(mdjs.md2html(markdown))
