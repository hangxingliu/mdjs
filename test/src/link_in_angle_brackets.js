//@ts-check
/**
 * such as <https://github.com> but not <div>
 */

let { Assert } = require('@hangxingliu/assert');
let Mdjs = require('../..').Mdjs;

let testURL = [
	'http://www.github.com',
	'https://www.github.com',
	'ftp://www.github.com',
	'file:///home/xxx/project/index.html',
];
let testMail = [
	'xx@xx.xx',
	'xx.xx@xx.xx'
];

function getUrlHTML(url) { return `<a title="" href="${url}">${url}</a>`; }
function getMailHTML(mail) { return `<a href="mailto:${mail}">${mail}</a>`; }

function assertMarkdown(markdown) { return Assert(Mdjs.md2html(markdown)); }

describe('link in angle brackets', () => {

	it('#a link', () => {
		testURL.forEach(url => {
			let html = getUrlHTML(url);
			assertMarkdown(`<${url}>`).containsSubString(html);
			assertMarkdown(`<${url}> `).containsSubString(html);
			assertMarkdown(` <${url}>`).containsSubString(html);
			assertMarkdown(` <${url}> `).containsSubString(html);

			assertMarkdown(`URL: <${url}>`).containsSubString(`URL: ` + html);
			assertMarkdown(`URL: <${url}>,you can visit it.`).containsSubString(`URL: ` + html + `,you can visit it.`);
		});
	});

	it('#a mail', () => {
		testMail.forEach(mail => {
			let html = getMailHTML(mail);


			assertMarkdown(`<${mail}>`).containsSubString(html);
			assertMarkdown(`<${mail}> `).containsSubString(html);
			assertMarkdown(` <${mail}>`).containsSubString(html);
			assertMarkdown(` <${mail}> `).containsSubString(html);
			assertMarkdown(`mail: <${mail}>`).containsSubString(`mail: ` + html);
			assertMarkdown(`please email to this link:<${mail}>. `).containsSubString(
				`please email to this link:` + html + `.`);
		});
	});

	it('#a tag', () => {
		assertMarkdown('<a href="http://www.github.com">hello</a>')
			.equals(`<p><a href="http://www.github.com">hello</a></p>`);

		assertMarkdown('<span data-mail="xx@xx.com">hello</span>')
			.equals(`<p><span data-mail="xx@xx.com">hello</span></p>`);
	});

	it('#mix', () => {
		assertMarkdown('<span data-link="https://www.github.com"><https://github.com></span>')
			.equals(`<p><span data-link="https://www.github.com"><a title="" href="https://github.com">https://github.com</a></span></p>`);
		assertMarkdown('<span data-mail="xx@xx.com"><xx@xx.com></span>')
			.equals(`<p><span data-mail="xx@xx.com"><a href="mailto:xx@xx.com">xx@xx.com</a></span></p>`);
	});
});
