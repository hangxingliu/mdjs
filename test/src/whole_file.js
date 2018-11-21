//@ts-check
require('colors');
let Mdjs = require('../..').Mdjs;

const TEST_ENV = `${__dirname}/../env`;
const DIST_DIR = `${TEST_ENV}/dist`;

let fs = require('fs-extra'),
	htmlWrapper = fs.readFileSync(`${TEST_ENV}/all_in_one_wrapper.html`, 'utf8');

let markdown = fs.readFileSync(`${TEST_ENV}/all_in_one.md`, 'utf8');

if (fs.existsSync(DIST_DIR))
	fs.removeSync(DIST_DIR);
fs.mkdirsSync(DIST_DIR);

describe('whole file test', () => {
	it('#all in one markdown document to HTML', () => {
		let mdjs = new Mdjs();

		mdjs.render.func.table = (headContent, bodyContent) =>
			`<table class="table table-striped"><thead>${headContent}</thead><tbody>${bodyContent}</tbody></table>`,
			mdjs.render.tag.codeBlock = [
				'<div class="card my-2"><div class="card-block"><h6 class="card-subtitle text-muted">$language</h6>' +
				'<pre><code>',
				'</code></pre></div></div>'],

		//Add wikipedia link provider
		mdjs.render.addRefLinkProvider(
			name => name.startsWith('wiki:') ?
				`https://en.wikipedia.org/wiki/${name.slice(5).replace(/\s+/g, '_')}` :
				null);

		fs.writeFileSync(`${DIST_DIR}/all_in_one.html`,
			htmlWrapper.replace('{{ output }}', mdjs.md2html(markdown)));
	});


	it('#all in one markdown document to command line markup text', () => {
		let mdjs = new Mdjs(getMdjsCliRender());

		//Add wikipedia link provider
		mdjs.render.addRefLinkProvider(
			name => name.startsWith('wiki:') ?
				`https://en.wikipedia.org/wiki/${name.slice(5).replace(/\s+/g, '_')}` :
				null);

		fs.writeFileSync(`${DIST_DIR}/all_in_one`,mdjs.md2html(markdown));
	});


});


function getMdjsCliRender() {
	var render = new Mdjs.MdjsRenderer();
	render.tag = {
		hr: '=====================\n',
		br: '\n',
		p: ['', '\n'],

		quote: ['\n', '\n'],
		del: ['\u001b[2m', '\u001b[22m'],
		strong: ['\u001b[1m', '\u001b[22m'],
		em: ['\u001b[3m', '\u001b[23m'],
		inlineCode: ['\u001b[34m', '\u001b[39m'],

		codeBlock: ['\n', '\n'],
		list: ['\n', '\n'],
		orderList: ['- ', '\n'],
		listItem: ['- ', '\n'],

		toc: ['\n===============\n', '===============\n'],
		tocList: ['\n- ', '\n'],
		tocItem: ['', ''],
		footNote: ['===============\n', '===============\n'],
	},

	render.func = {
		heading: (level, name, content) => `${content.bold.cyan}:\n`,
		link: (uri, title, content) => `[${content.bold.white}](${uri.underline.white})`,
		email: email => `<${email.underline.white}>`,
		image: (uri, title, altText) => `[${altText.bold.white}](${uri.underline.white})`,
		table: (headContent, bodyContent) =>
			`  table  \n=========\n${headContent}---------\n${bodyContent}\n=========\n`,
		tableRow: (isHead, cols, align) => {
			void align;
			var line = cols.reduce((a, b) => a += `${b}\t`, '');
			return (isHead ? line.bold : line) + '\n';
		},
		footNoteLink: (uri, title, content) => `[${content}]`.red,
		footNote: (name, content) => `| ${content}`,
		footNoteName: id => `${id}`
	};

	return render;
}
