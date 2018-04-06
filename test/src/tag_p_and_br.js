//@ts-check

let { Assert } = require('@hangxingliu/assert');
let Mdjs = require('../..').Mdjs;

function assertMarkdown(markdown, opts) { return Assert(Mdjs.md2html(markdown, opts)); }

describe('render tag <p> and <br/>', () => {
	it('#should be wrap <p>', () => {
		assertMarkdown('the**lazy**dog')
			.containsSubString('<p>the<strong>lazy</strong>dog</p>');
	});
	it('#should has <br/>', () => {
		assertMarkdown('the**lazy**dog\nDog')
			.containsSubString('<p>the<strong>lazy</strong>dogDog</p>');

		assertMarkdown('the**lazy**dog  \nDog')
			.containsSubString('<p>the<strong>lazy</strong>dog  <br />Dog</p>');

		assertMarkdown('the**lazy**dog\nDog', { alwaysNewline: true })
			.containsSubString('<p>the<strong>lazy</strong>dog<br />Dog</p>');

		assertMarkdown('the**lazy**dog\nDog\n\nNew paragraph', { alwaysNewline: true })
			.containsSubString('<p>the<strong>lazy</strong>dog<br />Dog</p><p>New paragraph</p>');

		assertMarkdown('the**lazy**dog\nDog  \n\nNew paragraph')
			.containsSubString('<p>the<strong>lazy</strong>dogDog  <br /></p><p>New paragraph</p>');
	});
	it('#there has no "<br />" in the end', () => {
		assertMarkdown('the', { alwaysNewline: true })
			.containsSubString('<p>the</p>');
	});
	it('#there is "</p><p>" but not "<br />"', () => {
		assertMarkdown('the\n\nlazy\ndog', { alwaysNewline: true })
			.containsSubString('<p>the</p><p>lazy<br />dog</p>');
	});
});
