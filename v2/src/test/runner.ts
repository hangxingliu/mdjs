import * as path from "path";
import { glob } from "glob";
import { parallelLimit } from "async";
import { Logger } from "./base";

let prefix = process.argv[2] || '';
if (prefix) {
  prefix = prefix.replace(/^\.\//, '')
    .replace(/^(v2)?\/?src\/test\//, '')
    .replace(/\.(js|ts)$/, '');
}

const logger = new Logger('TestRunner');
logger.log(`start testing` + (prefix ? ` in the files with prefix "${prefix}"` : ''));

const limit = 10;
const exclude = [
  'base.ts',
  'base.js',
  'runner.ts',
  'runner.js',
  'debug.js',
];

glob('**/*.{js,ts}', { cwd: __dirname }, (error, files) => {
  if (error) return logger.fatal(`scan test files failed:`, error);
  files = files.filter(it => {
    if (exclude.indexOf(it) >= 0) return false;
    if (it.endsWith('.d.ts')) return false;
    if (prefix) return it.startsWith(prefix);
    return true;
  })
  logger.log(`found ${files.length} test files`);

  parallelLimit(files.map(file => async function runFile() {
    const logger = new Logger(file);
    const filePath = path.resolve(__dirname, file);
    let module: any;
    try {
      module = require(filePath)
    } catch (error) {
      logger.error(`load test file failed`);
      throw error;
    }
    if (typeof module.main === 'function') {
      logger.log(`started`);
      try {
        await module.main(logger);
      } catch (error) {
        logger.error(error);
        return false;
      }
      logger.log(`passed`);
      return true;
    }
    logger.warn(`skip this file, because it doesn't export main function`);
    return false;
  }), limit, (error, results) => {
    if (error) logger.fatal(`run test files failed:`, error);
    logger.log(`run test files done`);
  })
})
