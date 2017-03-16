# 开发维护手册

## 关键文件列表

- `mdjs.js`  Mdjs 核心代码所在文件
- `polyfill.js` 一些用于支持旧浏览器的字符串处理函数代码文件(polyfill)
- `build.js` Mdjs 编译脚本(用于生成适用于浏览器的Mdjs压缩版本)

## 核心代码

## 核心类

- `ClassMdjsReferManager` 私有类, 用于存储Markdown文档内定义的参考式链接和脚注内容
- `ClassMdjsListItemStack` 私有类, 用于处理Markdown文档中的列表项的栈结构类
- `ClassMdjsRenderer` (Mdjs.MdjsRenderer) 用于指定Markdown渲染效果的类
	- 详细可参见[CUSTOM_RENDER.md](CUSTOM_RENDER.md)
- `ClassMdjs` (Mdjs) Mdjs核心处理类


## 核心函数

1. `Mdjs#md2html(md, options)` 初始化`ClassMdjsReferManager` 和`ClassMdjsListItemStack`. 将 Markdown 文本以换行符为界分割成数组. 并且查找所有的参考式和脚注
2. `handlerLines(lines, inBq, options)` 循环Markdown语句数组, 解析或交给其他函数处理每一行Markdown语句
3. `handlerInline(line, start)` 解析一段行内Markdown语句(只有粗体, 斜体, 删除线, 链接, 图片, 行内代码和普通文本的Markdown语句)
	- 此函数会将行内Markdown代码解析成一个数组, 然后将数组合并成字符串返回(之所以使用数组(结果集), 是因为比较容易在某个数组元素(字符串)中插入行内样式的标签)

其他函数的说明可以参见`mdjs.js`中的JSDoc

## 开发参考

> Markdown语法参考:
> [Markdown 语法说明 (简体中文版)](http://www.appinn.com/markdown/)
> 
---
> 一个在我写完自己的解析器和编辑器前很喜欢的Markdown编辑器(有在线版和离线版的):
> [马克飞象](https://maxiang.io/)