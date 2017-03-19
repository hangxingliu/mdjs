# Mdjs

> Mdjs 是一个用 Javascript 写的 轻量级的的 Markdown 解析器   
> **Demo**: <http://hangxingliu.github.io/mdjs.editor/>
> **Mdjs.editor**: 
> [Github](https://github.com/hangxingliu/mdjs.editor)
> [Git@OSC](http://git.oschina.net/voyageliu/mdjs.editor)

---

## 目前版本

### 1.0.1 **beta**

2017-03-19

- 修复了使用尖括号`<xxx>`表示网址和 Email 时匹配出错的 bug
- 修复了段落无法自动自动收尾`</p>`的 bug
- 修复了在段落换行上的一点小问题
- 修复了某些邮箱地址无法被匹配的bug(例如:`<xxx.xx@xx.xx>`)
- 优化了一行只有一张图片的检测机制

### 1.0.0 **beta**

2017-03-16

- 修复了许多解析的Bug
- 将Mdjs的功能全部封装成了类, 且支持了在Node.js开发中使用
- 支持了自定义渲染器(针对自己的需要定制HTML输出,以及自定的参考式提供器)
- 支持了`alwaysNewline`解析参数, 以至于可以支持行末空格换行 也可以支持回车换行
- 添加了`typescript`模板文件, 使得在使用时IDE可以有更好的代码提示与补全
- 去掉了默认的错误try/catch, 让开发者可以自己捕获错误对象
- 优化了大量代码

更多更新日志请参阅: [CHANGELOG.md](documents/CHANGELOG.md)

## 使用

### Web前端

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

### 配置解析选项

``` javascript
	var mdjs = new Mdjs();
	var html = mdjs.md2html(markdownText, {
		//markdown 文本中表示段落的每行行末都加入 换行标签<br/>
		alwaysNewline: false
	});
```

### 自定义渲染规则

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


## 语法支持

目前广泛使用的的Markdown语法都能被解析,
额外支持的语法还有:

- `脚注`
- `表格`
- `[toc]`

暂不支持的语法和功能:

- `流程图,时序图和LaTeX公式`
- `代码块的高亮`

## 开发维护手册

参考学习或开发维护可参考文档:
[DEVELOP_MANUAL.md](documents/DEVELOP_MANUAL.md)

## 作者

**刘越(Hangxingliu)**   
[Git@OSC](https://git.oschina.net/voyageliu)   
[Github](https://github.com/hangxingliu)

## 开源协议

[Apache Licence 2.0](LICENSE)