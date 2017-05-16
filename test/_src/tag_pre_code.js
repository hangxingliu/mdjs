
let { validateHTML: $ } = require('./_utils');

describe('tag <pre>, <code>, ...', () => {
	it('code blocks', () => {

		$(Mdjs.md2html([
			'``` javascript',
			'console.log("helloworld!");',
			'```'
		].join('\n'))).select('pre code[data-lang="javascript"]')
			.length(1)
			.text('console.log("helloworld!");');

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
			'    console.log("helloworld!");',
			''
		].join('\n'))).select('pre code')
			.length(1)
			.text('  console.log("helloworld!");');
		

	});
});