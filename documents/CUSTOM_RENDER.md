# 自定义渲染器配置

Mdjs 中所有的 Markdown 解析渲染修饰内容的生成工作均有 `Mdjs.ClassMdjsRenderer` 类处理

目前`Mdjs.ClassMdjsRenderer`类的配置有三部分

1. `tag` HTML标签
2. `func` 生成HTML标签的函数
3. `addRefLinkProvider(provider)` 添加自定义链接参考式的提供函数

## 使用参考

``` javascript
	//创建自定义渲染器类
	var myRender = new Mdjs.MdjsRenderer();
	//配置自定义引用区块的HTML标签
	myRender.tag.quote = ['<div class="blockquote">', '</div>'],
	//配置自定义邮箱部分的 HTML 生成函数
	myRender.func.email = function(email){
		return '<a href="mailto:' + email + '">' + email + '</a>';
	};
	//自定义链接参考式
	myRender.addRefLinkProvider(function(referName) {
		return { url: 'https://github.com/' + referName };
	});
	var mdjs = new Mdjs(myRender);
	var html = mdjs.md2html(markdownText);
```

## 具体配置

> 可参考 typescript 模版文件 [md-js.d.ts](../typescript/md-js.d.ts)

``` typescript
	// tag 字段
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
```

``` typescript
	// func 字段
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
```

``` typescript
	//自定义链接参考式
	addReferenceLinkProvider(provider: (name: String) => String | MdjsLinkObject): void
```
