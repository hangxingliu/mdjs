# TODO

## TODO List

- [x] 支持行尾空格换行模式(至少两个空格)
- [x] 代码无法正常换行的问题
- [x] 脚标链接到 undefined 的 bug
- [x] 脚标多行无效的Bug
- [x] 引用文本多行合并为一行的bug
- [x] 行前的第一个空格被删除了的bug
- [x] 修改脚注的拼写为footnote
- [x] 添加自定义的参考式提供器
- [x] 添加自定义渲染器的支持
- [x] 完成Typescript模板文件
- [ ] 编写单元测试
- [ ] 整理一下目录结构
- [ ] 将 Polyfill 文件构建入mdjs.min.js文件中
- [ ] 整理一下README.md
- [ ] 编写 Bootstrap 外观 Markdown 渲染器
- [ ] 发布 1.0.0 beta版
- [ ] 添加链接处理器
- [ ] 添加只有一对中括号的参考式链接,例如: this is [wiki: github]
- [ ] 添加开头注释的支持

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
