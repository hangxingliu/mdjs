//@ts-check
require('colors');
require('should');
let Mdjs = require('../..').Mdjs;

const IMG = `![this is a image](imgs/img.png)`;

describe('tag <img>', () => {
	it('# only one image in the line', () => {
		Mdjs.md2html(`${IMG}`).should
			.has.not.containEql('<p>').and.not.containEql('</p>');
		Mdjs.md2html(`${IMG} `).should
			.has.not.containEql('<p>').and.not.containEql('</p>');
		Mdjs.md2html(` ${IMG} `).should
			.has.not.containEql('<p>').and.not.containEql('</p>');

		Mdjs.md2html(`img: ${IMG} `).should
			.has.containEql('<p>').and.containEql('</p>');
		Mdjs.md2html(` ${IMG}. `).should
			.has.containEql('<p>').and.containEql('</p>');
	});
});
