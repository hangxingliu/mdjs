//@ts-check

let Mdjs = require('../..').Mdjs,
	{ Assert } = require('./utils/Assert'),
	{ validateHTML: $ } = require('./utils/ValidateHTML');

function markdown(lines = []) { return Mdjs.md2html(lines.join('\n')); }

const simpleMarkdown = [
	"[I'm link to wikipedia][wikipedia]",
	"",
	"[wikipedia]: https://www.wikipedia.org/"
];

// reference: https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#links
// TODO:  `Or leave it empty and use the [link text itself].`,
const kitchenSinkMarkdown = [
	`[I'm a reference-style link][Arbitrary case-insensitive reference text]`,
	``,
	`[You can use numbers for reference-style link definitions][1]`,
	``,
	`Some text to show that the reference links can follow later.`,
	``,
	`And reference link with title: [me][link with title]`,
	``,
	`[arbitrary case-insensitive reference text]: https://www.mozilla.org`,
	`[1]: http://slashdot.org`,
	`[link with title]: https://github.com/hangxingliu "hangxingliu"`
];

describe('reference link', () => {
	it('# simple ref link', () => {
		let html = markdown(simpleMarkdown);
		Assert(html).containsSubString('<a').and.containsSubString('</a>')
			.and.doesNotContainSubString('[wikipedia]');

		$(html).select('a').attr('href', 'https://www.wikipedia.org/');
	});

	it('# kitchen sink', () => {
		let html = markdown(kitchenSinkMarkdown);

		Assert(html).doesNotContainSubString('[arbitrary case-insensitive reference text]')
			.and.doesNotContainSubString('[1]');

		let $links = $(html).select('a').length(3);
		$links.eq(0).attr('href', 'https://www.mozilla.org');
		$links.eq(1).attr('href', 'http://slashdot.org');
		$links.eq(2).attr('href', 'https://github.com/hangxingliu').attr('title', 'hangxingliu');
	});
});
