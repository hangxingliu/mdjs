/**
 * such as <https://github.com> but not <div>
 */

var testURL = [
	'http://www.github.com',
	'https://www.github.com',
	'ftp://www.github.com',
	'file:///home/xxx/project/index.html',
], testMail = [
	'xx@xx.xx',
	'xx.xx@xx.xx'
], getUrlHTML = url => `<a title="" href="${url}">${url}</a>`,
getMailHTML = mail => `<a href="mailto:${mail}">${mail}</a>`;

describe('link in angle brackets', () => {

	it('#a link', () => {
		testURL.forEach(url =>
			Mdjs.md2html(`<${url}>`).should.be.containEql(getUrlHTML(url)) +
			Mdjs.md2html(`<${url}> `).should.be.containEql(getUrlHTML(url)) +
			Mdjs.md2html(` <${url}>`).should.be.containEql(getUrlHTML(url)) +
			Mdjs.md2html(` <${url}> `).should.be.containEql(getUrlHTML(url)) +
			Mdjs.md2html(`URL: <${url}>`).should.be.containEql(`URL: ` + getUrlHTML(url) ) +
			Mdjs.md2html(`URL: <${url}>,you can visit it.`).should.be.containEql(`URL: ` +getUrlHTML(url) + `,you can visit it.`)
		);
	});
	it('#a mail', () => {
		testMail.forEach(mail =>
			Mdjs.md2html(`<${mail}>`).should.be.containEql(getMailHTML(mail)) +
			Mdjs.md2html(`<${mail}> `).should.be.containEql(getMailHTML(mail)) +
			Mdjs.md2html(` <${mail}>`).should.be.containEql(getMailHTML(mail)) +
			Mdjs.md2html(` <${mail}> `).should.be.containEql(getMailHTML(mail)) +
			Mdjs.md2html(`mail: <${mail}>`).should.be.containEql(`mail: ` + getMailHTML(mail)) +
			Mdjs.md2html(`please email to this link:<${mail}>. `).should.be.containEql(
				`please email to this link:` + getMailHTML(mail) + `.`)
		);
	});
	it('#a tag', () => {
		Mdjs.md2html('<a href="http://www.github.com">hello</a>').should.be
			.eql(`<p><a href="http://www.github.com">hello</a></p>`);
		Mdjs.md2html('<span data-mail="xx@xx.com">hello</span>').should.be
			.eql(`<p><span data-mail="xx@xx.com">hello</span></p>`);
	});
	it('#mix', () => {
		Mdjs.md2html('<span data-link="https://www.github.com"><https://github.com></span>').should.be
			.eql(`<p><span data-link="https://www.github.com"><a title="" href="https://github.com">https://github.com</a></span></p>`);
		Mdjs.md2html('<span data-mail="xx@xx.com"><xx@xx.com></span>').should.be
			.eql(`<p><span data-mail="xx@xx.com"><a href="mailto:xx@xx.com">xx@xx.com</a></span></p>`);
	});
});
