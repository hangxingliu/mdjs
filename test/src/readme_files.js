//@ts-check

require('colors');

const fs = require('fs-extra');
const cheerio = require('cheerio');
const { Mdjs } = require('../..');
const { Assert } = require('@hangxingliu/assert');

const FILES_DIR = `${__dirname}/../env/readme-files`;


const allInputFiles = fs.readdirSync(FILES_DIR)
	.filter(it => it.endsWith('.md'))
	.map(it => `${FILES_DIR}/${it}`)
	.filter(it => fs.statSync(it).isFile());


describe('readme files test', () => {
	allInputFiles.forEach(inputFile => {
		it(`# ${inputFile}`, () => {
			const expectedOutputFile = inputFile.replace(/\.md$/, '.txt');
			const actualOutputFile = inputFile.replace(/\.md$/, '.actual');
			let mdjs = new Mdjs();

			const input = fs.readFileSync(inputFile, 'utf8');
			const expected = fs.readFileSync(expectedOutputFile, 'utf8');

			let actual = mdjs.md2html(input);
			fs.writeFileSync(actualOutputFile, actual);
			actual = cheerio.load('<body>' + actual + '</body>')('body').text();

			const expectedWords = expected.replace(/\s+/g, '');
			const actualWords = actual.replace(/\s+/g, '');

			for (let i = 0; i < expectedWords.length; i++ ) {

				if (expectedWords[i] !== actualWords[i]) {
					const expectedPartStr = getPartOfString(expectedWords, i);
					const actualPartStr = getPartOfString(actualWords, i);

					// throw
					Assert(actualPartStr).equals(expectedPartStr);
				}
			}

			function getPartOfString(str, index) {
				const strArr = [];
				for (let i = index - 30, i2 = index + 30; i < i2; i++)
					if (typeof str[i] === 'string')
						strArr.push(str[i]);
				return strArr.join('').trim();
			}

		});
	});
});

