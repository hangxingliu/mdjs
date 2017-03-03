# TODO

## TODO List

- 支持行尾空格换行模式(至少两个空格)
- 添加自定义渲染器的支持
- 脚标链接到 undefined 的 bug
- 脚标多行无效的Bug

## How to use

``` javascript
	var Mdjs = require('md-js')

	Mdjs.markdown2html('# Markdown ....');
	//Actually, Mdjs.markdown2html := xxx = new Mdjs(); xxx.markdown2html(...);

	var md = new Mdjs();
	md.registerLinkHandler((...)=>link);
	md.registerXXXXHandler((...)=>xxxx);

	md.md2html(..., returnDetails);
```
