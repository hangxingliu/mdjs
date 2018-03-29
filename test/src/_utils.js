//@ts-check
/// <reference path="_utils_type.d.ts" />
let cheerio = require('cheerio');

/**
 * @param {string} html
 * @returns {ValidateHTMLObject}
 */
function validateHTML(html) {
	let $ = cheerio.load(html);
	/**
	 * @param {string} selector
	 * @returns {ValidateHTMLSelectResult}
	 */
	function select(selector) { return new SelectResult($(selector), $) }
	return {  select };
}
/**
 * @param {Cheerio} $dom
 * @param {Cheerio} $
 */
function SelectResult($dom, $) {
	let thiz = this;
	this.length = (length) => {
		$dom.length.should.eql(length);
		return thiz;
	};
	this.attr = (attr, value) => {
		$dom.attr(attr).should.eql(value);
		return thiz;
	};
	this.html = (html) => {
		$dom.html().should.eql(html);
		return thiz;
	};
	this.text = (text) => {
		$dom.text().should.eql(text);
		return thiz;
	};
	this.select = (selector) => {
		return new SelectResult($(selector), $);
	}
}

module.exports = { validateHTML };
