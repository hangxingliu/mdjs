/**
 * such as <https://github.com> but not <div>
 */

describe('link in angle brackets', () => {

	it('#a link', () => {
		Mdjs.md2html('<https://www.github.com>')
			.should.be.containEql('<a title="" href="https://www.github.com">https://www.github.com</a>');
		Mdjs.md2html('<https://www.github.com> ')
			.should.be.containEql('<a title="" href="https://www.github.com">https://www.github.com</a>');			
	});
	it('#a link in a paragraph', () => {
		
	});
	it('#a tag', () => {
		
	});
	it('#a tag in a paragraph', () => {
		
	});
	it('#mix', () => {
		
	});
});