//@ts-check

let Mdjs = require('../..').Mdjs;
let { validateHTML: $ } = require('./utils/ValidateHTML');

describe('tag <h1>, <h2>, ...', () => {
	it('# pure text headers', () => {
		let id = '', name = '';

		id = name = 'Normal_HEADER';
		$(Mdjs.md2html(`# Normal HEADER`)).select('*').length(1)
			.filter('h1').attrMap({ id, name }).trimmedText('Normal HEADER');

		id = name = 'This_is_title';
		$(Mdjs.md2html(`# This is "title"`)).select('*').length(1)
			.filter('h1').attrMap({ id, name }).trimmedText('This is "title"');

		id = name = 'Normal_HEADER';
		let elements1 = $(Mdjs.md2html(`## Normal **HEADER**`)).select('*').length(2)
		elements1.filter('h2').attrMap({ id, name }).trimmedText('Normal HEADER');
		elements1.filter('h2 strong').trimmedText('HEADER');

		id = name = 'Normal_HEADER';
		let elements2 = $(Mdjs.md2html(`Normal **HEADER**\n===`)).select('*').length(2)
		elements2.filter('h1').attrMap({ id, name }).trimmedText('Normal HEADER');
		elements2.filter('h1 strong').trimmedText('HEADER');

		id = name = 'Normal_HEADER';
		let elements3 = $(Mdjs.md2html(`Normal **HEADER**\n---`)).select('*').length(2)
		elements3.filter('h2').attrMap({ id, name }).trimmedText('Normal HEADER');
		elements3.filter('h2 strong').trimmedText('HEADER');
	});
});
