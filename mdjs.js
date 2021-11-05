//@ts-check
/// <reference path="./types.d.ts" />

/**
 * @name MdJs
 * @version 1.0.5 2021-11-05
 * @author @hangxingliu (Liu Yue)
 * @description Mdjs 是一个轻量级的 Javascript 的 Markdown文件解析器
 */
(function () {
	/** name export to window/global/module */
	const EXPORT_NAME = "Mdjs";

	const hasPrototypeMethod = (cls, method) => typeof cls.prototype[method] === 'function';

	/** characters could be escaped by '\\' 可以用斜杠转义的字符(0.3加入|转义) */
	const SPECIAL_CHARACTERS= "#`*[]()-_{}+.!|\\";

	//#region regular expressions for markdown
	// Some regular expressions used to determine Markdown (用于判断 Markdown 语句的正则表达式)
	const REGEX_UL = /^[\*\-\+] +\S*/g;
	const REGEX_OL = /^\d+\. +\S*/g;
	const REGEX_DEL_HTML = /<\/?[^<>]+>/g;
	const REGEX_DEL_NONWORD_CHAR = /\W+/g;
	const REGEX_URL = /^\w+:\/{2,3}\S+$/g;
	const REGEX_EMAIL = /^\S+@\S+\.\S+$/g;
	const REGEX_FOOT_REF_DEFINE = /^\[([\^]?)(.+)\]\:\s+(.+)$/;
	const REGEX_CODE_LANGUAGE = /\$language/g;
	//#endregion

	/** it used to `escpaedHTML` function (用于 escapedHTML 函数的正则表达式) */
	const REGEX_SPECIAL_CHARS = /[<>"'&]/;

	const _createBlankString = hasPrototypeMethod(String, 'repeat')
		? (len => ' '.repeat(len))
		: (len => new Array(len).join(' '));
	const blankString1024 = _createBlankString(1024);

	/**
	 * generate special length space string. (生成指定长度的空格内容字符串)
	 * @param {number} len 长度
	 */
	function getBlankString(len) {
		if (len < 0) return '';
		if (len < 1024) return blankString1024.slice(0, len);
		return _createBlankString(len);
	}

	function safeEncodeURI(uri) {
		try {
			if (uri !== decodeURIComponent(uri))
				return uri;
		} catch (error) { }
		return encodeURI(uri);
	}

	/**
	 * Escape special characters in html string (HTML字符转义)
	 * @param {string} html
	 * @return {string} escaped string (转义后的字符串)
	 */
	function escapedHTML(html) {
		// This function is reference from:
		//   https://github.com/component/escape-html/blob/master/index.js
		const matched = REGEX_SPECIAL_CHARS.exec(html);
		if (!matched)
			return html;

		let result = ''
		let escape = '';
		let index = 0;
		let lastIndex = 0;
		const htmlLen = html.length;
		for (index = matched.index; index < htmlLen; index++) {
			switch (html.charCodeAt(index)) {
				case 34: escape = '&quot;'; break;// "
				case 38: escape = '&amp;'; break;// &
				case 39: escape = '&#39;'; break;// '
				case 60: escape = '&lt;'; break;// <
				case 62: escape = '&gt;'; break;// >
				default: continue;
			}
			if (lastIndex !== index)
				result += html.substring(lastIndex, index);
			lastIndex = index + 1;
			result += escape;
		}
		return lastIndex !== index
			? (result + html.substring(lastIndex, index))
			: result;
	}

	/**
	 * @description 参考式 脚注 管理类
	 * @param {ClassMdjsRenderer} render
	 */
	function ClassMdjsReferManager(render) {
		var referMap = {},//参考式 脚注 Map映射
			footNoteList = [];//脚注 数组列表
		//参考式content为{url:xxx,title:xxx}
		//脚注content为{url:xxx,title:xxx,id:xxx,content:xxx}
		this.set = (name, content, isFootNote) => {
			//如果式脚注就分配ID
			if (isFootNote) {
				content.id = footNoteList.push(content);
				content.url = render.func.footNoteName(content.id);
			}
			referMap[name.toLowerCase()] = content;
		};
		this.get = name => referMap[name.toLowerCase()];
		this.getFootNotes = () => footNoteList;
	}

	/**
	 * @description 用于处理列表项的 栈类
	 */
	function ClassMdjsListItemStack() {
		var levelStack = [],
			typeStack = [],
			stackLength = 0;
		this.topLevel = () => stackLength ? levelStack[stackLength - 1] : -1;
		this.topType = () => stackLength ? typeStack[stackLength - 1] : -1;
		this.push = (level, type) => {
			levelStack.push(level);
			typeStack.push(type);
			stackLength++;
		};
		this.pop = () => {
			levelStack.pop();
			typeStack.pop();
			stackLength = levelStack.length;
		};
	}

	/**
	 * @description 用于渲染Markdown的类
	 */
	function ClassMdjsRenderer() {
		/**
		 * @description 用于渲染的HTML标签
		 */
		this.tag = {
			hr: '<hr />',
			br: '<br />',
			p: ['<p>', '</p>'],

			quote: ['<blockquote>', '</blockquote>'],
			del: ['<del>', '</del>'],
			strong: ['<strong>', '</strong>'],
			em: ['<em>', '</em>'],
			inlineCode: ['<code>', '</code>'],

			codeBlock: ['<pre><code data-lang="$language">', '</code></pre>'],
			list: ['<ul>', '</ul>'],
			orderList: ['<ol>', '</ol>'],
			listItem: ['<li>', '</li>'],

			toc: ['<div class="md_toc">', '</div>'],
			tocList: ['<ol>','</ol>'],
			tocItem: ['<a href="#$uri"><li>', '</li></a>'],
			footNote: ['<div class="md_foot"><ol>', '</ol></div>'],
		};
		/**
		 * @description 用于渲染的HTML生成函数
		 */
		this.func = {
			heading: (level, name, content) =>
				`<h${level} id="${name}" name="${name}">${content}</h${level}>`,
			link: (uri, title, content) =>
				`<a title="${escapedHTML(title)}" href="${safeEncodeURI(uri)}">${content}</a>`,
			email: email => `<a href="mailto:${email}">${email}</a>`,
			image: (uri, title, altText) =>
				`<img alt="${escapedHTML(altText)}" title="${escapedHTML(title)}" src="${safeEncodeURI(uri)}" />`,

			table: (headContent, bodyContent) =>
				`<table class="md_table"><thead>${headContent}</thead><tbody>${bodyContent}</tbody></table>`,
			tableRow: (isHead, cols, align) => {
				var result = '<tr>',
					wrapper0 = isHead ? '<th style="text-align: {0}">' : '<td style="text-align: {0}">',
					wrapper1 = isHead ? '</th>' : '</td>',
					alignValues = ['left', 'center', 'right'];
				for (var i = 0; i < cols.length; i++)
					result += wrapper0.replace('{0}', alignValues[align[i]]) + cols[i] + wrapper1;
				return result + '</tr>'
			},

			footNoteLink: (uri, title, content) =>
				`<sup><a title="${escapedHTML(title)}" href="#${safeEncodeURI(uri)}">${content}</a></sup>`,
			footNote: (name, content) => `<li name="${name}" id="${name}">${content}</li>`,
			footNoteName: id => `markdown_foot_${id}`
		};

		/**
		 * @description 参考式提供器
		 */
		var refLinkProviders = [];
		/**
		 * @description 添加参考式提供器
		 */
		this.addRefLinkProvider = provider => refLinkProviders.push(provider);
		/**
		 * @description 解析参考式
		 */
		this._resolveRefLink = referName => {
			for(var i = 0, result; i < refLinkProviders.length ; i++ )
				if (result = refLinkProviders[i](referName))
					return result.url ? result : { url: result };
		};
	}

	/**
	 * 创建一个Markdown解析器的类
	 * @param {ClassMdjsRenderer} [customRender] 自定义的Markdown渲染器
	 */
	function ClassMdjs(customRender) {
		//Markdown内容渲染器
		var render = new ClassMdjsRenderer();
		if (customRender) render = customRender;
		//用于 Markdown 渲染的 HTML 标签
		var tag = render.tag;
		//用于 Markdown 渲染的 HTML 生成函数
		var tagFunc = render.func;

		//参考式 脚标 管理器
		var footRefManager = new ClassMdjsReferManager(render);
		var listItemStack = new ClassMdjsListItemStack();
		this.render = render;

		/**
		 * @description 将一个 Markdown 文本解析为可显示的HTML
		 * @param {string} md Markdown文本
		 * @param {MdjsParseOptions|Object} [options] 解析选项
		 * @return {string} HTML
		 */
		this.md2html = function (md, options) {
			//处理默认参数
			options = options || {};
			md = typeof md == 'string' ? md : String(md);

			//初始化参考式管理器
			footRefManager = new ClassMdjsReferManager(render);
			//初始化列表元素栈
			listItemStack = new ClassMdjsListItemStack();

			//原始行
			var rawLines = md.split(/\r?\n/),
				rawLinesLength = rawLines.length;
			//去掉了参考式的行
			var lines = [], line = '';

			//寻找参考式
			for (var i = 0; i < rawLinesLength; i++){
				line = rawLines[i];
				var part = line.trim().match(REGEX_FOOT_REF_DEFINE);
				//不是脚标或参考式 行
				if (!part) {
					lines.push(line);
					continue;
				}
				var object, isFootNote = false, content = '';
				if (isFootNote = (part[1] == '^')) { //如果是脚注
					content = part[3];
					//查找接下来的行是否仍然属于该脚注内容
					for (var k = i + 1; k < rawLinesLength; k++ , i++) {
						line = rawLines[k].trim();
						if (!line) break;//空白行
						if (line.match(REGEX_FOOT_REF_DEFINE)) break;//下一个脚注或参考式
						content += '\n' + rawLines[k];
					}
					object = { title: part[2], content: content }
				}else{ //参考式
					object = analyzeTitleableLink(part[3].trim());
				}
				footRefManager.set(part[1] + part[2], object, isFootNote);
			}

			return handlerLines(lines, false, options) + handlerFoot(); //内容最后如果有脚注就输出脚注内容
		}

		/**
		 * @description 从一个可以带标题的链接字符串中出链接地址和链接标题
		 * @param {string} linkString 链接字符串,例如: http://xxx.xx "Title"
		 * @return {{url: string; title: string;}} 包含 url 属性和 title 属性的对象
		 */
		function analyzeTitleableLink(linkString){
			linkString = linkString.trim();
			var ret = { url: linkString, title: '' };
			var match = linkString.match(/(.+?)\s+(.+)/);
			//如果无法匹配表示这个字符串只有链接 没有标题
			if (!match) return ret;
			ret.url = match[1];
			//去掉链接标题的包裹符号
			var title = match[2], c1 = title[0], c2 = title[title.length-1];
			if (title.length >= 2) {
				if (((c1 == '\'' || c1 == '"') && c1 == c2) ||
					(c1 == '(' && c2 == ')')) {
					ret.title = title.slice(1, -1);
					return ret;
				}
			}
			ret.url = linkString;
			return ret;
		}

		/**
		 * detect is a markdown string means cut line (with =_-* at least 3 characters and without non-blank characters)
		 * 判断一句语句是否为一条水平分割线,即三个及以上的=_-* 并且没有别的非空白字符
		 * @param {string} markdownStr markdown string (markdown 字符串)
		 * @returns {boolean}
		 */
		function isCutLine(markdownStr) {
			// 61 '=' , 45 '-' , 95 '_' , 42 '*'
			// 32 ' ' ,  9 '\t'
			let code = markdownStr.charCodeAt(0);
			if (code != 61 && code != 45 && code != 42 && code != 95) return false;

			let count = 0, chr = 0;
			for (let i = 0; i < markdownStr.length; i++ , count++){
				chr = markdownStr.charCodeAt(i);
				if (chr == 32 || chr == 9) continue;
				if (chr != code) return false;
			}
			return count >= 3;
		}

		/**
		 * @description 获得一行语句前面的空白字符(空格,Tab)数,Tab算四个
		 * @param {string} str 语句
		 * @return {number} 语句前的空白字符的数量
		 */
		function countBlankAtTheLeft(str) {
			var lineLeft = 0;
			for (var j = 0; j < str.length; j++){
				if (str[j] == ' ') lineLeft++;
				else if (str[j] == '\t') lineLeft += 4;
				else break;
			}
			return lineLeft;
		}

		/**
		 * @description 判断这行markdown是否为标题行, 如果是则返回标题的层级数(1-8), 否则返回false
		 * @param {string} trimmedStr 一个已经执行了trim的字符串
		 * @returns {number}
		 */
		function isThisLineHeaderAndGetLevel(trimmedStr) {
			let level = 0;
			for (level = 0; level < trimmedStr.length; level++)
				if (trimmedStr[level] != '#')
					break;
			return level;
		}

		/**
		 * @description 一句字符串右侧是否有至少2个空格字符(表示需要换一个新的行)
		 * @param {string} str 一句字符串
		 * @returns {boolean}
		 */
		function isThereAtLeast2spaceInRight(str) {
			return str.endsWith('  ');
		}

		/**
		 * @description 将一个字符串转换成合法的HTML属性值(只保留[a-zA-Z0-9_])
		 * @param {string} str 字符串
		 * @returns {string}
		 */
		function toLegalAttributeValue(str) {
			return str.replace(REGEX_DEL_NONWORD_CHAR, '_').replace(/^_/, '').replace(/_$/, '');
		}

		/**
		 * 通过名称解析参考式或脚注到详细信息对象
		 * @param {string} linkName
		 */
		function resolveReferenceLinkOrFooterNote(linkName) {
			return footRefManager.get(linkName) || render._resolveRefLink(linkName);
		}

		/**
		 * @description 将多个 Markdown 语句解析成可显示的HTML
		 *
		 * @param {string[]} lines 多行Markdown语句组成的数组
		 * @param {boolean} inBq (可选,默认false)解析的是否为Blockquote内的内容
		 * @param {MdjsParseOptions} [options] 解析选项
		 * @return {string} HTML
		 */
		function handlerLines(lines,inBq, options){
			var resultMarkdown = '';

			var linesLength = lines.length; // markdown行数

			var lineNumberInCodeBlock = 0;//目前这行在代码块中的行号(0表示不在代码块中, 1表示代码块中的第一行)

			var currentLine = '';//目前循环正在处理着的行
			var trimmedLine = '';//目前行去掉两端空白字符后的字符串

			var leftWhiteLength = 0;//当前行左端的空格字符数量,//1个Tab=4个空格

			var tocPosition = -1;//哪儿要输出目录结构

			var tocTitle = [],//记录目录每个节点的标题
				tocUri = [],//记录目录每隔节点跳转到URI(#HASH)
				tocLevel = [];//记录目录每个节点的层次

			var isParagraphFinished = true;//文本段落是否已经结束, 是否已经插入过了</p>
			var isLastLineEndWithNewLine = false;//文本段落中上一行是否需要换行(结尾有两及个以上的空白字符)

			var tmpStr = '';
			var analyzeInLineInfo = {};
			var tmpHeaderLevel = 0;

			for (var i = 0; i < linesLength; i++){

				currentLine = lines[i];
				trimmedLine = currentLine.trim();

				//目前正在处理代码,或者代码结尾
				if (lineNumberInCodeBlock) {
					if (trimmedLine == '```') {//代码结束了
						lineNumberInCodeBlock = 0;
						resultMarkdown += tag.codeBlock[1];
						continue;
					}
					//如果是第二行起, 就在行前加入换行符
					resultMarkdown += (lineNumberInCodeBlock++ > 1 ? '\n' : '') + escapedHTML(currentLine);
					continue;
				}

				//计算行前空格数
				leftWhiteLength = countBlankAtTheLeft(currentLine);

				//列表行
				var listItemType = getCurrentLineListItemType(trimmedLine);
				if (listItemType != 0) {
					resultMarkdown += handlerList(leftWhiteLength, listItemType, trimmedLine);
					continue;
				}
				resultMarkdown += handlerListEnd();

				//空白行
				if (trimmedLine.length == 0) {
					//如果段落还没有结束了, 就结束当前段落然后输出</p>
					if (!isParagraphFinished) {
						resultMarkdown += (isLastLineEndWithNewLine ? tag.br : '') + tag.p[1];
						isParagraphFinished = true;
					}
					continue;
				}

				//没有Tab键在行前
				if (leftWhiteLength < 4) {
					if (trimmedLine.startsWith('```')) {//进入代码块
						var lang = trimmedLine.slice(3).trim();
						resultMarkdown += tag.codeBlock[0].replace(REGEX_CODE_LANGUAGE, lang);
						lineNumberInCodeBlock = 1;
						continue;
					}

					//是标题吗?多少个标题
					tmpHeaderLevel = isThisLineHeaderAndGetLevel(trimmedLine);
					//是标题
					if (tmpHeaderLevel > 0) {
						var cutEnd = trimmedLine.length - 1; //标题内容的结尾位置
						for (; cutEnd > tmpHeaderLevel; cutEnd--)
							if (trimmedLine[cutEnd] != '#') //为了去掉结尾的#号
								break;
						var headerText = trimmedLine.slice(tmpHeaderLevel, cutEnd + 1);
						//tocMark 给当前标题标记的 ID 和 name,为了能让TOC目录点击跳转
						var headerName = headerText = handlerInline(headerText, 0);
						tocLevel.push(tmpHeaderLevel);
						tocTitle.push(headerName = headerName.trim().replace(REGEX_DEL_HTML, ''));
						tocUri.push(headerName = toLegalAttributeValue(headerName));
						resultMarkdown += tagFunc.heading(tmpHeaderLevel, headerName, headerText);
						continue;
					}

					//是引用区块 >
					if (trimmedLine[0] == '>' && trimmedLine.length > 1) {
						var quoteLines = [];//存放需要区块引用的行
						for (var k = i; k < linesLength; k++){
							tmpStr = lines[k].trim();
							if (tmpStr.length == 0)
								break;//不是引用区块的内容了
							if (tmpStr[0] == '>')
								tmpStr = tmpStr.slice(1) + (isThereAtLeast2spaceInRight(lines[k]) ? '  ' : '');
								//检查一下每行末尾是否有需要换行的空格留出, 如果有请保留, 防止被合并到一行内
							else if (inBq)
								break;
								//如果是区块引用嵌入区块引用,并且没有>符号就返回上一层区块引用
								//如果不按上面那行做,会导致区块引用嵌套时结尾一定会有一行无法去掉的空白
							else
								tmpStr = lines[k];
								//如果没有 > 开头的话就保留原来的字符串(防止丢失行首的空格)
							quoteLines.push(tmpStr);
						}
						resultMarkdown += tag.quote[0] + handlerLines(quoteLines, true, options) + tag.quote[1];
						i = k - 1;
						continue;
					}
					//横线
					if (isCutLine(trimmedLine)) { resultMarkdown += tag.hr; continue; }

					//目录
					//记录当前位置, 在全部文档解析完后输出到这个位置
					if (trimmedLine == '[TOC]') { tocPosition = resultMarkdown.length; continue; }

					//表格
					let tbRet = handlerTbLine(trimmedLine); //存放表格行解析出来的列数组
					if (tbRet !== false) { //可能是表格
						//两行表格语句确定表格结构
						if (i < linesLength - 1) {
							let tbFmt = handlerTbFmt(lines[i + 1].trim(), tbRet.length); //存放表格每列的对齐格式
							if (tbFmt !== false) {
								//表格头部
								var tbHead = tagFunc.tableRow(true, tbRet, tbFmt);
								var tbBody = '';
								for (var j = i + 2; j < linesLength; j++) {
									if ((tbRet = handlerTbLine(lines[j].trim())) == false) break; //不是表格语句了
									tbBody += tagFunc.tableRow(false, tbRet, tbFmt);
								}
								i = j - 1;
								resultMarkdown += tagFunc.table(tbHead, tbBody);
								continue;
							}
						}
					}

				}else{
					//虽然空格数大于了4,但是还是有可能:
					//代码块(需要检查上一行),普通文本
					//代码块
					if(i==0 || lines[i-1].trim().length == 0){
						resultMarkdown += tag.codeBlock[0].replace(REGEX_CODE_LANGUAGE, '');
						var space = '',endL = i;//space是为了中间的空白行,endl是为了保存代码最后有效行在哪
						for (var j = i, ltab; j < linesLength; j++){
							if (lines[j].trim().length == 0) { space += '\n'; continue; }//空白行,记入space,这样做是为了如果代码块最后有空行而不输出
							if ((ltab = countBlankAtTheLeft(lines[j])) < 4) break;//空白小于一个Tab键了,退出代码块
							resultMarkdown += space + (j == i ? '' : '\n') + getBlankString(ltab - 2) +//去掉开头多余的空白字符
								escapedHTML(lines[j].trim());
							space = '', endL = j;//重置空白行和记录最后有效行
						}
						resultMarkdown += tag.codeBlock[1];
						i = endL;
						continue;
					}
				}

				//普通文本正常的一行
				//真的是上面注释的那样吗?其实如果它的下一行是---或===的话,那这一行就是标题行了
				if (i + 1 < linesLength) {
					var nextLine = lines[i+1].trim();
					if (isCutLine(nextLine)) {//真的也,这行是标题
						var level = 3;//默认三级
						if (nextLine[0] == '=') level = 1;
						else if (nextLine[0] == '-') level = 2;
						var headerName = headerText = handlerInline(trimmedLine,0);
						tocLevel.push(level);
						tocTitle.push(headerName = headerName.trim().replace(REGEX_DEL_HTML, ''));
						tocUri.push(headerName = toLegalAttributeValue(headerName));
						resultMarkdown += tagFunc.heading(level, headerName, headerText);
						i++;//跳过下一行
						continue;
					}
				}

				//这下真的是普通的一行了
				analyzeInLineInfo = {};
				tmpStr = handlerInline(currentLine, 0, analyzeInLineInfo);

				//判断当行是否有且只有一个图片标签, 且在段落外. 如果是, 则优化输出. 不将这个图片包裹在一个新的段落(<p></p>)内
				if (isParagraphFinished && analyzeInLineInfo.onlyOneImg ) {
					resultMarkdown += tmpStr;
				} else {
					//新的段落开始<p>
					if (isParagraphFinished) {
						tmpStr = tag.p[0] + tmpStr;
						isLastLineEndWithNewLine = false;
					}
					//如果解析选项要求强制换行(**并且不是段落首行**) 或 上一行末尾含有至少两个空格要求(换行)
					//	就在此行前面加上换行符
					if ((options.alwaysNewline && !isParagraphFinished) ||
						isLastLineEndWithNewLine)
						resultMarkdown += tag.br;
					//判断这行行末是否有换行标记(至少两个空白字符)
					isLastLineEndWithNewLine = isThereAtLeast2spaceInRight(currentLine);
					resultMarkdown += tmpStr;
					isParagraphFinished = false;
				}

				//循环结束,一行处理完成
			}

			//如果段落没有结束, 就补全</p>
			if (!isParagraphFinished) {
				resultMarkdown += (isLastLineEndWithNewLine ? tag.br : '') + tag.p[1];
				isParagraphFinished = true;
			}


			//如果需要输出TOC目录
			if (tocPosition != -1)
				resultMarkdown = resultMarkdown.slice(0, tocPosition) +
					handlerTOC(tocTitle, tocUri, tocLevel) +
					resultMarkdown.slice(tocPosition);

			return resultMarkdown;
		}

		/**
		 * 生成一个TOC目录的代码
		 * @param {string[]} tocTitle 目录节点的标题
		 * @param {string[]} tocUri 目录节点的连接
		 * @param {number[]} tocLevel 目录节点的层次
		 * @return {string} TOC 目录的HTML代码
		 */
		function handlerTOC(tocTitle, tocUri, tocLevel) {
			var res = tag.toc[0];
			var levelStack = [], lastLevel;
			var liHTML;
			for (var i = 0; i < tocTitle.length; i++) {
				liHTML = tag.tocItem[0].replace('$uri', tocUri[i]) + tocTitle[i] + tag.tocItem[1];
				if (levelStack.length == 0 || tocLevel[i] > lastLevel) {
					res += tag.tocList[0] + liHTML;
					levelStack.push(lastLevel = tocLevel[i]);
				} else if (tocLevel[i] == lastLevel) {
					res += liHTML;
				} else {
					res += tag.tocList[1];
					levelStack.pop();
					lastLevel = levelStack[levelStack.length - 1];
					i--;
				}
			}
			while (levelStack.length) res += tag.tocList[1], levelStack.pop();
			return res + tag.toc[1];
		}

		/**
		 * get type of list item if current line is a list item, return 0 if it is not.
		 * 如果此行是列表行则返回列表的类型(1,2) 否则返回 0
		 * @param {string} trimmedLine Markdown语句
		 * @return {number} 0: not a list item line; 1: ol(ordered list); 2: ul(unordered list)
		 */
		function getCurrentLineListItemType(trimmedLine) {
			if (isCutLine((trimmedLine))) return 0;
			if (trimmedLine.search(REGEX_OL) != -1) return 1;
			if (trimmedLine.search(REGEX_UL) != -1) return 2;
			return 0;
		}

		/**
		 * @description 处理一行Markdown列表语句
		 * @param {any} level 列表语句前面有多少个空格/列表的层次
		 * @param {number} type 哪一种列表(1:数字列表,2:无序列表)
		 * @param {any} str Markdown语句
		 * @return {string} 此句 Markdown 的 HTML
		 */
		function handlerList(level, type, str) {
			var topLevel = listItemStack.topLevel();//上一个列表的层次
			var liHTML = tag.listItem[0] + handlerInline(str, str.indexOf(' ')) + tag.listItem[1];
			var res = '';
			if(level > topLevel){//上一个列表的___子列表___
				listItemStack.push(level,type);
				return (type == 1 ? tag.orderList : tag.list)[0] + liHTML;
			}else if(level == topLevel){//上一个列表的___兄弟(并列)列表___
				return liHTML;
			}else{//上一个列表的___父列表___的___兄弟列表___
				while(level<topLevel){//找到属于这个列表的兄弟列表
					if (listItemStack.topType() == 1)//数字列表
						res += tag.orderList[1];
					else//无序列表
						res += tag.list[1];
					listItemStack.pop();
					topLevel = listItemStack.topLevel();
				}
				if(topLevel==-1){//这个列表是最顶层的列表,即暂时没有兄弟列表,是一个新的列表集的开始
					listItemStack.push(level,type);
					return res + (type == 1 ? tag.orderList : tag.list)[0] + liHTML;
				}else{
					return res + liHTML;
				}
			}
		}

		/**
		 * @description 在处理多个Markdown语句时检测之前是不是还有列表没有结尾
		 * @returns {string} ,如果还有列表没有结尾,则返回列表结尾;反之,返回空白字符串
		 */
		function handlerListEnd(){
			var res = '';
			while(listItemStack.topLevel()!=-1){
				if (listItemStack.topType() == 1)//数字列表
					res += tag.orderList[1];
				else//无序列表
					res += tag.list[1];
				listItemStack.pop();
			}
			return res;
		}

		/**
		 * @description 解析表格格式行,即为表格第二行,格式说明(0:左对齐,1:居中,2:右对齐)
		 * @param {string} tStr trim()过的语句字符串
		 * @param {number} col 表格头部标明了有多少列,如果实际解析出来的没有这么多列,则用0(左对齐)补齐剩下的列
		 * @return {Array|boolean} 如果此语句是表格格式行则返回解析出来的格式,否则返回false
		 */
		function handlerTbFmt(tStr,col){
			var r = handlerTbLine(tStr, true);//初步解析表格语句
			var ret = [];//返回结果
			var i = 0, tmp = 0;//i:循环变量,tmp:临时变量
			if(r === false)return false;//不是格式行
			for (let len = r.length; i < len; i++ , tmp = 0){
				if (r[i].length <= 1) { ret[i] = 0; continue; }//如果格式描述字符串长度为1,则左对齐
				if (r[i][r[i].length - 1] == ':') tmp = (r[i][0] == ':') ? 1 : 2;//右边有:,右对齐,左边又有:,居中
				ret[i] = tmp;//存入返回结果
			}
			for (; i < col; i++)ret[i] = 0;//补齐剩下的列
			return ret;
		}
		/**
		 * @description 解析表格中的行,将一行表格语句分解成一列一列的数组
		 * @param {string} tStr trim()过的语句字符串
		 * @param {boolean} [isFmtL] 此行是否应该为格式行,默认false
		 * @return {any[]|false} 如果此语句是表格中的行则返回解析出来的每一列组成的数组,
		 * 否则返回false(如果指定为格式行,则若不满足格式行的要求,也会返回false)
		 */
		function handlerTbLine(tStr,isFmtL){
			var ret = [];//返回结果
			var len = tStr.length;//语句长度
			var tmpStr = '';//解析时临时存储用的字符串,此处临时存当前列的数据
			for(var i=(tStr[0]=='|'?1:0);i<len;i++){//抛弃首个|
				switch(tStr[i]){
				case '\\'://转义字符
					if (isFmtL) return false;//格式行不应该有这个字符
					tmpStr+='\\';
					if(tStr[i+1]=='|')tmpStr+='|',i++;//转义的|,应该被输出
					continue;
				case '|'://分隔符
					tmpStr = tmpStr.trim();
					if (isFmtL && tmpStr.length == 0) return false;//格式行不允许列格式字符串为空
					ret.push(tmpStr);//存入返回结果
					tmpStr = '';
					continue;
				}
				//其他字符,如果格式行出现其他字符,则说明不是正常格式行
				if(!isFmtL||tStr[i]==':'||tStr[i]=='-'||tStr[i]==' '||tStr[i]=='\t')tmpStr+=tStr[i];
				else return false;
			}
			//没有有效的表格列,证明不是表格
			if(ret.length==0 && tStr[0]!='|')return false;
			tmpStr = tmpStr.trim();
			if(tmpStr.length!=0)ret.push(tmpStr);//保存最后一列的数据
			return ret;
		}

		/**
		 * @description 处理一行Markdown语句(不包括行修饰符, 例如#标题, - 列表...)
		 * @param {string} line 去掉了头部的Markdown语句
		 * @param {number} [start] 这个Markdown语句解析的起始点,默认为0
		 * @param {any} [moreInfo] 如果需要更多的信息,可以传入一个空对象(类似,引用/指针形式)进来以获取
		 */
		function handlerInline(line, start, moreInfo) {
			/*
			结果 = 结果块列表 合并   return rList.join('');
			之所以使用结果块列表, 是因为可以方便的在 某个结果块的尾部插入<strong><em><del>标签
			*/

			var len = line.length; //text的长度
			var rList = []; //返回结果块列表
			var r = ''; //返回结果中最新的一条子结果
			//上一次转义了的字符所在结果块列表中的哪一行(或者说当时结果块列表有多少行了),和那行的偏移量
			var lastMean = -1, lastMeanOffset = -1;

			//上一次出现<strong><i><del>分别是在哪个结果块列表的末尾
			var lastStrong = -1;
			var lastEm = -1;
			var lastDel = -1;
			//上一次出现<strong><i>的类型是*还是_
			var lastStType = '*';
			var lastEmType = '*';

			var nextLoc; //下一次的位置

			/**
			 * 可链接元素的类型:'f':FootNote  'i':Image  'l':Link
			 * @type {'f'|'i'|'l'}
			 */
			let linkType = 'l';
			var linkContent, linkURL, linkTitle;

			var imgCount = 0;//行内图片张数统计

			var tmpString, tmpNumber, tmpObject; //临时变量
			let isEmailOrURL = false;

			//遍历语句
			for (var i = (start || 0); i < len; i++){
				switch (line[i]) {
				case '\\'://转义字符\打头
					//如果\后面的字符是可转义字符才转义
					if (SPECIAL_CHARACTERS.indexOf(line[i + 1]) >= 0) {
						lastMean = rList.length;
						lastMeanOffset = ++i; //++i为了移动到下一位
					}
					r += line[i];
					break;

				case '`'://行内代码
					tmpString = (line[i + 1] == '`') ? '``' : '`';
					tmpNumber = tmpString.length; //tS记录行内代码包裹的标记,tI记录前者长度
					if ((nextLoc = line.indexOf(tmpString, i + tmpNumber)) == -1) r += tmpString; //如果往后找找不到可匹配的结束行内代码的标记,就正常输出
					else { //找到了,输出行内代码
						r += tag.inlineCode[0] + escapedHTML(line.slice(i + tmpNumber, nextLoc)) + tag.inlineCode[1];
						i = nextLoc;
					}
					i += tmpNumber - 1; //移动遍历光标
					break;

				case '~'://删除线
					if (line[i + 1] == '~') {//两个~才表示删除线
						if (lastDel >= 0) {//前面出现过一次~~了,这个是收尾
							if (r == '') { //表示新的子结果块列表才开始,~~包裹的内容为空,~~~~的情况,保留前面的两个~~
								rList[lastDel] += '~~';
							} else { //正常情况,输出删除线的文本
								rList[lastDel] += tag.del[0];
								r += tag.del[1];
								lastDel = -1;
							}
						} else { //这是第一次出现~~标记,是个打头,记录一下并开启一个新的子结果块列表
							lastDel = rList.push(r) - 1;
							r = '';
						}
						i++;
					} else {
						r += '~';//只是一个普通的波浪线
					}
					break;
				case '*':
				case '_'://粗体斜体
					//Markdown规范,*或_两边空格,则当作正常字符输出
					if ((line[i + 1] == ' ' || line[i + 1] == '\t') && (line[i - 1] == ' ' || line[i - 1] == '\t')) {
						r += line[i]; break;
					}
					//两个*或_在一起,表示粗体
					if(line[i+1]==line[i]){
						if(lastStrong>=0){//这个是收尾
							if(lastStType != line[i]){//上次开头的标记字符与本次的不一样,当作正常字符输出
								r+=line[i++]+line[i];break;
							}
							//一切正常输出加粗内容
							rList[lastStrong] += tag.strong[0];
							r += tag.strong[1]; lastStrong = -1;
						}else{//这是开头
							if(line[i+2]==line[i] && line[i+3]==line[i]){//四个连续的*或_,那就不解析前面两个,否则无法出现只想单纯表达四个*的效果
								r+=line[i++]+line[i++];
							}
							lastStrong = rList.push(r) - 1;
							r = '';lastStType = line[i];
						}
						i++;
					}else{//斜体
						if(lastEm>=0){//这个是收尾
							if(lastEmType != line[i]){//上次开头的字符与本次的不一样,当作正常字符输出
								r += line[i]; break;
							}
							//一切正常输出斜体内容
							rList[lastEm] += tag.em[0];
							r += tag.em[1]; lastEm = -1;
						}else{//这是开头
							lastEm = rList.push(r) - 1;
							r = '';lastEmType = line[i];
						}
					}
					break;
				case '<'://可能是自动链接或自动邮箱或者是HTML标签或者干脆就是一个<字符
            if (line.slice(i + 1, i + 4) == '!--') { r += '<!--'; i += 3; break; }//考虑一种特殊情况,HTML注释
					isEmailOrURL = true;//表示有可能是邮箱或URL
					for (nextLoc = i + 1; nextLoc < len; nextLoc++){//找到>在哪里
						if (line[nextLoc] == '>') break;
						if (line[nextLoc] == ' ' || line[nextLoc] == '\t') isEmailOrURL = false;//出现空白字符了,不可能是邮箱或URL了
					}
					if (nextLoc >= len) { r += '&lt;'; break; }//都找不到>,那就转义输出吧
					tmpString = line.slice(i + 1, nextLoc);//选出<>内的内容
					if (isEmailOrURL) {//如果还有可能是 url 或 email
						if (tmpString.match(REGEX_URL)) {//内容是URL
							r += tagFunc.link(tmpString, '', tmpString);
							i = nextLoc; break;
						}
						if (tmpString.match(REGEX_EMAIL)) {//内容是邮箱
							r += tagFunc.email(tmpString);
							i = nextLoc;break;
						}
					}
					r+='<'//当作正常字符输出;
					break;
				case '!':
					// Maybe a starting mark of the image ![description](image-uri)
					// 可能是图片的起始标记, 检查下一个字符
					if (line[i + 1] != '[')
						r += '!'; // Just a exclamation mark (仅是一个感叹号字符)
					break;
				case '[': {
					// Maybe a starting mark of the linkable elements:  (可能是可链接的元素起始标记)
					//   ![description](image-url)
					//   [description](link-url)  [description][reference-name]
					//   [^footnote]

					// Check linkable type (判断类型)
					if (line[i - 1] == '!' && (lastMean != rList.length || lastMeanOffset != i - 1))
						linkType = 'i'; //Image (图片)
					else if (line[i + 1] == '^')
						linkType = 'f';//脚注型
					else
						linkType = 'l';//链接

					/** 是否在遍历的时候发现了内嵌图片的开始标记 */
					let hadEmbedImg = 0;
					/** 用来判断是否成功处理并输出了可链接元素 */
					let done = 0;
					let j = i + 1;

					//循环为了读取到完整的可链接元素信息
					for (; j < len; j ++ ){
						switch (line[j]) {
						//如果是图片模式内部就不能有![,如果是链接模式内部就不能有[
						case '!':
							if (line[j + 1] != '[') break;//仅仅是感叹号
							if (linkType != 'l') j = len;//图片模式和脚注模式跳过
							else hadEmbedImg = 1, j++;//标记内嵌图片,跳过[
							break;
						case '`'://跳过代码块
							tmpString = (line[j + 1] == '`') ? '``' : '`'; tmpNumber = tmpString.length;
							if ((nextLoc = line.indexOf(tmpString, j + tmpNumber)) == -1) j += tmpNumber - 1;
							else j = nextLoc + tmpNumber - 1;
							break;
						case '[': j = len; break;//可链接元素内不允许再嵌套一次链接
						case ']':
							//找到可链接元素的标题/文本部分结束符了
							//先保存标题部分
							linkContent = line.slice(i+1,j);
							if (linkType == 'f') {
								// 如果是脚注,那就直接输出了
								tmpObject = footRefManager.get(linkContent);
								if (tmpObject) {//该脚注信息是否存在
									r += tagFunc.footNoteLink(tmpObject.url, tmpObject.title, tmpObject.id);
									done = 1; i = j; j = len;
								}
								break;
							}

							/**
							 * 可链接元素的结尾符号
							 * @type {')'|']'}
							 */
							let toFind;
							tmpString = line[j + 1];
							if (tmpString == '(') {
								toFind = ')';
							} else if (tmpString == '[' || (tmpString == ' ' && line[j + 2] == '[')) {
								toFind = ']';
							} else {
								// 发现无法匹配格式 ]( 或是 ] [, 则有可能是直接一个参考式, 或者不是可链接元素
								// Eg. [github-ref-link] or [just-a-string-with-bracket]
								tmpObject = resolveReferenceLinkOrFooterNote(linkContent);
								if (tmpObject) {
									r += tagFunc.link(tmpObject.url, tmpObject.title,
										handlerInline(linkContent, 0));
									done = 1;
									i = j;
								}
								j = len;
								break;
							}
							tmpNumber = tmpString == ' ' ? j + 3 : j + 2; // 查找开始点,截取点

							if ((nextLoc = line.indexOf(toFind, tmpNumber)) != -1) {//正常收尾
								//如果之前有内嵌图片的标记头就跳过这个收尾
								if (hadEmbedImg) { hadEmbedImg = 0; break; }
								var titleableLink = line.slice(tmpNumber,nextLoc).trim();//保存链接内容:链接及链接标题部分
								if (toFind == ']') {//参考式,则解析成真实链接内容
									if (titleableLink.length == 0) titleableLink = linkContent;//如果留空,则表示参考式名称就是标题文本
									tmpObject = resolveReferenceLinkOrFooterNote(titleableLink);
									if (!tmpObject) {
										//该参考式不存在
										j = len; break;
									}
								} else {//行内式解析
									tmpObject = analyzeTitleableLink(titleableLink);
								}
								linkURL = tmpObject.url;linkTitle = tmpObject.title || '';
								if (linkType == 'i') {//输出图片
									//这里之所以将图片单独作为一个结果块,是因为这样下面可以统计是否当前行只有一个图片
									rList.push(r);
									rList.push(tagFunc.image(linkURL, linkTitle, linkContent));
									r = '';
									imgCount++;
								} else {//输出链接
									r += tagFunc.link(linkURL, linkTitle, handlerInline(linkContent, 0));
								}
								done = 1; i = nextLoc;
							}
							j=len;
							break;
						}
					}
					if (!done && j >= len) {//没有有效的尾部,当正常字符串输出
						switch(linkType){
						case 'f': r += '[^'; i++; break;
						case 'i': r += '!['; break;
						default: r += '[';
						}
					}
					break;
				}
				default://基本字符
					r+=line[i];
				}
			}
			//将最后一个子句推入
			rList.push(r);

			//如果此语句解析完后发现之前有些~_*不是表示粗体斜体或删除线的就正常输出
			if (lastDel != -1) rList[lastDel] += '~~';
			if (lastStrong != -1) rList[lastStrong] += lastStType + lastStType;
			if (lastEm != -1) rList[lastEm] += lastEmType;

			//判断是否当前行有且只有一张图片
			if (imgCount == 1) {
				//统计结果块的数量
				var _blockCount = 0;
				for (var listI in rList)
					_blockCount += rList[listI].trim() ? 1 : 0;
				if (_blockCount == 1 && moreInfo)
					moreInfo.onlyOneImg = true;
			}
			return rList.join('');
		}


		/**
		 * 生成一个脚注内容的代码
		 * @return {string} 脚注内容的HTML
		 */
		function handlerFoot(){
			var list = footRefManager.getFootNotes();
			if (list.length == 0) return '';
			var res = tag.footNote[0];
			list.forEach(item => res += tagFunc.footNote(item.url, handlerInline(item.content, 0)));
			return res + tag.footNote[1];
		}

	}/* </ClassMdjs> */

	//========================

	// Instance for static method 用于 Mdjs.md2html 静态方法的实例
	let mdjsInside = new ClassMdjs();
	ClassMdjs.md2html = (md, options) =>
		mdjsInside.md2html(md, options);
	ClassMdjs.escapedHTML = escapedHTML;
	ClassMdjs.MdjsRenderer = ClassMdjsRenderer;


	ClassMdjs.Mdjs = ClassMdjs;

	// Export class and functions to global/module
	// 导出相关的函数和类到全局/模块
	if (typeof module == 'object' && typeof global == 'object')
		module.exports = global[EXPORT_NAME] = ClassMdjs;
	if (typeof window != 'undefined')
		window[EXPORT_NAME] = ClassMdjs;
})();
