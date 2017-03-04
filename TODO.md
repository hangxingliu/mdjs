# TODO

## TODO List

- [x] 支持行尾空格换行模式(至少两个空格)
- [x] 代码无法正常换行的问题
- [x] 脚标链接到 undefined 的 bug
- [ ] 脚标多行无效的Bug
- [x] 引用文本多行合并为一行的bug
- [ ] 行前的第一个空格被删除了的bug
- [ ] 修改脚注的拼写为footnote
- [ ] 添加自定义渲染器的支持

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
