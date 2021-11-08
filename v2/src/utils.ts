import type { FootnoteDescriptor, ListStackInterface, ListType, ReferenceAndFootnoteInterface, ReferenceLinkDescriptor } from "./types";

function hasStringMethod(methodName: keyof String) {
  return Object.prototype.hasOwnProperty.call(String, methodName);
}

/**
 * Only encode raw URI but not encoded URI
 */
export function safeEncodeURI(uri: string): string {
  if (uri === null || uri === undefined) return "";
  try {
    if (uri !== decodeURIComponent(uri)) return uri;
  } catch (error) {}
  return encodeURI(uri);
}

/**
 * This regex expression is used for funcion `escapeHTML`
 * for checking is a string contains characters need to be escaped
 */
const REGEX_SPECIAL_CHARS = /[<>"'&]/;

/**
 * Escape special characters in html string
 * @see https://github.com/component/escape-html/blob/master/index.js
 * @license MIT
 */
export function escapeHTML(html: string): string {
  const matched = REGEX_SPECIAL_CHARS.exec(html);
  if (!matched) return html;

  let result = "";
  let escape = "";
  let index = 0;
  let lastIndex = 0;
  const htmlLen = html.length;
  for (index = matched.index; index < htmlLen; index++) {
    switch (html.charCodeAt(index)) {
      case 34: // "
        escape = "&quot;";
        break;
      case 38: // &
        escape = "&amp;";
        break;
      case 39: // '
        escape = "&#39;";
        break;
      case 60: // <
        escape = "&lt;";
        break;
      case 62: // >
        escape = "&gt;";
        break;
      default:
        continue;
    }
    if (lastIndex !== index) result += html.substring(lastIndex, index);
    lastIndex = index + 1;
    result += escape;
  }
  return lastIndex !== index ? result + html.substring(lastIndex, index) : result;
}

const _getSpaces = hasStringMethod("repeat")
  ? (len: number) => " ".repeat(len)
  : (len: number) => new Array(len).join(" ");
const spacesCache = _getSpaces(1024);

/**
 * Generate spaces string with special length
 */
export function getSpaces(len: number): string {
  if (len <= 0) return "";
  if (len <= 1024) return spacesCache.slice(0, len);
  return _getSpaces(len);
}

/**
 * get count of leading space characters of a string
 * (count of spaces at beginning)
 */
export function countLeadingSpaces(str: string, tabWidth: number): number {
  let count = 0;
  for (let j = 0; j < str.length; j++) {
    if (str[j] == " ") count++;
    else if (str[j] == "\t") count += tabWidth;
    else break;
  }
  return count;
}

/**
 * @returns `0`: it is not a heading
 */
export function isHeading(stripedLine: string): number {
  let level = 0;
  for (; level < stripedLine.length; level++) if (stripedLine[level] != "#") break;
  return level;
}

const MATCH_TRAILING_SPACES = /\s+$/;

export function getTrailingSpaces(line: string): string {
  const mtx = line.match(MATCH_TRAILING_SPACES);
  if (!mtx) return "";
  return mtx[0];
}

export function toLegalAttributeValue(str: string): string {
  return str.replace(/\W+/g, "_").replace(/^_/, "").replace(/_$/, "");
}

/**
 * Reference-style links and footnotes manager
 */
export class ReferenceAndFootnote implements ReferenceAndFootnoteInterface {
  private readonly map = new Map<string, ReferenceLinkDescriptor | FootnoteDescriptor>();
  readonly footnotes: FootnoteDescriptor[] = [];
  constructor(private resolveFootnoteLink: (index: number) => string) {}

  addReference = (name: string, content: ReferenceLinkDescriptor) => {
    this.map.set(name.toLowerCase(), content);
  };
  addFootnote = (name: string, content: Partial<FootnoteDescriptor>) => {
    content.id = this.footnotes.push(content as any);
    content.url = this.resolveFootnoteLink(content.id);
    this.map.set(name.toLowerCase(), content as any);
  };
  get = (name: string) => this.map.get(name.toLowerCase());
}

export function resolveLinkString(link: string): { url: string; title: string } {
  link = link.trim();
  const match = link.match(/^(.+?)\s+(.+)$/);
  // there is a title in the link string
  if (match) {
    const title = match[2];
    if (title.length >= 2) {
      const ch1 = title[0];
      const ch2 = title[title.length - 1];
      if ((ch1 === "'" && ch2 === "'") || (ch1 === '"' && ch2 === '"') || (ch1 === "(" && ch2 === ")")) {
        return { url: link, title };
      }
    }
  }
  return { url: link, title: "" };
}

export function isHorizontalRule(str: string, gfm: boolean): boolean {
  if (str.length < 3) return false;
  const code = str.charCodeAt(0);
  // 61 '=' , 45 '-' , 95 '_' , 42 '*'
  // 32 ' ' ,  9 '\t'
  if (gfm && code === 61) return false;
  if (code !== 61 && code !== 45 && code !== 42 && code !== 95) return false;
  for (let i = 0, charCode = 0; i < str.length; i++) {
    charCode = str.charCodeAt(i);
    if (charCode == 32 || charCode == 9) continue;
    if (charCode != code) return false;
  }
  return true;
}

/**
 * Stack for list items
 */
export class ListStack implements ListStackInterface {
  private readonly levels: number[] = [];
  private readonly indexes: number[] = [];
  private readonly types: ListType[] = [];
  private last = -1;

  getTopLevel = () => (this.last >= 0 ? this.levels[this.last] : -1);
  getTopType = () => (this.last >= 0 ? this.types[this.last] : 0);
  getIndexAndIncr = () => (this.last >= 0 ? this.indexes[this.last]++ : 0);

  push = (level: number, type: ListType) => {
    this.levels.push(level);
    this.types.push(type);
    this.indexes.push(0);
    this.last++;
  };
  pop = () => {
    this.levels.pop();
    this.types.pop();
    this.indexes.pop();
    this.last--;
  };
}

/** Table of Contents */
export class ToC {
  readonly title: string[] = [];
  readonly id: string[] = [];
  readonly level: number[] = [];
  push = (title: string, id: string, level: number) => {
    this.title.push(title);
    this.id.push(id);
    this.level.push(level);
  }
  length = () => this.title.length;
}

const MATCH_UL = /^[\*\-\+] +\S*/g;
const MATCH_OL = /^\d+\. +\S*/g;

export const OrderedListType: ListType = 1;
export const UnorderedListType: ListType = 2;

export function getListTypeFromLine(stripedLine: string, gfm: boolean): ListType {
  if (isHorizontalRule(stripedLine, gfm)) return 0;
  if (stripedLine.search(MATCH_OL) != -1) return OrderedListType;
  if (stripedLine.search(MATCH_UL) != -1) return UnorderedListType;
  return 0;
}
