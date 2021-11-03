//@ts-check

let { Assert } = require('@hangxingliu/assert');
let cheerio = require('cheerio');

/**
 * @param {string} html
 */
function validateHTML(html) {
	let $ = cheerio.load(html, { xmlMode: true });

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
	let chains = { print, length, attr, attrMap, html, trimmedText, text, select, filter, eq };
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
	 * @param {{[name: string]: string}} map
	 */
	function attrMap(map) {
		for (let key in map)
			attr(key, map[key]);
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
	 * @param {string} t
	 */
	function trimmedText(t) { return text(t, true); }

	/**
	 * @param {string} t
	 * @param {boolean} [trim]
	 */
	function text(t, trim = false) {
		let actual = $dom.text();
		if (trim) {
			actual = actual.trim();
			t = t.trim();
		}
		Assert(actual).equals(t);
		return chains;
	}

	/**
	 * @param {string} selector
	 */
	function select(selector) {
		return createSelectResult($(selector, $dom), $);
	}

	/**
	 * @param {string} selector
	 */
	function filter(selector) {
		return createSelectResult($dom.filter(selector), $);
	}

	/**
	 * @param {number} index
	 */
	function eq(index) {
		return createSelectResult($dom.eq(index), $);
	}

}

module.exports = { validateHTML };
