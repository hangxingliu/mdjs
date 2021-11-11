//#region options
export type MarkdownStringifyOptions = ProcessLinesOptions & {
  footnotePrefix?: string;
  renderer?: MdjsRenderer;
};
export type ProcessLinesOptions = {
  file?: string;
  tabWidth?: number;
  alwaysNewline?: boolean;
  gfm?: boolean;
  /** add `id` and `name` for heading tag */
  headingId?: boolean;
};
export type ProcessLinesContext = {
  render: MdjsRenderer;
  refs: ReferenceAndFootnoteInterface;
  stack: ListStackInterface;
  inQuote?: boolean;
};
export type ProcessLineContext = {
  render: MdjsRenderer;
  refs: ReferenceAndFootnoteInterface;
};

export type GetHeadingOptions = ProcessLinesOptions & {
  parseLine?: boolean;
  limit?: number;
  maxLevel?: number;
}
//#endregion options

//#region result
export type HeadingItem = {
  level: number;
  content: string;
  text?: string;
  start?: [number, number];
  end?: [number, number];
}
//#endregion result

export interface MdjsRenderer {
  hr: string;
  br: string;

  p: [string, string];
  del: [string, string];
  strong: [string, string];
  em: [string, string];
  code: [string, string];

  ul: [string, string];
  ol: [string, string];
  li(index: number, content: string): string;

  heading(level: number, name: string, contentHTML: string): string;

  link(uri: string, title: string, contentHTML: string): string;
  email(email: string): string;
  linkFootnote(uri: string, title: string, content: string): string;

  img(uri: string, title: string, alt: string): string;

  footNote(footnotes: FootnoteItem[]): string;

  table(headHTML: string, bodyHTML: string): string;
  tableRow(isHead: boolean, colHTMLs: string[], aligns?: TableTextAlign[]): string;

  codeBlock(language: string, html: string): string;
  quoteBlock(html: string): string;

  toc: [string, string];
  tocList: [string, string];
  tocItem(uri: string, title: string): string;
}

export type ReferenceLinkDescriptor = {
  url: string;
  title: string;
};
export type FootnoteDescriptor = {
  /** footnote index */
  id: number;
  url: string;
  title: string;
  content: string;
};
export interface ReferenceAndFootnoteInterface {
  addReference(name: string, content: ReferenceLinkDescriptor): void;
  addFootnote(name: string, content: FootnoteDescriptor): void;
  get(name: string): ReferenceLinkDescriptor | FootnoteDescriptor;
}

export type FootnoteItem = {
  id: string;
  content: string;
};

export type TableTextAlign = "left" | "right" | "center";

/**
 * 0: Unknown; 1: Ordered List; 2: Unordered List
 */
export type ListType = 0 | 1 | 2;
export interface ListStackInterface {
  getTopLevel(): number;
  getTopType(): ListType;
  getIndexAndIncr(): number
  push(level: number, type: ListType): void;
  pop(): void;
}

export type EmbeddedMarkdownResolver = (file: string, path: string) => Promise<string[]>;
export const enum EmbeddedMarkdownSyntax {
  /** \`markdown:include.md\` */
  inlineCode = 'inlineCode',
  /** [!INCLUDE \[Common Section\](../includes/common.md)] */
  link = 'link',
  /** {!include.md!} */
  python = 'python',
}
