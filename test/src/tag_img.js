//@ts-check

let { Assert } = require('@hangxingliu/assert');
let Mdjs = require('../..').Mdjs;

const IMG = `![this is a image](imgs/img.png)`;

function assertMarkdown(markdown) { return Assert(Mdjs.md2html(markdown)); }

describe('tag <img>', () => {
	it('# only one image in the line', () => {
		assertMarkdown(`${IMG}`)
			.doesNotContainSubString('<p>').and.doesNotContainSubString('</p>');
		assertMarkdown(`${IMG} `)
			.doesNotContainSubString('<p>').and.doesNotContainSubString('</p>');
		assertMarkdown(` ${IMG} `)
			.doesNotContainSubString('<p>').and.doesNotContainSubString('</p>');

		assertMarkdown(`img: ${IMG} `)
			.containsSubString('<p>').and.containsSubString('</p>');
		assertMarkdown(` ${IMG}. `)
			.containsSubString('<p>').and.containsSubString('</p>');
	});
});
