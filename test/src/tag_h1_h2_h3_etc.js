//@ts-check
require('colors');
require('should');
let Mdjs = require('../..').Mdjs;

let { validateHTML: $ } = require('./_utils');

describe('tag <h1>, <h2>, ...', () => {
	it('headers', () => {

		$(Mdjs.md2html(`# Normal HEADER`))
			.select('h1').length(1);

		$(Mdjs.md2html(`# This is "title"`))
			.select('h1').length(1).attr('name', 'This_is_title').attr('name', 'This_is_title');

		$(Mdjs.md2html(`## Normal **HEADER**`))
			.select('h2').length(1).attr('name', 'Normal_HEADER').attr('id', 'Normal_HEADER')
			.select('h2 strong').length(1);

		$(Mdjs.md2html(`Normal **HEADER**\n===`))
			.select('h1').length(1).attr('name', 'Normal_HEADER').attr('id', 'Normal_HEADER')
			.select('h1 strong').length(1);

		$(Mdjs.md2html(`Normal **HEADER**\n---`))
			.select('h2').length(1).attr('name', 'Normal_HEADER').attr('id', 'Normal_HEADER')
			.select('h2 strong').length(1);
	});
});
