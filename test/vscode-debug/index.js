//@ts-check

const { Mdjs } = require('../..');

const mdjs = new Mdjs();

const markdown = [
	'``` javascript',
	'	let a = true & false;',
	'```',
	'',
	// 'This is [github][1] [^1]',
	'',
	'This is [github] too',
	'',
	'[github]: https://gtihub.com',
	'[1]: https://github.com',
	'',
].join('\n');

console.log(mdjs.md2html(markdown))
