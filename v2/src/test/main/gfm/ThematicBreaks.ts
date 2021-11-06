import { Logger } from "../../base";
import { deepStrictEqual } from "assert";

import { md2html } from "../../../main";

export async function main(logger: Logger) {
  logger.log(`Example 13`);
  deepStrictEqual(md2html(`***\n---\n___`), "<hr /><hr /><hr />");

  logger.log(`Example 14`);
  deepStrictEqual(md2html(`+++`), "<p>+++</p>");

  logger.log(`Example 15`);
  deepStrictEqual(md2html(`===`, { gfm: true }), "<p>===</p>");

  logger.log(`Example 16`);
  // <p>--\n**\n__</p>
  deepStrictEqual(md2html(`--\n**\n__`, { gfm: true }), "<p>--**__</p>");
}
