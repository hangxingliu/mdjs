#!/usr/bin/env node


let fs = require('fs-extra');

const TO = `${__dirname}/../../mdjs.wiki`,
	FILES = fs.readdirSync(__dirname).filter(fn=>fn.endsWith('.md'));

fs.existsSync(TO) || (console.error(`  error: release path is not exists! "${TO}"`) + process.exit(1));
fs.existsSync(`${TO}/Home.markdown`) || (console.error(`  error: sign file of release path is not exists! "${TO}/Home.markdown"`) + process.exit(1));

FILES.forEach(fn => fs.copySync(`${__dirname}/${fn}`, `${TO}/${fn}`) + console.log(`- ${fn}`));
console.log('  release success!');
