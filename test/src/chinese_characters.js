//@ts-check

let { Assert } = require('@hangxingliu/assert');
let Mdjs = require('../..').Mdjs;

const IMG1 = `![this is a image](imgs/This is a 中文图片 100%.png)`;
const IMG2 = `![this is a image](imgs/This%20is%20a%20%E4%B8%AD%E6%96%87%E5%9B%BE%E7%89%87%20100%25.png)`;

describe('Chinese characters in the URL', () => {
	it('# escaped URL and raw URL', () => {
		Assert(Mdjs.md2html(IMG1)).equals(Mdjs.md2html(IMG2))
	});
});
