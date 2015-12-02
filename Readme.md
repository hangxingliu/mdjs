# Mdjs开发手册
> Mdjs是一个轻量级的Js的Markdown文件解析器

---
`2015年12月03日`

欢迎大家参考学习,也望大家能够对本解析器中的不足或错误进行指正批评.

开发者: **刘越(HangxingLiu)**

![我的微博:](http://www.sinaimg.cn/blog/developer/wiki/LOGO_16x16.png)[@航行刘](http://weibo.com/chinavl)


[TOC]

## 开源声明

Mdjs遵循[Apache Licence 2.0](LICENSE)

> 允许使用在商业应用中,允许通过修改来满足实际需求\(但需要在被修改的文件中说明\).

## 使用方法

``` html
	<script src="mdjs.min.js" type="text/javascript" charset="utf-8"></script>
```

``` javascript
	var html = Mdjs.md2html(markdown);
```

- `demo.html` : 简单的Markdown显示样例
- `demoEditor.html` : 简单的Markdown实时预览编辑器样例

## 注意事项

1. 本解析器对解析出来的HTML不带任何CSS样式