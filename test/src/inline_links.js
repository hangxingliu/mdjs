//@ts-check

let Mdjs = require('../..').Mdjs,
	{ Assert } = require('./utils/Assert'),
	{ validateHTML: $ } = require('./utils/ValidateHTML');

function markdown(lines = []) { return Mdjs.md2html(lines.join('\n')); }

// reference: https://en.wikipedia.org/wiki/Node.js
const kitchenSinkMarkdown = [
	`**Node.js** is an `,
	`[open-source](https://en.wikipedia.org/wiki/Open-source_software "Open-source"),`,
	`cross-platform [JavaScript](JavaScript) `,
	`[run-time environment](./Runtime_system "Runtime_system") `,
	`that executes JavaScript code [server-side](https://en.wikipedia.org/wiki/Server-side 'title'). ...\n`,
	`from: <https://en.wikipedia.org/wiki/Node.js>`
];
const expected = [
	["https://en.wikipedia.org/wiki/Open-source_software", "Open-source"],
	["JavaScript"],
	["./Runtime_system", "Runtime_system"],
	["https://en.wikipedia.org/wiki/Server-side", "title"],
	["https://en.wikipedia.org/wiki/Node.js"]
];


describe('inline links', () => {
	it('# kitchen sink', () => {
		let html = markdown(kitchenSinkMarkdown);

		let $links = $(html).select('a').length(5);
		for (let i = 0; i < 5; i++) {
			let $link = $links.eq(i).attr('href', expected[i][0]);
			if (expected[i][1])
				$link.attr('title', expected[i][1]);
		}
	});
});
