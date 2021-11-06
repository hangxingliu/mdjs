import { Logger } from "../base";
import { deepStrictEqual } from "assert";

import { safeEncodeURI } from "../../utils";

export async function main(logger: Logger) {
  {
    const input = "https://zh.wikipedia.org/wiki/轻量级标记语言";
    const output = "https://zh.wikipedia.org/wiki/%E8%BD%BB%E9%87%8F%E7%BA%A7%E6%A0%87%E8%AE%B0%E8%AF%AD%E8%A8%80";

    deepStrictEqual(safeEncodeURI(input), output);
    deepStrictEqual(safeEncodeURI(output), output);
  }

  {
    const input =
      "https://www.google.com/search?q=hello+%E8%BD%BB%E9%87%8F%E7%BA%A7%E6%A0%87%E8%AE%B0%E8%AF%AD%E8%A8%80";
    const output =
      "https://www.google.com/search?q=hello+%E8%BD%BB%E9%87%8F%E7%BA%A7%E6%A0%87%E8%AE%B0%E8%AF%AD%E8%A8%80";
    deepStrictEqual(safeEncodeURI(input), output);
  }

  {
    const input = "./Privacy and Terms.html";
    const output = "./Privacy%20and%20Terms.html";
    deepStrictEqual(safeEncodeURI(input), output);
  }

  {
    const input1: any = "";
    const input2: any = null;
    const output = "";
    deepStrictEqual(safeEncodeURI(input1), output);
    deepStrictEqual(safeEncodeURI(input2), output);
  }
}
