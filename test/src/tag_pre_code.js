//@ts-check
let Mdjs = require('../..').Mdjs;

let { validateHTML: $ } = require('./utils/ValidateHTML');

describe('tag <pre>, <code>, ...', () => {
	it('code blocks', () => {

		$(Mdjs.md2html([
			'``` javascript',
			'console.log("HelloWorld!");',
			'```'
		].join('\n'))).select('pre code[data-lang="javascript"]')
			.length(1)
			.text('console.log("HelloWorld!");');

		$(Mdjs.md2html([
			'``` javascript',
			'let a = 10;',
			'console.log(a);',
			'```'
		].join('\n'))).select('pre code[data-lang="javascript"]')
			.length(1)
			.html('let a = 10;\nconsole.log(a);'.replace(/ /g, '&#xA0;'));

		$(Mdjs.md2html([
			'',
			'    console.log("HelloWorld!");',
			''
		].join('\n'))).select('pre code')
			.length(1)
			.text('  console.log("HelloWorld!");');


	});
});
