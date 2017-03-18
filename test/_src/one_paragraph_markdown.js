
describe('one paragraph markdown', () => {
	it('#should be wrap <p>', () => {
		Mdjs.md2html('the**lazy**dog')
			.should.be.equal('<p>the<strong>lazy</strong>dog</p>');
	});
	it('#should has <br/>', () => {
		Mdjs.md2html('the**lazy**dog\nDog')
			.should.be.equal('<p>the<strong>lazy</strong>dogDog</p>');
		
		Mdjs.md2html('the**lazy**dog  \nDog')
			.should.be.equal('<p>the<strong>lazy</strong>dog<br/>Dog</p>');
		
		Mdjs.md2html('the**lazy**dog\nDog', { alwaysNewline: true })
			.should.be.equal('<p>the<strong>lazy</strong>dog<br/>Dog</p>');
	});
});