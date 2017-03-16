
/// <reference types="node" />

declare module 'md-js' {
	export var Mdjs: ClassMdjsStatic;
	export var MdjsRenderer: ClassMdjsRendererStatic;

	export function md2html(md: String | Buffer | Object, options?: MdjsParseOptions | Object): String;
	export function escapedHTML(str: String): String;
}

class ClassMdjs {
	md2html(md: String | Buffer | Object, options?: MdjsParseOptions | Object): String;
	renderer: ClassMdjsRenderer;
}

interface ClassMdjsStatic {
	new (customRender?: ClassMdjsRenderer): ClassMdjs;
	prototype: ClassMdjs;

	md2html(md: String | Buffer | Object, options?: MdjsParseOptions | Object): String;
	escapedHTML(str: String): String;

	MdjsRenderer: ClassMdjsRendererStatic;
}

interface ClassMdjsRenderer {
	
	addReferenceLinkProvider(provider: (name: String) => String | MdjsLinkObject): void;
	_resolveRefLink(referName: String): String | MdjsLinkObject;

	tag: {
		hr: '<hr />';
		br: '<br />';
		p: ['<p>', '</p>'];

		quote: ['<blockquote>', '</blockquote>'];
		del: ['<del>', '</del>'];
		strong: ['<strong>', '</strong>'];
		em: ['<em>', '</em>'];
		inlineCode: ['<code>', '</code>'];

		codeBlock: ['<pre><code data-lang="$language">', '</code></pre>'];
		list: ['<ul>', '</ul>'];
		orderList: ['<ol>', '</ol>'];
		listItem: ['<li>', '</li>'];

		toc: ['<div class="md_toc">', '</div>'];
		tocList: ['<ol>','</ol>'];
		tocItem: ['<a href="#$uri"><li>', '</li></a>'];
		footNote: ['<div class="md_foot"><ol>', '</ol></div>'];
	};

	func: {
		heading(level: Number, name: String, content: String): String;
		link(uri: String, title: String, content: String): String;
		email(email: String): String;
		image(uri: String, title: String, altText: String): String;
		footNoteLink(uri: String, title: String, content: String): String;
		table(headContent: String, bodyContent: String): String;
		tableRow(isHead: Boolean, cols: Array<String>, align: Array<Number>): String;
		footNode(name: String, content: String): String;
	};
	
}

interface ClassMdjsRendererStatic {
	new (): ClassMdjsRenderer;
	prototype: ClassMdjsRenderer;
}

interface MdjsParseOptions {
	/**
	 * insert <br> to each new line in paragraphs
	 * default value: false
	 */
	alwaysNewline: boolean;
}

interface MdjsLinkObject {
	url: String;
	title?: String;
	text?: String;
	/**
	 * same with text
	 */
	content?: String;
}

declare var Mdjs: ClassMdjsStatic;