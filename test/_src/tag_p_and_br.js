
describe('render tag <p> and <br/>', () => {
	it('#should be wrap <p>', () => {
		Mdjs.md2html('the**lazy**dog')
			.should.be.equal('<p>the<strong>lazy</strong>dog</p>');
	});
	it('#should has <br/>', () => {
		Mdjs.md2html('the**lazy**dog\nDog')
			.should.be.equal('<p>the<strong>lazy</strong>dogDog</p>');
		
		Mdjs.md2html('the**lazy**dog  \nDog')
			.should.be.equal('<p>the<strong>lazy</strong>dog  <br />Dog</p>');
		
		Mdjs.md2html('the**lazy**dog\nDog', { alwaysNewline: true })
			.should.be.equal('<p>the<strong>lazy</strong>dog<br />Dog</p>');
				
		Mdjs.md2html('the**lazy**dog\nDog\n\nNew paragraph', { alwaysNewline: true })
			.should.be.equal('<p>the<strong>lazy</strong>dog<br />Dog</p><p>New paragraph</p>');
		
		Mdjs.md2html('the**lazy**dog\nDog  \n\nNew paragraph')
			.should.be.equal('<p>the<strong>lazy</strong>dogDog  <br /></p><p>New paragraph</p>');
	});
	it('#there has no "<br />" in the end', () => {
		Mdjs.md2html('the', { alwaysNewline: true })
			.should.be.equal('<p>the</p>');
	});
	it('#there is "</p><p>" but not "<br />"', () => {
		Mdjs.md2html('the\n\nlazy\ndog', { alwaysNewline: true })
			.should.be.equal('<p>the</p><p>lazy<br />dog</p>');
	});
});