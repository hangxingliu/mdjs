# Mdjs

[![Build Status](https://travis-ci.org/hangxingliu/mdjs.svg?branch=master)](https://travis-ci.org/hangxingliu/mdjs)

> Mdjs is a lightweight Markdown parser for JavaScript
>  (一个轻量级的 Markdown 解析器)   
> **Demo**: <http://hangxingliu.github.io/mdjs.editor/>   
> **Mdjs.editor**: 
> [Github](https://github.com/hangxingliu/mdjs.editor)
> [Git@OSC](http://git.oschina.net/voyageliu/mdjs.editor)

---

## Latest version (目前版本)

### 1.0.5

2021-11-05

- 修复了URL转译问题
- 修复了链接的title的问题
- 修复了HTML注释的问题


更多更新日志请参阅: [CHANGELOG.md](documents/CHANGELOG.md)

## Usage (使用)

### Web frontend (Web 前端)

``` html
<!-- 不依赖其他任何库,仅一个脚本文件即可 -->
<script src="mdjs.min.js" type="text/javascript" charset="utf-8"></script>
```

``` javascript
//方法一
var html = Mdjs.md2html(markdownText);
//方法二
var mdjs = new Mdjs();
var html = mdjs.md2html(markdownText);
```

### Node.js

``` bash
npm i md-js
```

``` javascript
//方法一
var Mdjs = require('md-js');
var html = Mdjs.md2html(markdownText);
//方法二
var Mdjs = require('md-js').Mdjs;
var mdjs = new Mdjs();
var html = mdjs.md2html(markdownText);
```

### Options for parser (配置解析选项)

``` javascript
var mdjs = new Mdjs();
var html = mdjs.md2html(markdownText, {
	//markdown 文本中表示段落的每行行末都加入 换行标签<br/>
	alwaysNewline: false
});
```

### Custom render rules (自定义渲染规则)

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

更多自定义渲染规则请参阅: [CUSTOM_RENDER.md](documents/CUSTOM_RENDER.md)


## Features (语法支持)

目前广泛使用的的Markdown语法都能被解析,
额外支持的语法还有:

- `脚注`
- `表格`
- `[toc]`

暂不支持的语法和功能:

- `选项框`
- `流程图,时序图和LaTeX公式`
- `代码块的高亮`

## Maintenance manual (开发维护手册)

参考学习或开发维护可参考文档:
[DEVELOP_MANUAL.md](documents/DEVELOP_MANUAL.md)

## Author (作者)

@hangxingliu (Liu Yue)   
[Github](https://github.com/hangxingliu)   
[码云Gitee](https://git.oschina.net/voyageliu)   

## License (开源协议)

[Apache Licence 2.0](LICENSE)
