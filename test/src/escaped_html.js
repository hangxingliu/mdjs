//@ts-check

const { Assert } = require('@hangxingliu/assert');
const { escapedHTML } = require('../..');


describe('escapedHTML', () => {
	it('# 1', () => {
		const src = `Mike say: "Hey! What is the answer of 'true && (1 > 10) && (100 < 50)' ?"`;
		const expected = `Mike say: &quot;Hey! What is the answer of &#39;true &amp;&amp; (1 &gt; 10) &amp;&amp; (100 &lt; 50)&#39; ?&quot;`;
		Assert(escapedHTML(src)).equals(expected);
	});
	it('# 2 (special character in the beginning and special character at the end)', () => {
		const src = `<How about this>`;
		const expected = `&lt;How about this&gt;`;
		Assert(escapedHTML(src)).equals(expected);
	});
	it('# 3 (empty string)', () => {
		const src = ``;
		const expected = ``;
		Assert(escapedHTML(src)).equals(expected);
	});
	it('# 4 (string without special characters)', () => {
		const src = `hello`;
		const expected = `hello`;
		Assert(escapedHTML(src)).equals(expected);
	});
	it('# 5 (string full of special characters)', () => {
		const src = `<<<<<<<<<<>>>>>>>>>>`;
		const expected = `&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;`;
		Assert(escapedHTML(src)).equals(expected);
	});
});
