/**
 * @name MdJs
 * @version 0.4 Dev 2016/01/10
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
		'url' : /^\w+:\/{2,3}\S+$/g,
		'email' : /^[\w-]+@[\w-]+\.[\w\.-]+$/g
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
		'tList'	: ['<li>','<ol>','<ul>','</li>\n','</ol>\n','</ul>\n'],
		'tP'	: ['<p>','</p>'],
		'tToc'	: ['<div class="md_toc">\n','<ol>\n',
			'<a href="#$href"><li>','</li></a>','</ol>','</div>\n'],
		'tFoot' : ['<div class="md_foot">\n<ol>\n',
			'<li name="%s" id="%s" >','</li>','</ol></div>\n'],
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
		'tSupStr' : '<sup><a title="%s" href="%s">%s</a></sup>',
		'tAStr' : '<a title="%s" href="%s">%s</a>',
		'tImgStr' : '<img alt="%s" title="%s" src="%s" />',
	},
	/**
	 * @description 初始化行内样式标签数组,在每次调用md2html都会被调用
	 */
	'initILT' : function(){
		var ilt = Mdjs.inlineTag;
		ilt.tSup = ilt.tSupStr.split('%s');
		ilt.tA = ilt.tAStr.split('%s');
		ilt.tImg = ilt.tImgStr.split('%s');
	},
	/**
	 * @description 可以用斜杠转义的字符(0.3加入|转义)
	 */
	'_meaning' : "#`*[]()-_{}+.!|\\",
	
	/**
	 * @description 判断一个元素是否在数组中
	 * @param {Object} e 元素
	 * @param {Object} arr 数组
	 * @return {1|0}
	 */
	'_inArray' : function(e,arr){
		for(var i=0;i<arr.length;i++)
			if(e==arr[i])
				return 1;
		return 0;
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
	/**
	 * @description 生成指定长度的空格内容字符串
	 * @param {Number} len 指定长度,最长1024
	 */
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
	 * @description 从一个链接内容中提取出链接地址,链接标题
	 * @param {String} hrefInfo 链接内容,例如: http://xxx.xx "Title"
	 * @return {Object} 包含url属性和title属性的对象
	 */
	'_matchHref':function(hrefInfo){
		var ret = {};
		//hadURL表示是否已经解析出一个链接地址了
		for(var i=0,hadURL = 0;i<hrefInfo.length;i++){
			if(!hadURL){
				if(hrefInfo[i]==' ' || hrefInfo[i]=='\t')
					ret.url = hrefInfo.slice(0,i),hadURL=1;
			}else if(hrefInfo[i]=='\'' || hrefInfo[i]=='"' || hrefInfo[i]=='('){
				ret.title = hrefInfo.slice(i+1,-1);break;
			}
		}
		if(!ret.url)ret.url=hrefInfo;
		if(!ret.title)ret.title='';
		return ret;
	},
	
	/**
	 * @description 判断一个Markdown语句中是否为参考式定义语句,如果是则保存参考式内容到参考式数组
	 * @param {String} t Markdown语句
	 * @return {0|1} 此语句是否为参考式的定义语句,0:false,1:true
	 */
	'_matchRefer':function(t){
		t=t.trim();
		var i,k,v;
		if(t[0]!='[')return 0;//必须以[打头
		if((i=t.indexOf(']:',1))==-1)return 0;//必须有[xxx]:的结构
		if(t[i+2]!=' '&&t[i+2]!='\t')return 0;//必须在上述结构后有至少一个空白字符
		k=t.slice(1,i);//提取参考式名字
		if(k[0]=='^'){//脚注
			v = {id:this.sup_record(k),
				 title:k.slice(1),
				 content:t.slice(i+3)};
			v.url = '#md_f_'+v.id;
		}else{//链接参考式
			v=this._matchHref(t.slice(i+3).trim());
		}
		this.refer_set(k,v);
		return 1;
	},
	
	/*__________栈结构______>>>>>*/
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
	
	/*__________参考式,脚注类>>>>>>>>>*/
	'refer_init': function(){this.rfMan = {};this.rfSup = [];},
	//正常content为{url:xxx,title:xxx}
	//脚注content为{url:xxx,title:xxx,id:xxx}
	'refer_set': function(name,content){this.rfMan[name.toLowerCase()]=content;},
	'refer_get': function(name){return this.rfMan[name.toLowerCase()];},
	'sup_record': function(name){return this.rfSup.push(name);},
	/*<<<<<<<<<<参考式,脚注类________*/
	
	/**
	 * @description 将一个Markdown文本解析为可显示的HTML
	 * @param {String} md Markdown文本
	 * @param {Object} options 解析选项
	 * @return {String} HTML
	 */
	'md2html' : function(md,options){
		//return Mdjs.handlerLines(md.split(/[\n]/g));//这种方法会导致不同系统的文档显示出现问题
		try{//FIXME 这个是dev版的错误采集机制
		
		//初始化行内标签
		Mdjs.initILT();
		
		//初始化参考式管理器
		Mdjs.refer_init();
		var lines = [];
		var line=null;
		for(var i=0,last=0,len=md.length;i<len;i++,line=null){
			if(md[i]=='\r')line = md.slice(last,i),i+=md[i+1]=='\n'?1:0;
			else if(md[i]=='\n')line = md.slice(last,i);
			//判断一下是否为参考式
			if(line!=null){
				if(!Mdjs._matchRefer(line))lines.push(line);
				last=i+1;
			}
		}
		if(last<len){
			line = md.slice(last);
			if(!Mdjs._matchRefer(line))
				lines.push(line);
		}
		return Mdjs.handlerLines(lines)+Mdjs.handlerFoot();//内容最后如果有脚注就输出脚注内容
		
		}catch(e){
			Toast.err(
				'Mdjs运行时错误:<br/><strong>'+e+'</strong><br />欢迎来此报告错误:<br />(下面两个链接任意一个均可)<br />'
				+'<a target="_blank" href="http://git.oschina.net/voyageliu/mdjs/issues">Git@OSC</a>'
				+'<br />'
				+'<a target="_blank" href="http://git.oschina.net/voyageliu/mdjs/issues">Github</a>'
				);
		}
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
					var cutEnd = lineTrim.length-1;//标题内容的结尾位置
					for(;cutEnd>j;cutEnd--)
						if(lineTrim[cutEnd]!='#')//为了去掉结尾的#号
							break;
					var titleText = lineTrim.slice(j,cutEnd+1);
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
			//判断当行是否只有一个图片标签,如果是,优化输出,不带<p></p>
			if(this._startWith(tmpStr,'<img ') && this._endWith(tmpStr,'/>')
				&& tmpStr.indexOf('<img ',1)==-1)res+=tmpStr;
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
	 * 生成一个脚注内容的代码
	 * @return {String} 脚注内容的HTML
	 */
	'handlerFoot' : function(){
		if(this.rfSup.length==0)return '';
		var tF = this.tag.tFoot;
		var res = tF[0];
		for(var i=0;i<this.rfSup.length;i++){
			var item = this.refer_get(this.rfSup[i]);
			res+=tF[1].replace(/%s/g,item.url.slice(1))+this.handlerInline(item.content,0)+tF[2];
		}
		return res+tF[3];
	},
	
	/**
	 * 生成一个TOC目录的代码
	 * @param {Array} tocTitle 目录节点的标题
	 * @param {Array} tocLevel 目录节点的层次
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
				res+=this.tag.tList[4];
			else//无序列表
				res+=this.tag.tList[5];
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
					res+=this.tag.tList[4];
				else//无序列表
					res+=this.tag.tList[5];
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
	 * @param {String} t 去掉了头部的Markdown语句
	 * @param {Number} start 这个Markdown语句的起始点,默认为0
	 */
	'handlerInline' : function(t,start){
		/*
		 * 结果=结果集合并
		 * 利用结果集可以方便的在子结果尾部插入<strong><em><del>标签
		 */
		
		var len = t.length;//text的长度
		var rList = [];//返回结果集
		var r = '';//返回结果中最新的一条子结果
		
		//上一次转义了的字符所在结果集中的哪一行(或者说当时结果集有多少行了),和那行的偏移量
		var lastMean = -1,lastMeanOffset = -1;
		
		//上一次出现<strong><i><del>分别是在哪个结果集的末尾
		var lastStrong = -1;
		var lastEm = -1;
		var lastDel = -1;
		//上一次出现<strong><i>的类型是*还是_
		var lastStType = '*';
		var lastEmType = '*';
		
		var nextLoc;//下一次的位置
		var linkType;//可链接元素的类型:'s':Sup;'i':Image;'':Link
		var linkTitle,linkContent,linkURL,linkMore;//linkContent : linkURL "linkMore"
		
		var tS,tI,tO,tB;//临时变量
		
		var ilt = this.inlineTag;//InlineTag的缩写变量
		
		//遍历语句
		for(var i=(!start?0:start);i<len;i++){
			
			switch(t[i]){
			case '\\'://转义字符\打头
				//如果\后面的字符是可转义字符才转义
				if(this._inArray(t[i+1],this._meaning))
					lastMean=rList.length,lastMeanOffset=++i;//++i为了移动到下一位
				r+=t[i];
				break;
			case '`'://行内代码
				tS=(t[i+1]=='`')?'``':'`';tI=tS.length;//tS记录行内代码包裹的标记,tI记录前者长度
				if((nextLoc = t.indexOf(tS,i+tI))==-1)r+=tS;//如果往后找找不到可匹配的结束行内代码的标记,就正常输出
				else{//找到了,输出行内代码
					r+=ilt.tCode[0]+this._htmlSafer(t.slice(i+tI,nextLoc))+ilt.tCode[1];
					i=nextLoc;
				}
				i+=tI-1;//移动遍历光标
				break;
			case '~'://删除线
				if(t[i+1]=='~'){//两个~才表示删除线
					if(lastDel>=0){//前面出现过一次~~了,这个是收尾
						if(r==''){//表示新的子结果集才开始,~~包裹的内容为空,~~~~的情况,保留前面的两个~~
							rList[lastDel]+='~~';
						}else{//正常情况,输出删除线的文本
							rList[lastDel]+='<del>';r+='</del>';lastDel = -1;
						}
					}else{//这是第一次出现~~标记,是个打头,记录一下并开启一个新的子结果集
						lastDel = rList.push(r) - 1;r = '';
					}
					i++;
				}else r+='~';//只是一个普通的波浪线
				break;
			case '*':
			case '_'://粗体斜体
				//Markdown规范,*或_两边空格,则当作正常字符输出
				if((t[i+1]==' ' || t[i+1]=='\t') && (t[i-1]==' ' || t[i-1]=='\t')){
					r+=t[i];break;
				}
				//两个*或_在一起,表示粗体
				if(t[i+1]==t[i]){
					if(lastStrong>=0){//这个是收尾
						if(lastStType != t[i]){//上次开头的标记字符与本次的不一样,当作正常字符输出
							r+=t[i++]+t[i];break;	
						}
						//一切正常输出加粗内容
						rList[lastStrong]+=ilt.tStrong[0];
						r+=ilt.tStrong[1];lastStrong = -1;
					}else{//这是开头
						if(t[i+2]==t[i] && t[i+3]==t[i]){//四个连续的*或_,那就不解析前面两个,否则无法出现只想单纯表达四个*的效果
							r+=t[i++]+t[i++];
						}
						lastStrong = rList.push(r) - 1;
						r = '';lastStType = t[i];
					}
					i++;
				}else{//斜体
					if(lastEm>=0){//这个是收尾
						if(lastEmType != t[i]){//上次开头的字符与本次的不一样,当作正常字符输出
							r+=t[i];break;	
						}
						//一切正常输出斜体内容
						rList[lastEm]+=ilt.tEm[0];
						r+=ilt.tEm[1];lastEm = -1;
					}else{//这是开头
						lastEm = rList.push(r) - 1;
						r = '';lastEmType = t[i];
					}
				}
				break;
			case '>'://有可能是HTML注释结尾
				if(i>=2 && t.slice(i-2,i)=='--')r+='-->';//HTML注释结尾
				else r+='>';//否则当成>字符输出
				break;
			case '<'://可能是自动链接或自动邮箱或者是HTML标签或者干脆就是一个<字符
				if(t.slice(i+1,i+4)=='!--'){r+='<!--';break;}//考虑一种特殊情况,HTML注释
				
				tB = 1;//表示有可能是邮箱或URL
				for(nextLoc=i+1;nextLoc<len;nextLoc++){//找到>在哪里
					if(t[nextLoc]=='>')break;
					if(t[nextLoc]==' '||t[nextLoc]=='\t')tB=0;//出现空白字符了,不可能是邮箱或URL了
				}
				if(nextLoc >= len){r+='&lt;';break;}//都找不到>,那就转义输出吧
				
				tS = t.slice(i+1,nextLoc);//选出<>内的内容
				if(tB){//如果还有可能是url或email
					if(this.regs.url.test(tS)){//内容是URL
						r+=this.tag.tA[1]+tS+this.tag.tA[2]+tS+this.tag.tA[3];
						i = nextLoc;break;
					}
					if(this.regs.email.test(tS)){//内容是邮箱
						r+=this.tag.tA[0]+tS+this.tag.tA[2]+tS+this.tag.tA[3];
						i = nextLoc;break;
					}
				}
				r+='<'//当作正常字符输出;
				break;
			case '!'://如果不是初判图片才输出
				if(t[i+1]!='[')r+='!';break;
			case '['://进入了可链接(Linkable)元素区块
				//判断类型
				if(t[i-1]=='!' && (lastMean!=rList.length || lastMeanOffset!=i-1))linkType='i';//图片
				else if(t[i+1]=='^')linkType='s';//脚注型
				else linkType='';//链接
				var hadEmbedImg = 0;//是否在遍历的时候发现了内嵌图片的开始标记
				//循环为了读取到完整的可链接元素信息
				//done用于判断是否获得完整信息后才结束(即是否成功输出了可链接元素)
				for(var j=i+1,done=0;j<len;j++){switch(t[j]){
					//如果是图片模式内部就不能有![,如果是链接模式内部就不能有[
					case '!':
						if(t[j+1]!='[')break;//仅仅是感叹号
						if(linkType!='')j=len;//图片模式和脚注模式跳过
						else hadEmbedImg=1,j++;//标记内嵌图片,跳过[
						break;
					case '`'://跳过代码块
						tS=(t[j+1]=='`')?'``':'`';tI=tS.length;
						if((nextLoc = t.indexOf(tS,j+tI)) == -1)j+=tI-1;
						else j=nextLoc+tI-1;
						break;
					case '[':j=len;break;//可链接元素内不允许再嵌套一次链接
					case ']'://找到可链接元素的标题/文本部分结束符了
						//先保存标题部分
						linkTitle = t.slice(i+1,j);
						if(linkType=='s'){//如果是脚注,那就直接输出了
							tO = this.refer_get(linkTitle);
							if(tO)//该脚注信息是否存在
								r+=ilt.tSup[0]+ tO.title +ilt.tSup[1]+ tO.url +ilt.tSup[2]+ tO.id +ilt.tSup[3]
									,done=1,i=j,j=len;
							break;
						}
						tS=t[j+1];
						var toFind;//可链接元素的结尾符号
						if(tS=='(')toFind=')';
						else if(tS=='[' || (tS==' '&&t[j+2]=='['))toFind=']';
						else {j=len;break;}//发现无法匹配格式](或] [,不是可链接元素
						tI = tS==' '?j+3:j+2;//查找开始点,截取点
						if((nextLoc = t.indexOf(toFind,tI)) != -1){//正常收尾
							//如果之前有内嵌图片的标记头就跳过这个收尾
							if(hadEmbedImg){hadEmbedImg=0;break;}
							linkContent = t.slice(tI,nextLoc).trim();//保存链接内容:链接及链接标题部分
							if(toFind==']'){//参考式,则解析成真实链接内容
								if(linkContent.length==0)linkContent=linkTitle;//如果留空,则表示参考式名称就是标题文本
								tO =  this.refer_get(linkContent);
								if(!tO){j=len;break;}//该参考式不存在
							}else{//行内式解析
								tO = this._matchHref(linkContent);
							}
							linkURL = tO.url;linkMore = tO.title;
							if(linkType=='i')//输出图片
								r+=ilt.tImg[0]+this._htmlSafer(linkTitle)+ilt.tImg[1]
									+this._htmlSafer(linkMore)+ilt.tImg[2]+ encodeURI(linkURL)+ilt.tImg[3];
							else//输出链接
								r+=ilt.tA[0]+this._htmlSafer(linkMore)+ilt.tA[1]
									+encodeURI(linkURL)+ilt.tA[2]+this.handlerInline(linkTitle,0)+ilt.tA[3];
							done=1;i=nextLoc;
						}
						j=len;
						break;
				}}
				if(!done && j>=len){//没有有效的尾部,当正常字符串输出
					switch(linkType){
					case 's':r+='[^';i++;break;
					case 'i':r+='![';break;
					default :r+='[';
					}
				}
				break;
			default://基本字符
				r+=t[i];
			}
		}
		//将最后一个子句推入
		rList.push(r);
		
		//如果此语句解析完后发现之前有些~_*不是表示粗体斜体或删除线的就正常输出
		if(lastDel!=-1)rList[lastDel]+='~~';
		if(lastStrong!=-1)rList[lastStrong]+=lastStType+lastStType;
		if(lastEm!=-1)rList[lastEm]+=lastEmType;
		
		return rList.join('');
	},
	
};
