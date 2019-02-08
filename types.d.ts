class MdjsClass {
	constructor(customRender?: ClassMdjsRenderer);
	static MdjsRenderer: ClassMdjsRendererStatic;
	static md2html: Mdjs_md2html;
	static escapedHTML: Mdjs_escapedHTML;

	md2html: Mdjs_md2html;
};

type Mdjs_md2html = (md: string | Buffer | Object, options?: MdjsParseOptions) => string;
type Mdjs_escapedHTML = (str: string) => string;

type MdjsParseOptions = {
	/**
	 * insert <br> to each new line in paragraphs
	 * default value: false
	 */
	alwaysNewline?: boolean;
};

type MdjsLinkObject = {
	url: string;
	title?: string;
	text?: string;
	/**
	 * same with text
	 */
	content?: string;
};

type ClassMdjsRendererStatic = {
	new(): ClassMdjsRenderer;
	prototype: ClassMdjsRenderer;
};

type ClassMdjsRenderer = {
	addReferenceLinkProvider(provider: (name: string) => string | MdjsLinkObject): void;
	_resolveRefLink(referName: string): string | MdjsLinkObject;

	tag: {
		/** '<hr />' */
		hr: string;
		/** '<br />' */
		br: string;

		/** ['<p>', '</p>'] */
		p: string[];
		/** ['<blockquote>', '</blockquote>']; */
		quote: string[];
		/** ['<del>', '</del>']; */
		del: string[];
		/** ['<strong>', '</strong>']; */
		strong: string[];
		/** ['<em>', '</em>']; */
		em: string[];
		/** ['<code>', '</code>']; */
		inlineCode: string[];

		/** ['<pre><code data-lang="$language">', '</code></pre>']; */
		codeBlock: string[];
		/** ['<ul>', '</ul>']; */
		list: string[];
		/** ['<ol>', '</ol>']; */
		orderList: string[];
		/** ['<li>', '</li>']; */
		listItem: string[];

		/** ['<div class="md_toc">', '</div>']; */
		toc: string[];
		/** ['<ol>', '</ol>']; */
		tocList: string[];
		/** ['<a href="#$uri"><li>', '</li></a>']; */
		tocItem: string[];
		/** ['<div class="md_foot"><ol>', '</ol></div>']; */
		footNote: string[];

	};
	func: {
		heading(level: Number, name: string, content: string): string;
		link(uri: string, title: string, content: string): string;
		email(email: string): string;
		image(uri: string, title: string, altText: string): string;
		footNoteLink(uri: string, title: string, content: string): string;
		table(headContent: string, bodyContent: string): string;
		tableRow(isHead: Boolean, cols: Array<string>, align: Array<Number>): string;
		footNode(name: string, content: string): string;
	};
};
