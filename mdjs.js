/**
 * @name MdJs
 * @version 0.32 Dev 2016/01/01
 * @author Liuyue(Hangxingliu)
 * @description Mdjs是一个轻量级的Js的Markdown文件解析器
 */
window.Mdjs = {
	/**
	 * @description 用于判断Markdown语句的正则表达式
	 */
	'regs' : {
		'ul' : /^[\*\-\+] +\S*/g,
		'ol' : /^\d+\. +\S*/g,
		'delHTML' : /<\/?[^<>]+>/g,
	},
	/**
	 * @description 表格列的对齐样式class="md_table_xxx"
	 */
	'tbAlign':['left','mid','right'],
	 /**
	 * @description 整行样式的HTML标签
	 */
	'tag' : {
		'tBlock': ['<blockquote><p>','</p></blockquote>\n'],
		'tCode'	: ['<pre><code data-lang="$lang">','</code></pre>\n'],//lang会被替换被具体语言,若没设置具体语言则为空白字符串
		'tList'	: ['<li>','<ol>','<ul>','</li>'],
		'tP'	: ['<p>','</p>'],
		'tToc'	: ['<div class="md_toc">\n','<ol>\n',
			'<a href="#$href"><li>','</li></a>','</ol>','</div>\n'],
		'tA'	: ['<a href="mailto:','<a href="','">','</a>'],
		'tTable': ['<table class="md_table">\n<thead>\n','</thead>\n<tbody>\n','</tbody>\n</table>\n','<tr>','</tr>\n',//0,1,2,3,4
			'<th class="$align">','</th>','<td class="$align">','</td>','md_table_'],//5,6,7,8,9
	},
	/**
	 * @description 行内样式的HTML标签
	 */
	'inlineTag' : {
		'tStrong' : ['<strong>','</strong>'],
		'tEm' : ['<em>','</em>'],
		'tCode' : ['<code>','</code>'],
		'tA' : ['<a href="','">','</a>'],
		'tImg' : ['<img src="','" title="','" />'],
	},
	/**
	 * @description 可以用斜杠转义的字符(0.3加入|转义)
	 */
	'_meaning' : "#`*[]()-_{}+.!|\\",
	
	/**
	 * @description 判断一个元素是否在数组中
	 * @param {Object} e 元素
	 * @param {Object} arr 数组
	 */
	'_inArray' : function(e,arr){
		for(var i=0;i<arr.length;i++)
			if(e==arr[i])
				return true;
		return false;
	},
	
	/**
	 * @description 判断一个字符串是否有指定前缀
	 * @param {String} str 字符串
	 * @param {String} pf 前缀
	 */
	'_startWith' : function(str,pf){
		if(str.length<pf.length)return false;
		return str.slice(0,pf.length)==pf;
	},
	
	/**
	 * @description 判断一个字符串是否有指定后缀
	 * @param {String} str 字符串
	 * @param {String} sf 后缀
	 */
	'_endWith'	 : function(str,sf){
		if(str.length<sf.length)return false;
		return str.slice(-sf.length)==sf;
	},
	
	/**
	 * @description 判断一句语句是否为一条水平分割线,即三个及以上的=_-
	 * @param {String} str Markdown语句
	 */
	'_isHr' : function(str){
		var c = str[0];
		if(c!='=' && c!='-' && c!='_' && c!='*')return false;
		for(var i=0,count=0;i<str.length;i++){
			if(str[i]==' ' || str[i]=='\t')continue;
			if(str[i]!=c)
				return false;
			count++;
			//if(count==3)break; Fix Bug 如果是这样的一句:如果一句***后面还有内容就当成正常语句输出
		}
		return count>=3;
	},
	/**
	 * @description 判断此句是否为列表语句
	 * @param {String} str Markdown语句
	 * @return {Number} 0:不是列表,1:数字列表ol,2:无序列表ul
	 */
	'_isAList' : function(str){
		if(this._isHr((str)))return 0;//0.2 Dev版添加的补丁,修正Hr与列表的冲突
		if(str.search(this.regs.ol)!=-1)return 1;
		if(str.search(this.regs.ul)!=-1)return 2;
		return 0;
	},
	/**
	 * @description 获得一行语句前面的空白字符(空格,Tab)数,Tab算四个
	 * @param {String} str 语句
	 * @return {Number} 语句前的空白字符的数量
	 */
	'_leftSpace':function(str){
		var lineLeft=0;
		for(var j=0;j<str.length;j++){
			if(str[j]==' ')lineLeft++;
			else if(str[j]=='\t')lineLeft+=4;
			else break;
		}
		return lineLeft;
	},
	'_genSpace':function(len){
		if(!this.gss){
			this.gss=' ';
			for(var i=0;i<10;i++)//1024长度的空白字符串
				this.gss+=this.gss;
		}
		if(len<=0)return '';
		return this.gss.slice(0,len);
	},
	
	/**
	 * @description 对一个字符串进行HTML转义(把空格,<,>,",'转换为)
	 * @param {String} str 字符串
	 * @return {String} 转义后的HTML
	 */
	'_htmlSafer':function(str){
		var str = str.replace(/&/g, '&gt;');
		return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;').
			replace(/\'/g, '&#39;').replace(/\"/g, '&quot;').replace(/\n/g, '</br>');
	},
	
	/**
	 * @description 判断一个语句start点后面有没有完整的]()的链接或图片的语句结构
	 * @param {String} str Markdown语句
	 * @param {Number} start 某一个起点,一般为[所在位置
	 * @return {Boolean} 是否还有完整的结构
	 */
	'_isExpressAOrImg':function(str,start){
		while(true){
			var i = str.indexOf('](',start);
			if(i==-1)return false;
			//判断找到的](中的]不是被转义的字符
			if(str[i-1]=='\\' && str[i-2]!='\\'){start=i+2;continue;}//FIXME 多重转义字符
		while(true){
			i = str.indexOf(')',i+1);
			if(i==-1)return false;
			//判断找到的)不是被转义的字符
			if(str[i-1]=='\\' && str[i-2]!='\\')continue;//FIXME 多重转义字符
			return true;
		}
		}
	},
	
	/*__________栈结构(其实我现在才知道javascript数组可以push和pop的@Version 0.2 Dev Marked)______>>>>>*/
	'_inn' : [],//存放语句前的空白字符数目 {Number}
	'_inn2': [],//存放列表的类型 {Number}
	'_innLen' : 0,//栈长度
	/**
	 * @return {Number} 弹出Top元素的空白字符数目 | -1
	 */
	'_iTop' : function(){
		return this._innLen == 0?-1:this._inn[this._innLen-1];
	},
	/**
	 * @return {Number} 弹出Top元素的列表类型 | -1
	 */
	'_iTop2' : function(){
		return this._inn2[this._innLen-1];
	},
	/**
	 * @description 压"列表元素"入栈
	 * @param {Number} v 语句前的空白字符数目
	 * @param {Number} v2 列表的类型
	 */
	'_iPush': function(v,v2){
		this._inn[this._innLen] = v;
		this._inn2[this._innLen++] = v2;
	},
	/**
	 * @description 将栈的Top元素弹出
	 * @return {Boolean} 是否弹出成功
	 */
	'_iPop' : function(){
		if(this._innLen == 0)return false;
		this._innLen--;return true;
	},
	/*<<<<<__________栈结构__________*/
	
	/**
	 * @description 将一个Markdown文本解析为可显示的HTML
	 * @param {String} md Markdown文本
	 * @param {Object} options 解析选项
	 * @return {String} HTML
	 */
	'md2html' : function(md,options){
		//self = Mdjs;好吧,原谅我对Web的了解不是很深,我在0.3Dev版中才改掉
		//return Mdjs.handlerLines(md.split(/[\n]/g));//这种方法会导致不同系统的文档显示出现问题
		var lines = [];
		for(var i=0,last=0,len=md.length;i<len;i++){
			if(md[i]=='\r')lines.push(md.slice(last,i)),i+=md[i+1]=='\n'?1:0;
			else if(md[i]=='\n')lines.push(md.slice(last,i));
			else continue;
			last=i+1;
		}if(last<len)lines.push(md.slice(last));
		return Mdjs.handlerLines(lines);
	},
	
	/**
	 * description 将多个Markdown语句解析成可显示的HTML
	 * 
	 * @param {Array} mds 多行Markdown语句组成的数组
	 * @param {Boolean} inBq (可选,默认false)解析的是否为Blockquote内的内容
	 * @return {string} HTML
	 */
	'handlerLines' : function(mds,inBq){
		var res = '';
		var nowInCode = 0;//目前处理的这行是不是代码,大于等于1就是
		var lineTrim = '';//当前行去掉两端空白字符后的字符串
		var lineLeft = 0;//当前行左端的空格字符数量,//1个Tab=4个空格
		
		var tbRet = [];//存放表格行解析出来的列数组
		var tbFmt = [];//存放表格每列的对齐格式
		
		var tocPos = -1;//哪儿要输出目录结构
		var tocTitle = [];//记录目录每个节点的标题
		var tocLevel = [];//记录目录每个节点的层次
		var tocLen = 0;//记录目录一共有多少个节点
		
		var lastEmptyL = -2;//上一个空白行是第几行,为了防止重复多行换行
		
		var tmpStr = '';
		for(var i=0;i<mds.length;i++){
			lineTrim = mds[i].trim();
			
			//目前正在处理代码,或者代码结尾
			if(nowInCode>0){
				if(lineTrim=='```'){//代码结束了
					nowInCode=0;
					res+=this.tag.tCode[1];
					continue;
				}
				res+=(nowInCode==1?'':'\n')+this._htmlSafer(mds[i]);nowInCode++;
				continue;
			}
			
			//计算行前空格数
			lineLeft = this._leftSpace(mds[i]);
			
			//列表行
			var l = this._isAList(lineTrim);
			if(l!=0){
				res += this.handlerList(lineLeft,l,lineTrim);
				continue;
			}
			res+= this.handlerListEnd();
			
			//空白行
			if(lineTrim.length==0){
				if(lastEmptyL!=i-1)//上一行没有输出过换行
					res+='<br />\n';
				lastEmptyL = i;
				continue;
			}

			//没有Tab键在行前
			if(lineLeft < 4){
				if(lineTrim.slice(0,3)=='```'){//进入代码块
					lang = lineTrim.slice(3).trim();
					res+=this.tag.tCode[0].replace('$lang',lang);
					nowInCode = 1;continue;
				}
				
				//是标题吗?多少个标题
				for(var j=0;j<lineTrim.length;j++)
					if(lineTrim[j]!='#')
						break;
				//是标题
				if(j!=0){
					var cutEnd = lineTrim.indexOf('#',j);
					var titleText = cutEnd==-1?lineTrim.slice(j):lineTrim.slice(j,cutEnd);
					//tocMark给当前标题标记的ID和name,为了能让TOC目录点击跳转
					var tocMark = titleText = this.handlerInline(titleText,0);
					tocLevel[tocLen]  = j;
					tocTitle[tocLen++]= tocMark = tocMark.trim().replace(this.regs.delHTML,'');
					res+='<h'+j+' id="'+tocMark+'" name="'+tocMark+'">'+titleText+'</h'+j+'>\n';
					continue;
				}
				
				//是区块引用>
				if(lineTrim[0]=='>' && lineTrim.length>1){
					var bq = [];//存放需要区块引用的行
					bq.push(lineTrim.slice(1));
					for(var k=i+1;k<mds.length;k++){
						tmpStr = mds[k].trim();
						if(tmpStr.length==0)break;//不是区块引用的内容了
						if(tmpStr[0]=='>')tmpStr=tmpStr.slice(1);
						else if(inBq)break;//如果是区块引用嵌入区块引用,并且没有>符号就返回上一层区块引用
						//如果不按上面那行做,会导致区块引用嵌套时结尾一定会有一行无法去掉的空白
						bq.push(tmpStr);
					}
					res+=this.tag.tBlock[0]+this.handlerLines(bq,true)+this.tag.tBlock[1];
					i = k - 1;
					continue;
				}
				//横线
				if(this._isHr(lineTrim)){res+='<hr />';continue;}
				
				//目录
				if(lineTrim == '[TOC]'){
					tocPos = res.length;
					continue;
				}
				
				//表格
				if((tbRet = this.handlerTbLine(lineTrim)) != false){//可能是表格
					//两行表格语句确定表格结构
					if(i<mds.length-1 && (tbFmt = this.handlerTbFmt(mds[i+1].trim(),tbRet.length) )!=false){
						//表格头部
						res+=this.tag.tTable[0]+this.tag.tTable[3]+this.genTbTr(tbRet,tbFmt,true)+this.tag.tTable[4];
						res+=this.tag.tTable[1];//表格主体开始
						for(var j=i+2;j<mds.length;j++){
							if((tbRet = this.handlerTbLine(mds[j].trim())) == false)break;//不是表格语句了
							res+=this.tag.tTable[3]+this.genTbTr(tbRet,tbFmt,false)+this.tag.tTable[4];
						}
						i=j-1;res+=this.tag.tTable[2];
						continue;
					}
				}
				
			}else{
				//虽然空格数大于了4,但是还是有可能:
				//代码块(需要检查上一行),普通文本
				//代码块
				if(i==0 || mds[i-1].trim().length == 0){
					res += this.tag.tCode[0].replace('$lang','');
					var space = '',endL = i;//space是为了中间的空白行,endl是为了保存代码最后有效行在哪
					for(var j=i,ltab;j<mds.length;j++){
						if(mds[j].trim().length==0){space+='\n';continue;}//空白行,记入space,这样做是为了如果代码块最后有空行而不输出
						if((ltab = this._leftSpace(mds[j]))<4)break;//空白小于一个Tab键了,退出代码块
						res += space + (j==i?'':'\n') + this._genSpace(ltab-2) +//去掉开头多余的空白字符
							this._htmlSafer(mds[j].trim());
						space='',endL = j;//重置空白行和记录最后有效行
					}
					res += this.tag.tCode[1];
					i=endL;
					continue;
				}
			}
			
			//普通文本正常的一行
			//真的是上面注释的那样吗?其实如果它的下一行是---或===的话,那这一行就是标题行了
			if(i+1<mds.length){
				tmpStr = mds[i+1].trim();
				if(this._isHr(tmpStr)){//真的也,这行是标题
					var level = 3;//默认三级
					if(tmpStr[0]=='=')level=1;else if(tmpStr[0]=='-')level=2;
					var tocMark = titleText = this.handlerInline(lineTrim,0);
					tocLevel[tocLen]  = level;
					tocTitle[tocLen++]= tocMark = tocMark.trim().replace(this.regs.delHTML,'');
					res+='<h'+level+' id="'+tocMark+'" name="'+tocMark+'">'+titleText+'</h'+level+'>\n';
					i++;//跳行
					continue;
				}
			}
			
			//这下真的是普通的一行了
			tmpStr = this.handlerInline(lineTrim,0).trim();
			var kw = this.inlineTag.tImg;//kw是Img标签的数组
			//判断当行是否只有一个图片标签,如果是,优化输出,不带<p></p>
			if(this._startWith(tmpStr,kw[0]) && this._endWith(tmpStr,kw[2])
				&& tmpStr.indexOf(kw[0],1)==-1)res+=tmpStr;
			else res += this.tag.tP[0] + tmpStr + this.tag.tP[1];
			//循环,一行结束
		}
		//如果需要输出目录
		if(tocPos!=-1){
			var res1 = res.slice(0,tocPos);
			res = res.slice(tocPos);
			res = res1 + this.handlerTOC(tocTitle,tocLevel,tocLen) + res;
		}
		return res;
	},
	
	/**
	 * 生成一个TOC目录的代码
	 * @param {String} tocTitle 目录节点的标题
	 * @param {String} tocLevel 目录节点的层次
	 * @param {Number} tocLen 目录节点集合的长度
	 * @return {String} TOC目录的HTML代码
	 */
	'handlerTOC' : function(tocTitle,tocLevel,tocLen){
		var res = this.tag.tToc[0];
		var tocI = [];
		var tocILen = 0;
		var liHTML;
		for(var i=0;i<tocLen;i++){
			liHTML = this.tag.tToc[2].replace('$href',tocTitle[i]) +tocTitle[i]+this.tag.tToc[3];
			if(tocILen == 0 || tocLevel[i]>tocI[tocILen-1]){
				res += this.tag.tToc[1]+liHTML;tocI[tocILen++] = tocLevel[i];
			}else if(tocLevel[i]==tocI[tocILen-1]){
				res += liHTML;
			}else{
				res += this.tag.tToc[4];tocILen--;i--;
			}
		}
		while((tocILen--)>0)res += this.tag.tToc[4];
		return res+this.tag.tToc[5];
	},
	
	/**
	 * @description 在处理多个Markdown语句时检测之前是不是还有列表没有结尾
	 * @returns {String} ,如果还有列表没有结尾,则返回列表结尾;反之,返回空白字符串
	 */
	'handlerListEnd' : function(){
		var res = '';
		while(this._iTop()!=-1){
			if(this._iTop2()==1)//数字列表
				res+='</ol>\n';
			else//无序列表
				res+='</ul>\n';
			this._iPop();
		}
		return res;
	},
	
	/**
	 * @description 处理一行Markdown列表语句
	 * @param {Object} level 列表语句前面有多少个空格/列表的层次
	 * @param {Number} type 哪一种列表(1:数字列表,2:无序列表)
	 * @param {Object} str Markdown语句
	 * @return {String} 此句Markdown的HTML
	 */
	'handlerList' : function(level,type,str){
		var topLevel = this._iTop();//上一个列表的层次
		var liHTML = this.tag.tList[0] + this.handlerInline(str,str.indexOf(' '),0) + this.tag.tList[3];
		var res = '';
		if(level > topLevel){//上一个列表的___子列表___
			this._iPush(level,type);
			return this.tag.tList[type] + liHTML;
		}else if(level == topLevel){//上一个列表的___兄弟(并列)列表___
			return liHTML;
		}else{//上一个列表的___父列表___的___兄弟列表___
			while(level<topLevel){//找到属于这个列表的兄弟列表
				if(this._iTop2()==1)//数字列表
					res+='</ol>\n';
				else//无序列表
					res+='</ul>\n';
				this._iPop();
				topLevel = this._iTop();
			}
			if(topLevel==-1){//这个列表是最顶层的列表,即暂时没有兄弟列表,是一个新的列表集的开始
				this._iPush(level,type);
				return res + this.tag.tList[type] + liHTML;
			}else{
				return res + liHTML;
			}
		}
	},
	
	/**
	 * 通过给定的表格列数组和表格格式生成一个tr的HTML语句
	 * @param {Array} tbRet 表格列数组
	 * @param {Array} tbFmt 表格对齐格式数组
	 * @param {Boolean} isHead 是否为头部(thead)的tr
	 * @return {String} 一个tr的HTML语句
	 */
	'genTbTr':function(tbRet,tbFmt,isHead){
		var res ='';
		for(var k=0;k<tbRet.length;k++)
			res+=this.tag.tTable[isHead?5:7].replace('$align',this.tag.tTable[9]+this.tbAlign[tbFmt[k]])//替换对齐样式
				+this.handlerInline(tbRet[k],0)//表格内容
				+this.tag.tTable[isHead?6:8];
		return res;
	},
	
	/**
	 * @description 解析表格格式行,即为表格第二行,格式说明(0:左对齐,1:居中,2:右对齐)
	 * @param {String} tStr trim()过的语句字符串
	 * @param {Number} col 表格头部标明了有多少列,如果实际解析出来的没有这么多列,则用0(左对齐)补齐剩下的列
	 * @return {Array|Boolean} 如果此语句是表格格式行则返回解析出来的格式,否则返回false
	 */
	'handlerTbFmt':function(tStr,col){
		var r = this.handlerTbLine(tStr,true);//初步解析表格语句
		var ret = [];//返回结果
		var i = 0,tmp = 0;//i:循环变量,tmp:临时变量
		if(r==false)return false;//不是格式行
		for(var len=r.length;i<len;i++,tmp=0){
			if(r[i].length<=1){ret[i] = 0;continue;}//如果格式描述字符串长度为1,则左对齐
			if(r[i][r[i].length-1]==':')tmp = (r[i][0]==':')?1:2;//右边有:,右对齐,左边又有:,居中
			ret[i] = tmp;//存入返回结果
		}
		for(;i<col;i++)ret[i]=0;//补齐剩下的列
		return ret;
	},
	/**
	 * @description 解析表格中的行,将一行表格语句分解成一列一列的数组
	 * @param {String} tStr trim()过的语句字符串
	 * @param {Boolean} isFmtL 此行是否应该为格式行,默认false
	 * @return {Array|Boolean} 如果此语句是表格中的行则返回解析出来的每一列组成的数组,
	 * 否则返回false(如果指定为格式行,则若不满足格式行的要求,也会返回false)
	 */
	'handlerTbLine':function(tStr,isFmtL){
		var ret = [];//返回结果
		var len = tStr.length;//语句长度
		var tmpStr = '';//解析时临时存储用的字符串,此处临时存当前列的数据
		if(isFmtL==undefined)isFmtL = false;//默认不是格式行
		for(var i=(tStr[0]=='|'?1:0);i<len;i++){//抛弃首个|
			switch(tStr[i]){
			case '\\'://转义字符
				if(isFmtL)return false;//格式行不应该有这个字符
				tmpStr+='\\';
				if(tStr[i+1]=='|')tmpStr+='|',i++;//转义的|,应该被输出
				continue;
			case '|'://分隔符
				tmpStr = tmpStr.trim();
				if(isFmtL && tmpStr.length==0)return false;//格式行不允许列格式字符串为空
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
	},
	/**
	 * @description 处理一行Markdown语句(已经去掉了头部的修饰的语句,例如去掉了标题#符号,引用>符号等等...)
	 * @param {String} text 去掉了头部的Markdown语句
	 * @param {Number} start 这个Markdown语句的起始点
	 */
	'handlerInline' : function(text,start){
		var	t = text+'\\';//在最后加上一个字符,防止越界
		var len = t.length - 1;
		var res = '';//结果
		
		//1:表示一个样式已经开始,如果再到这个样式则结束样式
		var strongStart = 0;
		var emStart = 0;
		var codeStart = 0;
		//表示粗体或斜体的样式开始的时候用的符号:*或_
		var lastStrongMark = '*';
		var lastEmMark = '*';
		//表示前面有"[","]"可以匹配"(",")"
		var aOrImgStart = false;
		
		var aOrImg = 'a';//[]()表示链接还是图片
		var isAImgTitle = false;//读取的时候读到的是链接或图片的标题吗?
		var aImgTitle = '';//链接或图片的标题
		var tmpChar = '';
		var tmpInt = 0;
		var tmpBool = true;
		
		for(var i=(start<0?0:start);i<len;i++){
			switch(t[i]){
			case '\\'://转义字符
				if(this._inArray(t[i+1],this._meaning))tmpChar=t[++i];
				else tmpChar=t[i];
				if(isAImgTitle)aImgTitle+=tmpChar;
				else res+=tmpChar;
				break;
			case '`'://行内代码
				res+=this.inlineTag.tCode[codeStart];
				codeStart=1^codeStart;
				break;
			case '*':
			case '_'://粗体斜体
				if(aOrImgStart)//如果是图片/链接的URL中有*_符号
					res+=t[i];
				else if(t[i+1]==t[i]){//粗体
					if(strongStart==0)lastStrongMark = t[i];
					else if(t[i]!=lastStrongMark){//表示正常的两个字符
						if(isAImgTitle)aImgTitle+=t[i]+t[i];
						else res+=t[i]+t[i];
						i++;break;
					}
					res+=this.inlineTag.tStrong[strongStart];
					strongStart=1^strongStart;
					i++;
				}else{//斜体
					if(emStart==0)lastEmMark = t[i];
					else if(t[i]!=lastEmMark){//表示正常的两个字符
						if(isAImgTitle)aImgTitle+=t[i];
						else res+=t[i];
						break;
					}
					res+=this.inlineTag.tEm[emStart];
					emStart=1^emStart;
				}
				break;
			case '!'://图片
				if(isAImgTitle){//这个叹号出现在 图片或链接的标题(中括号)内
					if(t[i+1]!='['){aImgTitle+='!';break;}//只是想表达一个叹号
					//链接标题要显示图片,即链接内嵌图片
					var valid=false;//用于验证图片个结构是否合法,true:表示已经有](结构了,
					for(var j=i+2;j<len;j++){//为了找到内嵌图片的结尾)
						if(t[j]=='\\')j++;//转义字符
						else if(t[j]==']'){
							if(t[j+1]=='(')valid=true,j++;//当作内嵌图片结构合法
							else{j=len;break;}//不是内嵌图片
						}else if(t[j]==')' && valid)break;//结构结尾
					}
					//输出图片HTML,其实这步就是递归handlerInLine处理一个图片结构标记
					if(j<len)aImgTitle+=this.handlerInline(t.slice(i,j+1),0),i=j;
					else aImgTitle+='!';
				}else if(t[i+1]=='[')aOrImg = 'i';//图片(非链接内嵌图片)标记开始了
				else res+='!';
				break;
			case '['://要读取标题了
				tmpBool = this._isExpressAOrImg(t,i);
				//if(tmpBool)console.log(aImgTitle);
				if(!tmpBool || aOrImgStart){//如果这个[后面的结构_不_完整或者已经开始了一个[]()结构
					tmpChar = '[';
					if(t[i-1]=='!'){//误判了上一个叹号为图片修饰符,恢复
						tmpChar='![';aOrImg='';
					}
					if(isAImgTitle)aImgTitle+=tmpChar;//只是想表达一个中括号
					else res+=tmpChar;
				}else{aOrImgStart = true;isAImgTitle = true;aImgTitle = '';}
				break;
			case ']'://标题读取完成
				if(aOrImgStart)isAImgTitle = false;
				else{
					if(isAImgTitle)aImgTitle+=']';//只是想表达一个中括号
					else res+=']';
				}
				break;
			case '('://读取链接部分,这时候要把链接或图片的前缀输出了
				if(!aOrImgStart){res+='(';break;}//只是想表达一个括号
				else if(isAImgTitle){aImgTitle+='(';break;}//在标题里表达一个括号
				if(aOrImg=='i')res+=this.inlineTag.tImg[0];
				else res+=this.inlineTag.tA[0];
				break;
			case ')'://读取链接部分完成
				if(!aOrImgStart){res+=')';break;}//只是想表达一个括号
				else if(isAImgTitle){aImgTitle+=')';break;}//在标题里表达一个括号
				if(aOrImg=='i')res+=this.inlineTag.tImg[1];
				else res+=this.inlineTag.tA[1];
				//输出标题(图片展位字符串)
				if(aOrImg=='i'){//图片
					res+=this._htmlSafer(aImgTitle)+this.inlineTag.tImg[2];
				}else{//链接
					res+=aImgTitle+this.inlineTag.tA[2];
				}
				aOrImg = '';//恢复图片或链接
				aOrImgStart = false;
				break;
			case '<'://可能是自动链接或自动邮箱
				if(!isAImgTitle){//不是标题才有可能
				tmpInt = t.indexOf('>',i);
				if(tmpInt!=-1){
					tmpChar = t.slice(i+1,tmpInt);
					if(tmpChar.search(/$\/?[\w ]*^/g)==-1){//第一次筛选,筛掉全部是字母或空格的HTML标签
					if(tmpChar.search(/^\w+:\/\/\S*/g)==0){//第二次选出URL
						res+=this.tag.tA[1]+tmpChar+this.tag.tA[2]+tmpChar+this.tag.tA[3];
						i = tmpInt;break;
					}if(tmpChar.search(/^\S+@\S+\.\w+$/g)==0){//第二次选出邮箱
						res+=this.tag.tA[0]+tmpChar+this.tag.tA[2]+tmpChar+this.tag.tA[3];
						i = tmpInt;break;
					}
					}
				}else{//干脆连>收尾都找不到了,那就转义一下<并输出
					if(isAImgTitle)aImgTitle+=t[i];
					else res+= '&lt;';
					break;
				}
				}
			default://基本字符
				if(isAImgTitle)aImgTitle+=t[i];
				else res+=t[i];
			}
		}
		//如果此句结束了粗体,斜体,行内代码还没有正常结束的话就自动补充
		if(codeStart==1)res+=this.inlineTag.tCode[1];
		if(emStart==1)res+=this.inlineTag.tEm[1];
		if(strongStart==1)res+=this.inlineTag.tStrong[1];
		return res;
	},
	
};
