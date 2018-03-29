//@ts-check

let { Assert } = require('./Assert');
let cheerio = require('cheerio');

/**
 * @param {string} html
 */
function validateHTML(html) {
	let $ = cheerio.load(html);

	/**
	 * @param {string} selector
	 */
	function select(selector) { return createSelectResult($(selector), $) }
	return {  select };
}

/**
 * @param {Cheerio} $dom
 * @param {CheerioStatic} $
 */
function createSelectResult($dom, $) {
	let chains = { print, length, attr, html, text, select, eq};
	return chains;

	function print() {
		console.log($.html($dom));
		return chains;
	}

	/**
	 * @param {number} length
	 */
	function length(length) {
		Assert($dom.length).equals(length);
		return chains;
	}

	/**
	 * @param {string} attr
	 * @param {string} value
	 */
	function attr(attr, value) {
		Assert($dom.attr(attr)).equals(value);
		return chains;
	}

	/**
	 * @param {string} html
	 */
	function html(html) {
		Assert($dom.html()).equals(html);
		return chains;
	}

	/**
	 * @param {string} text
	 */
	function text (text) {
		Assert($dom.text()).equals(text);
		return chains;
	}

	/**
	 * @param {string} selector
	 */
	function select(selector) {
		return createSelectResult($(selector), $);
	}

	/**
	 * @param {number} index
	 */
	function eq(index) {
		return createSelectResult($dom.eq(index), $);
	}

}

module.exports = { validateHTML };
