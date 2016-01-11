# Mdjs

> Mdjs是一个易用的轻量级的Js的Markdown文件解析器
> **演示效果**可以查看,基于Mdjs写的在线Markdown编辑器`Mdjs.editor`
> Mdjs.editor项目地址:&nbsp;&nbsp;[GitOsc][mdjseditorOSC]&nbsp;&nbsp; [Github][mdjseditorGithub]
> **Mdjs.editor项目演示**: [效果演示][mdjseditordemo]

[mdjseditorOSC]: http://git.oschina.net/voyageliu/mdjs.editor
[mdjseditorGithub]: https://github.com/hangxingliu/mdjs.editor
[mdjseditordemo]: http://hangxingliu.github.io/mdjs.editor/
---
`2016年01月12日`

Version `0.4 Dev`

欢迎大家参考学习,也望大家能够对本解析器中的不足或错误进行指正批评.

开发者: **刘越(HangxingLiu)**
![我的微博:](http://www.sinaimg.cn/blog/developer/wiki/LOGO_16x16.png)[@航行刘](http://weibo.com/chinavl)


[TOC]

## 开源声明

Mdjs遵循[Apache Licence 2.0](LICENSE)

> 允许使用在商业应用中,允许通过修改来满足实际需求(但需要在被修改的文件中说明).

## 使用方法

``` html
	<!-- 不依赖其他任何库,仅一个脚本文件即可 -->
	<script src="mdjs.min.js" type="text/javascript" charset="utf-8"></script>
	
	<!-- 注意:如果需要对解析出的HTML附带上更多的样式,可以参考或引用mdcss.css样式表文件(下面一句) -->
	<link rel="stylesheet" type="text/css" href="mdcss.css"/>
```

``` javascript
	var html = Mdjs.md2html(markdown);
```

## 语法支持

目前用的广泛使用的Markdown语法都能被正常解析

> **注意**:流程图,时序图,LaTeX公式的解析将不会在我的Mdjs主线中版本中出现,
因为这个解析器追求的是简洁与轻量
**当然,你也可以通过使用其他库对解析结果内的各类图表公式进行解析显示**

## 演示文件

- `demo/demo.html` : 简单的Markdown显示样例
- ~~`demo/demoEditor.html` : 简单的Markdown实时预览编辑器样例~~
	- **已废弃**:编辑器实现可以参考`Mdjs.editor`项目,项目地址见当前文档头部
---
- `Example.md` :用来测试解析器的演示Markdown文件

---
- `mdcss.css` :一个简单的用于显示Markdown解析成的HTML的样式表

## 注意事项

1. 本解析器不会对代码块进行高亮处理,但是开发者可以轻松地为解析出来的`<code></code>`绑上高亮组件以达到高亮显示的目的
2. 这个解析器没有自带的Markdown编辑器功能,可以参考`Mdjs.editor`(项目地址见当前文档头部)(一款基于Mdjs的在线Markdown编辑器)的实现

## 开发手册

[开发手册](http://git.oschina.net/voyageliu/mdjs/wikis/Developer)