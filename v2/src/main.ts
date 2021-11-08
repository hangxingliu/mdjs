import { DefaultMdjsRenderer } from "./renderer";
import {
  countLeadingSpaces,
  escapeHTML,
  getTrailingSpaces,
  getListTypeFromLine,
  getSpaces,
  isHeading,
  isHorizontalRule,
  ListStack,
  OrderedListType,
  ReferenceAndFootnote,
  resolveLinkString,
  toLegalAttributeValue,
} from "./utils";
import type {
  ReferenceLinkDescriptor,
  FootnoteDescriptor,
  TableTextAlign,
  ListType,
  ProcessLineContext,
  ProcessLinesOptions,
  ProcessLinesContext,
  MarkdownStringifyOptions,
  GetHeadingOptions,
  HeadingItem,
} from "./types";

export function md2html(markdown: string, options?: MarkdownStringifyOptions) {
  if (!options) options = {};
  const renderer = options.renderer || new DefaultMdjsRenderer();
  const info = loadMarkdownToLines(markdown);
  const footnotePrefix = options.footnotePrefix || "footnote_";
  const { lines, refs } = preprocessLines(info.lines, (index) => `${footnotePrefix}${index}`);
  const stack = new ListStack();
  return processLines(lines, { refs, stack, render: renderer }, options);
}

//
//  ____
// |  _ \ _ __ ___ _ __  _ __ ___   ___ ___  ___ ___
// | |_) | '__/ _ \ '_ \| '__/ _ \ / __/ _ \/ __/ __|
// |  __/| | |  __/ |_) | | | (_) | (_|  __/\__ \__ \
// |_|   |_|  \___| .__/|_|  \___/ \___\___||___/___/
//                |_|
//
export function loadMarkdownToLines(markdown: any): { frontmatter?: string; lines: string[] } {
  if (markdown === null || markdown === undefined) return { lines: [] };
  if (typeof markdown === "string") {
  } else if (markdown.constructor) {
    const c = markdown.constructor;
    if (typeof c.isBuffer === "function" && c.isBuffer(markdown)) markdown = (markdown as Buffer).toString("utf8");
  } else {
    markdown = String(markdown);
  }
  // utf-8 BOM is 65279 (0xFEFF)
  if (markdown.charCodeAt(0) === 0xfeff) {
    markdown = markdown.slice(1);
  }
  if (!markdown) return { lines: [] };

  let lines: string[] = markdown.split(/\r?\n/);
  if (lines.length === 0) return { lines: [] };

  // front matter
  let frontmatter: string;
  const FRONT_MATTER_BOUNDARY = /^\-{3,}\s*$/;
  if (FRONT_MATTER_BOUNDARY.test(lines[0])) {
    const frontmatters = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (FRONT_MATTER_BOUNDARY.test(line)) {
        frontmatter = frontmatters.join("\n");
        lines = lines.slice(i + 1);
        break;
      }
      frontmatters.push(line);
    }
  }
  return { frontmatter, lines };
}

export function preprocessLines(lines: string[], resolveFootnoteLink: (index: number) => string) {
  const MATCH_REF_OR_FOOTNOTE = /^\[([\^]?)(.+)\]\:\s+(.+)$/;

  let line: string;
  const len = lines.length;
  const nextLines: string[] = [];
  const refs = new ReferenceAndFootnote(resolveFootnoteLink);

  let preMatched: RegExpMatchArray;

  /** @todo todo: skip blockquotes, codes ... */
  for (let i = 0; i < len; i++) {
    line = lines[i];
    let mtx: RegExpMatchArray;
    if (preMatched) {
      mtx = preMatched;
      preMatched = undefined;
    } else {
      mtx = line.trim().match(MATCH_REF_OR_FOOTNOTE);
      if (!mtx) {
        nextLines.push(line);
        continue;
      }
    }

    const isFootnote = mtx[1] === "^";
    if (isFootnote) {
      let content = mtx[3];
      // Search the end of footnote content
      for (let j = i + 1; j < len; j++, i++) {
        line = lines[j].trim();
        if (!line) break; // empty line
        preMatched = line.match(MATCH_REF_OR_FOOTNOTE);
        // matched the footnote or reference link
        if (preMatched) break;
        content += "\n" + lines[j];
      }
      refs.addFootnote(mtx[1] + mtx[2], { title: mtx[2], content });
    } else {
      // Reference-style link
      refs.addReference(mtx[1] + mtx[2], resolveLinkString(mtx[3].trim()));
    }
  }
  return { lines: nextLines, refs };
}

//
//  _     _
// | |   (_)_ __   ___  ___
// | |   | | '_ \ / _ \/ __|
// | |___| | | | |  __/\__ \
// |_____|_|_| |_|\___||___/
//
//
/** characters could be escaped by '\\' */
const CHARACTERS_CAN_ESCAPE = "#`*[]()-_{}+.!|\\";

const REGEX_URL = /^\w+:\/{2,3}\S+$/g;
const REGEX_EMAIL = /^\S+@\S+\.\S+$/g;
const enum LinkType {
  IMG = 1,
  FOOTNOTE = 2,
  LINK = 4,
}


const defaultTabWidth = 4;

const MATCH_HTML_TAG = /<\/?[^<>]+>/g;

export function processLines(lines: string[], context: ProcessLinesContext, options: ProcessLinesOptions) {
  const length = lines.length;

  const { render, inQuote } = context;
  let { tabWidth, alwaysNewline } = options;
  if (!Number.isInteger(tabWidth) || tabWidth > 0 === false) tabWidth = defaultTabWidth;

  let resultMarkdown = "";
  let partialHTML: string;

  let codeBlockPendingLines: string[] = null;
  let codeLanguage: string;

  // 当前行左端的空格字符数量, 1个Tab = 4个空格
  let leftSpaces = 0;

  let tocPosition = -1; //哪儿要输出目录结构

  //记录目录每个节点的标题
  let tocTitle: string[] = [];
  //记录目录每隔节点跳转到URI(#HASH)
  let tocUri: string[] = [];
  //记录目录每个节点的层次
  let tocLevel: number[] = [];

  let isParagraphFinished = true; //文本段落是否已经结束, 是否已经插入过了</p>
  let isLastLineEndWithNewLine = false; //文本段落中上一行是否需要换行(结尾有两及个以上的空白字符)

  let headingLevel = 0;

  let inlineStats: ProcessLineStats = {};
  // 目前循环正在处理着的行
  let currLine = "";
  // 目前行去掉两端空白字符后的字符串
  let stripedLine = "";

  for (let i = 0; i < length; i++) {
    currLine = lines[i];
    stripedLine = currLine.trim();

    // 目前正在处理代码,或者代码结尾
    if (codeBlockPendingLines) {
      // 代码结束了
      if (stripedLine == "```") {
        resultMarkdown += render.codeBlock(codeLanguage, codeBlockPendingLines.join("\n"));
        codeBlockPendingLines = null;
      } else {
        codeBlockPendingLines.push(escapeHTML(currLine));
      }
      continue;
    }

    // 计算行前空格数
    leftSpaces = countLeadingSpaces(currLine, tabWidth);

    // 列表行
    let listItemType = getListTypeFromLine(stripedLine, options.gfm);
    if (listItemType != 0) {
      resultMarkdown += processList(leftSpaces, listItemType, stripedLine, context);
      continue;
    }
    resultMarkdown += processListEnd(context);

    //空白行
    if (stripedLine.length == 0) {
      //如果段落还没有结束了, 就结束当前段落然后输出</p>
      if (!isParagraphFinished) {
        resultMarkdown += (isLastLineEndWithNewLine ? render.br : "") + render.p[1];
        isParagraphFinished = true;
      }
      continue;
    }

    // 没有 Tab 键在行前
    if (leftSpaces < tabWidth) {
      if (stripedLine.startsWith("```")) {
        // 进入代码块
        codeLanguage = stripedLine.slice(3).trim();
        codeBlockPendingLines = [];
        continue;
      }

      //是标题吗?多少个标题
      headingLevel = isHeading(stripedLine);

      //是标题
      if (headingLevel > 0) {
        let cutEnd = stripedLine.length - 1; //标题内容的结尾位置
        for (; cutEnd > headingLevel; cutEnd--)
          if (stripedLine[cutEnd] != "#")
            //为了去掉结尾的#号
            break;

        let headerText = stripedLine.slice(headingLevel, cutEnd + 1);
        //tocMark 给当前标题标记的 ID 和 name,为了能让TOC目录点击跳转
        let headerName = (headerText = processLine(headerText, 0, context));
        tocLevel.push(headingLevel);
        tocTitle.push((headerName = headerName.trim().replace(MATCH_HTML_TAG, "")));
        tocUri.push((headerName = toLegalAttributeValue(headerName)));
        resultMarkdown += render.heading(headingLevel, headerName, headerText);
        continue;
      }

      //是引用区块 >
      if (stripedLine[0] == ">" && stripedLine.length > 1) {
        // 存放需要区块引用的行
        let quoteLines = [];
        let k = i;
        for (; k < length; k++) {
          let lstripLine = lines[k].replace(/^\s+/, "");
          // 不是引用区块的内容了
          if (lstripLine.length == 0) break;
          if (lstripLine[0] == ">") {
            // 检查一下每行末尾是否有需要换行的空格留出, 如果有请保留, 防止被合并到一行内
            lstripLine = lstripLine.slice(1);
          } else if (inQuote) {
            // 如果是区块引用嵌入区块引用,并且没有>符号就返回上一层区块引用
            // 如果不按上面那行做,会导致区块引用嵌套时结尾一定会有一行无法去掉的空白
            break;
          } else {
            lstripLine = lines[k];
          }
          //如果没有 > 开头的话就保留原来的字符串(防止丢失行首的空格)
          quoteLines.push(lstripLine);
        }
        context.inQuote = true;
        const html = processLines(quoteLines, context, options);
        context.inQuote = false;
        resultMarkdown += render.quoteBlock(html);
        i = k - 1;
        continue;
      }

      //横线
      if (isHorizontalRule(stripedLine, options.gfm)) {
        resultMarkdown += render.hr + '\n';
        continue;
      }

      // record ToC position
      // 记录当前位置, 在全部文档解析完后输出到这个位置
      if (stripedLine == "[TOC]") {
        tocPosition = resultMarkdown.length;
        continue;
      }

      // 表格
      let tableColumns = processTableLine(stripedLine, false);
      // 可能是表格, 两行表格语句确定表格结构
      if (tableColumns && i < length - 1) {
        // 存放表格每列的对齐格式
        const aligns = processTableFormatLine(lines[i + 1].trim(), tableColumns.length);
        if (aligns) {
          //表格头部
          const tbHead = render.tableRow(true, tableColumns, aligns);
          let tbBody = "";
          let j = i + 2;
          for (; j < length; j++) {
            if (!(tableColumns = processTableLine(lines[j].trim(), false))) break; //不是表格语句了
            tbBody += render.tableRow(false, tableColumns, aligns);
          }
          i = j - 1;
          resultMarkdown += render.table(tbHead, tbBody);
          continue;
        }
      }
    } else {
      // leftSpaces >= tabWidth
      if (i === 0 || lines[i - 1].trim().length === 0) {
        // 使用开头tab表示的代码
        codeBlockPendingLines = [];

        // space是为了中间的空白行,
        // endl是为了保存代码最后有效行在哪
        let space = "";
        let endL = i;
        let leftTab: number;
        for (let j = i; j < length; j++) {
          // 空白行,记入space,这样做是为了如果代码块最后有空行而不输出
          if (lines[j].trim().length == 0) {
            space += "\n";
            continue;
          }
          // 空白小于一个Tab键了,退出代码块
          if ((leftTab = countLeadingSpaces(lines[j], tabWidth)) < tabWidth) break;

          codeBlockPendingLines.push(space + getSpaces(leftTab - tabWidth) + escapeHTML(lines[j].trim()));
          // 重置空白行和记录最后有效行
          space = "";
          endL = j;
        }
        resultMarkdown += render.codeBlock("", codeBlockPendingLines.join("\n"));
        codeBlockPendingLines = null;
        i = endL;
        continue;
      } else {
        // remove useless leading spaces
        currLine = currLine.replace(/^\s+/, '');
      }
    }

    // 普通文本正常的一行
    // 真的是上面注释的那样吗?其实如果它的下一行是---或===的话,那这一行就是标题行了
    if (i + 1 < length) {
      let nextLine = lines[i + 1];
      if (countLeadingSpaces(nextLine, tabWidth) < tabWidth) {
        nextLine = nextLine.trim();
        if (isHorizontalRule(nextLine, options.gfm)) {
          // 这行是标题
          let level = 3; // 默认三级
          if (nextLine[0] == "=") level = 1;
          else if (nextLine[0] == "-") level = 2;

          let headerText = processLine(stripedLine, 0, context);
          let headerName = headerText;
          tocLevel.push(level);
          tocTitle.push((headerName = headerName.trim().replace(MATCH_HTML_TAG, "")));
          tocUri.push((headerName = toLegalAttributeValue(headerName)));
          resultMarkdown += render.heading(level, headerName, headerText);
          i++; //跳过下一行
          continue;
        }
      }
    }

    //这下真的是普通的一行了
    inlineStats = {};
    partialHTML = processLine(currLine, 0, context, inlineStats);

    //判断当行是否有且只有一个图片标签, 且在段落外. 如果是, 则优化输出. 不将这个图片包裹在一个新的段落(<p></p>)内
    if (isParagraphFinished && inlineStats.onlyOneImg) {
      resultMarkdown += partialHTML;
    } else {
      //新的段落开始<p>
      if (isParagraphFinished) {
        partialHTML = render.p[0] + partialHTML;
        isLastLineEndWithNewLine = false;
      } else {
        partialHTML = '\n' + partialHTML;
      }
      //如果解析选项要求强制换行(**并且不是段落首行**) 或 上一行末尾含有至少两个空格要求(换行)
      //	就在此行前面加上换行符
      if ((alwaysNewline && !isParagraphFinished) || isLastLineEndWithNewLine) resultMarkdown += render.br;
      // 判断这行行末是否有换行标记(至少两个空白字符)
      isLastLineEndWithNewLine = getTrailingSpaces(currLine).length >= 2;
      resultMarkdown += partialHTML;
      isParagraphFinished = false;
    }

    //循环结束,一行处理完成
  }

  //如果段落没有结束, 就补全</p>
  if (!isParagraphFinished) {
    resultMarkdown += (isLastLineEndWithNewLine ? render.br : "") + render.p[1];
    isParagraphFinished = true;
  }

  //如果需要输出TOC目录
  if (tocPosition != -1)
    resultMarkdown =
      resultMarkdown.slice(0, tocPosition) +
      processTOC(tocTitle, tocUri, tocLevel, context) +
      resultMarkdown.slice(tocPosition);

  if (resultMarkdown.endsWith('\n'))
    resultMarkdown = resultMarkdown.slice(0, resultMarkdown.length - 1);
  return resultMarkdown;
}

export function getHeadings(lines: string[], options: GetHeadingOptions = {}) {
  const length = lines.length;

  let { tabWidth, limit, maxLevel, parseLine } = options;
  if (!Number.isInteger(tabWidth) || tabWidth > 0 === false) tabWidth = defaultTabWidth;
  if (typeof maxLevel !== 'number') maxLevel = 999;
  else if (maxLevel < 1) maxLevel = 1;

  let currLine = "";
  let stripedLine = "";
  let inCodeBlock = false;
  let leadingSpaces = 0;
  let headingLevel: number;
  const result: HeadingItem[] = [];

  for (let i = 0; i < length; i++) {
    currLine = lines[i];
    stripedLine = currLine.trim();

    if (inCodeBlock) {
      // is code block end?
      if (stripedLine == "```")
        inCodeBlock = false;
      continue;
    }
    leadingSpaces = countLeadingSpaces(currLine, tabWidth);
    const listItemType = getListTypeFromLine(stripedLine, options.gfm);
    if (listItemType != 0)
      continue;

    if (leadingSpaces < tabWidth) {
      if (stripedLine.startsWith("```")) {
        inCodeBlock = true;
        continue;
      }
      headingLevel = isHeading(stripedLine);
      if (headingLevel > 0 && headingLevel <= maxLevel) {
        let cutEnd = stripedLine.length - 1; //标题内容的结尾位置
        for (; cutEnd > headingLevel; cutEnd--)
          if (stripedLine[cutEnd] != "#")
            //为了去掉结尾的#号
            break;
        const headerText = stripedLine.slice(headingLevel, cutEnd + 1);
        result.push({ level: headingLevel, content: headerText });
        if (result.length >= limit) return result;
        continue;
      }
      //横线
      if (isHorizontalRule(stripedLine, options.gfm)) {
        continue;
      }
    } else {
      // leftSpaces >= tabWidth
      if (i === 0 || lines[i - 1].trim().length === 0) {
        for (let j = i; j < length; j++) {
          if (lines[j].trim().length == 0) {
            continue;
          }
          if ((leadingSpaces = countLeadingSpaces(lines[j], tabWidth)) < tabWidth)
            break;
        }
        continue;
      } else {
        // remove useless leading spaces
        currLine = currLine.replace(/^\s+/, '');
      }
    }
    // has next line
    if (i + 1 < length) {
      let nextLine = lines[i + 1];
      if (countLeadingSpaces(nextLine, tabWidth) < tabWidth) {
        nextLine = nextLine.trim();
        if (isHorizontalRule(nextLine, options.gfm)) {
          // 这行是标题
          let level = 3; // 默认三级
          if (nextLine[0] == "=") level = 1;
          else if (nextLine[0] == "-") level = 2;
          if (level <= maxLevel) {
            result.push({ level, content: stripedLine });
            if (result.length >= limit) return result;
          }
        }
      }
    }
  }
  return result;
}

//
//  _____ ___   ____
// |_   _/ _ \ / ___|
//   | || | | | |
//   | || |_| | |___
//   |_| \___/ \____|
//
//
function processTOC(tocTitle: string[], tocUri: string[], tocLevel: number[], context: ProcessLinesContext): string {
  const { render } = context;
  const levelStack: number[] = [];
  let lastLevel: number;
  let html = render.toc[0];
  let liHTML: string;

  for (let i = 0; i < tocTitle.length; i++) {
    liHTML = render.tocItem(tocUri[i], tocTitle[i]);
    if (levelStack.length == 0 || tocLevel[i] > lastLevel) {
      html += render.tocList[0] + liHTML;
      levelStack.push((lastLevel = tocLevel[i]));
    } else if (tocLevel[i] == lastLevel) {
      html += liHTML;
    } else {
      html += render.tocList[1];
      levelStack.pop();
      lastLevel = levelStack[levelStack.length - 1];
      i--;
    }
  }
  while (levelStack.length) (html += render.tocList[1]), levelStack.pop();
  return html + render.toc[1];
}

//
//  _     _     _
// | |   (_)___| |_
// | |   | / __| __|
// | |___| \__ \ |_
// |_____|_|___/\__|
//
//
export function processList(level: number, type: ListType, stripedLine: string, context: ProcessLinesContext) {
  const { render, stack } = context;

  // 上一个列表的层次
  let topLevel = stack.getTopLevel();
  const html = processLine(stripedLine, stripedLine.indexOf(" "), context);
  const tags = type == OrderedListType ? render.ol : render.ul;

  if (level > topLevel) {
    // start a sub list of previous list
    // 上一个列表的___子列表___
    stack.push(level, type);
    return tags[0] + render.li(stack.getIndexAndIncr(), html);
  } else if (level == topLevel) {
    // still in previous list
    // 上一个列表的___兄弟(并列)列表___
    return render.li(stack.getIndexAndIncr(), html);
  }

  // leave out from previous list
  // 上一个列表的___父列表___的___兄弟列表___
  let pending = "";
  while (level < topLevel) {
    // 找到属于这个列表的兄弟列表
    if (stack.getTopType() == OrderedListType) pending += render.ol[1];
    // 数字列表
    else pending += render.ul[1]; // 无序列表

    stack.pop();
    topLevel = stack.getTopLevel();
  }

  // 这个列表是最顶层的列表,即暂时没有兄弟列表,是一个新的列表集的开始
  if (topLevel == -1) {
    stack.push(level, type);
    return pending + tags[0] + render.li(stack.getIndexAndIncr(), html);
  }

  return pending + render.li(stack.getIndexAndIncr(), html);
}
function processListEnd(context: ProcessLinesContext) {
  const { stack, render } = context;
  let html = "";
  while (stack.getTopLevel() != -1) {
    if (stack.getTopType() == OrderedListType)
      //数字列表
      html += render.ol[1];
    //无序列表
    else html += render.ul[1];
    stack.pop();
  }
  return html;
}

//
//  _____     _     _
// |_   _|_ _| |__ | | ___
//   | |/ _` | '_ \| |/ _ \
//   | | (_| | |_) | |  __/
//   |_|\__,_|_.__/|_|\___|
//
//
export function processTableFormatLine(stripedLine: string, expectedCols: number): Array<TableTextAlign> {
  // 初步解析表格语句
  let cols = processTableLine(stripedLine, true);
  // 不是格式行
  if (!cols) return null;

  // 返回结果
  let result: Array<TableTextAlign> = [];
  let len = cols.length;
  let i = 0;
  for (; i < len; i++) {
    const col = cols[i];
    if (col.length <= 1) {
      result[i] = null;
      continue;
    }
    // 如果格式描述字符串长度为1,则左对齐
    if (col[col.length - 1] === ":") result[i] = col[0] == ":" ? "center" : "right";
    else result[i] = col[0] == ":" ? "left" : null;
  }
  // 补齐剩下的列
  for (; i < expectedCols; i++) result[i] = null;
  return result;
}
/**
 * @returns `null` represents it is not a table line
 */
export function processTableLine(stripedLine: string, isFormatLine: boolean): string[] {
  const ret: string[] = []; // 返回结果
  let len = stripedLine.length; // 语句长度
  let str = ""; // 解析时临时存储用的字符串,此处临时存当前列的数据
  for (let i = stripedLine[0] == "|" ? 1 : 0; i < len; i++) {
    // 抛弃首个|
    switch (stripedLine[i]) {
      case "\\": // 转义字符
        if (isFormatLine) return null; // 格式行不应该有这个字符
        str += "\\";
        if (stripedLine[i + 1] == "|") (str += "|"), i++; // 转义的|,应该被输出
        continue;
      case "|": // 分隔符
        str = str.trim();
        if (isFormatLine && str.length == 0) return null; // 格式行不允许列格式字符串为空
        ret.push(str); // 存入返回结果
        str = "";
        continue;
    }
    // 其他字符,如果格式行出现其他字符,则说明不是正常格式行
    if (
      !isFormatLine ||
      stripedLine[i] == ":" ||
      stripedLine[i] == "-" ||
      stripedLine[i] == " " ||
      stripedLine[i] == "\t"
    )
      str += stripedLine[i];
    else return null;
  }
  // 没有有效的表格列,证明不是表格
  if (ret.length == 0 && stripedLine[0] != "|") return null;
  str = str.trim();
  // 保存最后一列的数据
  if (str.length != 0) ret.push(str);
  return ret;
}

//
//  ____                                _     _
// |  _ \ _ __ ___   ___ ___  ___ ___  | |   (_)_ __   ___
// | |_) | '__/ _ \ / __/ _ \/ __/ __| | |   | | '_ \ / _ \
// |  __/| | | (_) | (_|  __/\__ \__ \ | |___| | | | |  __/
// |_|   |_|  \___/ \___\___||___/___/ |_____|_|_| |_|\___|
//
//

export type ProcessLineStats = {
  onlyOneImg?: boolean;
};
const noopInlineStats: ProcessLineStats = {};

/**
 * process one markdown line
 * @param line
 * @param start
 * @param render
 * @param stats
 * @returns HTML of this line
 */
export function processLine(line: string, start: number, context: ProcessLineContext, stats?: ProcessLineStats) {
  if (!stats) stats = noopInlineStats;
  const { render, refs } = context;

  const len = line.length;
  const lastIndex = len - 1;

  /** result blocks */
  const resultBlocks = [];
  let pendingBlock = "";

  //上一次出现<strong><i><del>分别是在哪个结果块列表的末尾
  let prevStrong = -1;
  let prevEm = -1;
  let prevDel = -1;

  //上一次出现<strong><i>的类型是*还是_
  let prevStType = "*";
  let prevEmType = "*";

  // next substring will be used in the loop
  let nextPattern: string;
  let nextPatternFrom: number;
  // next substring location will be used in the loop
  let nextLoc: number;

  let linkType: LinkType;
  let linkContent: string;
  let linkURL: string;
  let linkTitle: string;
  let linkDescriptor: FootnoteDescriptor | ReferenceLinkDescriptor;

  let imgCount = 0; //行内图片张数统计

  /** the next substring is email or URI */
  let isEmailOrURL = false;

  let currChar: string;
  let prevChar: string;
  let nextChar: string;

  for (let i = start; i < len; i++) {
    switch (line[i]) {
      case "\\": {
        // 转义字符\打头
        // '\\' in the end represents breaking line
        if (i === lastIndex) {
          pendingBlock += render.br;
        } else {
          nextChar = line[i + 1];
          // 如果\后面的字符是可转义字符才转义
          if (nextChar && CHARACTERS_CAN_ESCAPE.indexOf(nextChar) >= 0) {
            pendingBlock += nextChar;
            i++;
          } else {
            pendingBlock += line[i];
          }
        }
        break;
      }

      //#region inline code
      // 行内代码
      case "`": {
        nextChar = line[i + 1];
        nextPattern = nextChar === "`" ? "``" : "`";
        if ((nextLoc = line.indexOf(nextPattern, i + nextPattern.length)) === -1) {
          // can't find paired tag, print these characters
          // 如果往后找找不到可匹配的结束行内代码的标记,就正常输出
          pendingBlock += nextPattern;
        } else {
          // found paired tag, print as inline code
          // 找到了, 输出行内代码
          pendingBlock += render.code[0] + escapeHTML(line.slice(i + nextPattern.length, nextLoc)) + render.code[1];
          i = nextLoc;
        }
        i += nextPattern.length - 1; // move cursor
        break;
      }
      //#endregion inline code

      //#region deleted
      // 删除线
      case "~": {
        nextChar = line[i + 1];
        if (nextChar === "~") {
          // 两个~才表示删除线
          if (prevDel >= 0) {
            // close tag
            // 前面出现过一次~~了,这个是收尾
            if (pendingBlock === "") {
              // 表示新的子结果块列表才开始,~~包裹的内容为空,~~~~的情况,保留前面的两个~~
              resultBlocks[prevDel] += "~~";
            } else {
              // 正常情况,输出删除线的文本
              resultBlocks[prevDel] += render.del[0];
              pendingBlock += render.del[1];
              prevDel = -1;
            }
          } else {
            // open tag
            // 这是第一次出现~~标记,是个打头,记录一下并开启一个新的子结果块列表
            prevDel = resultBlocks.push(pendingBlock) - 1;
            pendingBlock = "";
          }
          i++;
        } else {
          pendingBlock += "~"; // 只是一个普通的波浪线
        }
        break;
      }
      //#endregion deleted

      //#region strong or italic
      case "*":
      case "_": {
        // Print itself if there are spaces between character '*' and '_'
        // Markdown规范, *或_两边空格, 则当作正常字符输出
        prevChar = line[i - 1];
        currChar = line[i];
        nextChar = line[i + 1];
        if ((prevChar === " " || prevChar === "\t") && (nextChar === " " || nextChar === "\t")) {
          pendingBlock += currChar;
          break;
        }

        if (nextChar === currChar) {
          // next character is same as current character, it means strong format
          // 两个*或_在一起,表示粗体
          if (prevStrong >= 0) {
            // 这个是收尾
            if (prevStType != currChar) {
              // 上次开头的标记字符与本次的不一样,当作正常字符输出
              pendingBlock += line[i++] + currChar;
              break;
            }
            // 一切正常输出加粗内容
            resultBlocks[prevStrong] += render.strong[0];
            pendingBlock += render.strong[1];
            prevStrong = -1;
          } else {
            // 这是开头
            if (line[i + 2] === line[i] && line[i + 3] === line[i]) {
              // 四个连续的*或_,那就不解析前面两个,否则无法出现只想单纯表达四个*的效果
              pendingBlock += line[i++] + line[i++];
            }
            // save pending string and mark current block maybe ended with a strong tag
            prevStrong = resultBlocks.push(pendingBlock) - 1;
            pendingBlock = "";
            prevStType = line[i];
          }
          i++;
          // end of bold
        } else {
          // italic
          if (prevEm >= 0) {
            //这个是收尾
            if (prevEmType != line[i]) {
              //上次开头的字符与本次的不一样,当作正常字符输出
              pendingBlock += line[i];
              break;
            }
            //一切正常输出斜体内容
            resultBlocks[prevEm] += render.em[0];
            pendingBlock += render.em[1];
            prevEm = -1;
          } else {
            //这是开头
            prevEm = resultBlocks.push(pendingBlock) - 1;
            pendingBlock = "";
            prevEmType = line[i];
          }
          // end of italic
        }
        break;
      }
      //#endregion strong or italic

      //#region HTML comment, HTML open tag, link or email
      // 可能是自动链接或自动邮箱或者是 HTML 标签或者干脆就是一个 < 字符
      case "<":
        // HTML comment
        if (line.slice(i + 1, i + 4) === "!--") {
          pendingBlock += "<!--";
          i += 3;
          break;
        }
        isEmailOrURL = true; // 表示有可能是邮箱或URL
        // search the next '>'
        for (nextLoc = i + 1; nextLoc < len; nextLoc++) {
          if (line[nextLoc] === ">") break;
          if (line[nextLoc] === " " || line[nextLoc] === "\t") isEmailOrURL = false; // 出现空白字符了, 不可能是邮箱或URL了
        }
        if (nextLoc >= len) {
          // there is not a close character '>', so print escaped it
          // 都找不到>,那就转义输出吧
          pendingBlock += "&lt;";
          break;
        }

        linkURL = line.slice(i + 1, nextLoc); // 选出<>内的内容
        if (isEmailOrURL) {
          if (linkURL.match(REGEX_URL)) {
            //内容是URL
            pendingBlock += render.link(linkURL, "", linkURL);
            i = nextLoc;
            break;
          }
          if (linkURL.match(REGEX_EMAIL)) {
            //内容是邮箱
            pendingBlock += render.email(linkURL);
            i = nextLoc;
            break;
          }
        }

        pendingBlock += "<"; //当作正常字符输出;
        break;
      //#endregion HTML comment, HTML open tag, link or email

      //#region image
      case "!":
        // check the next character because it maybe a beginin character of image
        // 可能是图片的起始标记, 检查下一个字符
        if (line[i + 1] != "[") pendingBlock += "!"; // Just a exclamation mark (仅是一个感叹号字符)
        break;
      //#endregion image

      //#region link, footnote or image
      case "[": {
        // Maybe a starting mark of the linkable elements:  (可能是可链接的元素起始标记)
        //   ![description](image-url)
        //   [description](link-url)
        //   [description][reference-name]
        //   [^footnote]

        prevChar = line[i - 1];
        nextChar = line[i + 1];
        // Check linkable type (判断类型)
        if (prevChar === "!") linkType = LinkType.IMG;
        else if (line[i + 1] === "^") linkType = LinkType.FOOTNOTE;
        else linkType = LinkType.LINK;

        /** 是否在遍历的时候发现了内嵌图片的开始标记 */
        let hadEmbedImg = 0;

        /** 用来判断是否成功处理并输出了可链接元素 */
        let done = 0;

        /** if `j` becomes `len`, there is not close character `]` for it */
        let j = i + 1;

        //循环为了读取到完整的可链接元素信息
        for (; j < len; j++) {
          switch (line[j]) {
            //如果是图片模式内部就不能有![,如果是链接模式内部就不能有[
            case "!":
              if (line[j + 1] != "[") break; // 仅仅是感叹号
              if (linkType != LinkType.LINK) {
                j = len; // 图片模式和脚注模式跳过
              } else {
                // 标记内嵌图片,跳过[
                hadEmbedImg = 1;
                j++;
              }
              break;
            case "`": //跳过代码块
              nextPattern = line[j + 1] === "`" ? "``" : "`";
              if ((nextLoc = line.indexOf(nextPattern, j + nextPattern.length)) === -1) j += nextPattern.length - 1;
              else j = nextLoc + nextPattern.length - 1;
              break;
            case "[":
              // 可链接元素内不允许再嵌套一次链接
              j = len;
              break;
            case "]":
              // found the end of title part
              // 找到可链接元素的标题/文本部分结束符了
              // 先保存标题部分
              linkContent = line.slice(i + 1, j);

              if (linkType === LinkType.FOOTNOTE) {
                // 如果是脚注,那就直接输出了
                linkDescriptor = refs.get(linkContent);
                if (linkDescriptor) {
                  // 该脚注信息是否存在
                  pendingBlock += render.linkFootnote(linkDescriptor.url, linkDescriptor.title, linkDescriptor["id"]);
                  done = 1;
                  i = j;
                  j = len;
                }
                break;
              }

              nextChar = line[j + 1];
              if (nextChar === "(") {
                nextPattern = ")";
              } else if (nextChar === "[" || (nextChar === " " && line[j + 2] === "[")) {
                nextPattern = "]";
              } else {
                // 发现无法匹配格式 ]( 或是 ] [, 则有可能是直接一个参考式, 或者不是可链接元素
                // Eg. [github-ref-link] or [just-a-string-with-bracket]
                linkDescriptor = refs.get(linkContent);
                if (linkDescriptor) {
                  pendingBlock += render.link(
                    linkDescriptor.url,
                    linkDescriptor.title,
                    processLine(linkContent, 0, context, stats)
                  );
                  done = 1;
                  i = j;
                }
                j = len;
                break;
              }
              nextPatternFrom = nextChar === " " ? j + 3 : j + 2; // 查找开始点,截取点
              if ((nextLoc = line.indexOf(nextPattern, nextPatternFrom)) != -1) {
                // 正常收尾
                // 如果之前有内嵌图片的标记头就跳过这个收尾
                if (hadEmbedImg) {
                  hadEmbedImg = 0;
                  break;
                }
                // 保存链接内容:链接及链接标题部分
                linkTitle = line.slice(nextPatternFrom, nextLoc).trim();

                // [description][reference-name]
                // 参考式,则解析成真实链接内容
                if (nextPattern === "]") {
                  // 如果留空,则表示参考式名称就是标题文本
                  if (linkTitle.length === 0) linkTitle = linkContent;
                  linkDescriptor = refs.get(linkTitle);
                  if (!linkDescriptor) {
                    // Reference is not found
                    // 该参考式不存在
                    j = len;
                    break;
                  }
                } else {
                  // 行内式解析
                  linkDescriptor = resolveLinkString(linkTitle);
                }
                linkURL = linkDescriptor.url;
                linkTitle = linkDescriptor.title || "";

                if (linkType === LinkType.IMG) {
                  // 输出图片
                  // 这里之所以将图片单独作为一个结果块,是因为这样下面可以统计是否当前行只有一个图片
                  resultBlocks.push(pendingBlock);
                  resultBlocks.push(render.img(linkURL, linkTitle, linkContent));
                  pendingBlock = "";
                  imgCount++;
                } else {
                  // print link
                  // 输出链接
                  let htmlContent = processLine(linkContent, 0, context, stats);
                  pendingBlock += render.link(linkURL, linkTitle, htmlContent);
                }
                done = 1;
                i = nextLoc;
              }
              j = len;
              break;
          }
        }

        if (!done && j >= len) {
          //没有有效的尾部,当正常字符串输出
          switch (linkType) {
            case LinkType.FOOTNOTE:
              pendingBlock += "[^";
              i++;
              break;
            case LinkType.IMG:
              pendingBlock += "![";
              break;
            default: // LinkType.LINK pendingBlock += '[';
          }
        }
        break;
      }
      //#endregion link, footnote or image

      default:
        // 基本字符
        pendingBlock += line[i];
    }
  }

  // save pending string to result
  resultBlocks.push(pendingBlock);

  // 如果此语句解析完后发现之前有些~_*不是表示粗体斜体或删除线的就正常输出
  if (prevDel != -1) resultBlocks[prevDel] += "~~";
  if (prevStrong != -1) resultBlocks[prevStrong] += prevStType + prevStType;
  if (prevEm != -1) resultBlocks[prevEm] += prevEmType;

  // 判断是否当前行有且只有一张图片
  if (imgCount === 1) {
    // 统计结果块的数量
    let _blockCount = 0;
    for (let i = 0; i < resultBlocks.length; i++) _blockCount += resultBlocks[i].trim() ? 1 : 0;
    if (_blockCount === 1) stats.onlyOneImg = true;
  }

  return resultBlocks.join("");
}
