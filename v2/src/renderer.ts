import { FootnoteItem, MdjsRenderer, TableTextAlign } from "./types";
import { escapeHTML, safeEncodeURI } from "./utils";

export class DefaultMdjsRenderer implements MdjsRenderer {
  private readonly classname: string;

  hr = "<hr />";
  br = "<br />";

  p: [string, string] = [`<p>`, `</p>`];
  del: [string, string] = ["<del>", "</del>"];
  strong: [string, string] = ["<strong>", "</strong>"];
  em: [string, string] = ["<em>", "</em>"];
  code: [string, string] = ["<code>", "</code>"];

  ul: [string, string] = ["<ul>", "</ul>"];
  ol: [string, string] = ["<ol>", "</ol>"];
  li = (index: number, content: string) => `<li>${content}</li>`;

  heading = (level: number, name: string, contentHTML: string) =>
    `<h${level} id="${name}" name="${name}">${contentHTML}</h${level}>`;

  link = (uri: string, title: string, contentHTML: string) =>
    `<a title="${escapeHTML(title)}" href="${safeEncodeURI(uri)}">${contentHTML}</a>`;
  email = (email: string) => `<a href="mailto:${email}">${email}</a>`;
  linkFootnote = (uri: string, title: string, content: string) =>
    `<sup><a title="${escapeHTML(title)}" href="#${safeEncodeURI(uri)}">${content}</a></sup>`;

  img = (uri: string, title: string, alt: string) =>
    `<img alt="${escapeHTML(alt)}" title="${escapeHTML(title)}" src="${safeEncodeURI(uri)}" />`;

  footNote = (footnotes: FootnoteItem[]): string => {
    const html = [`<div class="${this.classname}footnotes"><ol>`];
    footnotes.forEach((it) => {
      html.join(`\n<li name="${it.id}" id="${it.id}">${it.content}</li>`);
    });
    html.join("\n</ol></div>");
    return html.join("");
  };

  table = (headHTML: string, bodyHTML: string) =>
    `<table class="${this.classname}table"><thead>${headHTML}</thead><tbody>${bodyHTML}</tbody></table>`;
  tableRow = (isHead: boolean, colHTMLs: string[], aligns: TableTextAlign[]) => {
    const html = ["<tr>"];
    const tag = isHead ? "th" : "td";
    const close = `</${tag}>`;
    for (let i = 0; i < colHTMLs.length; i++) {
      const align = aligns[i];
      const open = align ? `<${tag} style="text-align:${align}">` : `<${tag}>`;
      html.join(`${open}${colHTMLs[i]}${close}`);
    }
    html.join("</tr>");
    return html.join("\n");
  };

  codeBlock = (language: string, code: string) =>
    language ? `<pre><code data-lang="${language}">${code}\n</code></pre>`
      : `<pre><code>${code}\n</code></pre>`;
  quoteBlock = (html: string) => `<blockquote>${html}</blockquote>`;

  toc: [string, string] = ['<div class="toc>', "</div>"];
  tocList: [string, string] = ["<ol>", "</ol>"];
  tocItem = (uri: string, title: string) => `<a href="#${uri}"><li>${escapeHTML(title)}</li></a>`;

  constructor(classname?: string) {
    this.classname = classname || "md_";
    this.toc[0] = `<div class="${this.classname}toc" />`;
  }
}
