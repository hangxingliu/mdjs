import { Logger } from "../../base";
import { deepStrictEqual } from "assert";

import { md2html } from "../../../main";

export async function main(logger: Logger) {
  const cases = require('./ThematicBreaks.json');
  for (let i = 0; i < cases.length; i++) {
    const { id, comment, input, output } = cases[i];
    const testName = id + (comment ? ` "${comment}"` : '');
    logger.log(testName);
    deepStrictEqual(md2html(input, { gfm: true }), output, testName);
  }
}
