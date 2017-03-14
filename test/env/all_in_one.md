# Welcome to Mdjs

> `Mdjs` is a lightweight markdown parser written in Javascript  
> You can use it in the web frontend page and Node.js   
> Author: **LiuYue <https://github.com/hangxingliu>**

__This ia a document to test all feature and some non-regular  markdown grammars__

This is a table of contents
[TOC]

## This is a title

## And Me too ##

##Me too too(no space between pound sign and title text)

And You can mark title using divided line
===

title be marked by divided line
---

I am a divided line

---

or these: 

===
***
___

## Now turn to some paragraphs

**I am bold text**. __And me too__,
same line text. _italic text_, and *italic text too*.   
New line, There has `some code` and ``let a = `${__dirname}/src`;``  
And ~~deleted text~~

Bold code: **`Javascript`**2

## Link

This is a link to [google](https://www.google.com "Link to google")  
This is a link to <https://www.google.com>
And Mail to <test@test.test>

Don't forget me reference link to google: [Google][g] or [google][].

[g]: https://www.google.com
[google]: https://www.google.com "Link to google"

## Image

This is github logo: ![Github](https://assets-cdn.github.com/favicon.ico)  
And you can click here: [![Github](https://assets-cdn.github.com/favicon.ico)](https://github.com "Github")

This is a big image:

![octodex](https://octodex.github.com/images/original.png)

## footNote

Markdown is a lightweight markup language[^1] with plain text formatting syntax designed so that it can be converted to HTML and many other formats using a tool by the same name.[8] Markdown is often used to format readme files, for writing messages in online discussion forums, and to create rich text using a plain text editor.[^markdown_wikipedia]

[^1]: <https://en.wikipedia.org/wiki/Lightweight_markup_language>
[^markdown_wikipedia]: The description of markdown on
 [wikipedia](https://en.wikipedia.org/wiki/Markdown)


## List

- item
- item
+ item
* item
+ item
	1. item1
	2. item2
	0. item3
	- item
	+ item
- item
	+ item
		+ item
	+ item
	+ My github **[Github][MyGithub]**

-------------------

## Quote Block

> HTML(from wikipedia):   
**HyperText Markup Language** (**HTML**) is the standard [markup language](https://en.wikipedia.org/wiki/Markup_language) for creating web pages and web applications. ... 
With Cascading Style Sheets (CSS) and JavaScript it forms a triad of cornerstone technologies for the World Wide Web. ...  
> Text
>
> New Line

> New Block   
> Nested block:
> > Helloworld !  
> > **Javascript**  
> 
> return to level 1

Code Block
---

``` c
#include<stdio.h>

int main() {
	printf("HelloWorld!");
	return 0;
}
```

	//Javascript
	function main() {
		console.log('HelloWorld!');
		return 0;
	}


## Tables

|Name|Sex|Balance|
|:---|:-:|------:|
|LiuYue|Male|100.0 CNY|
|NewYear|Male|100.0 USD|
|Bill Gates|Male|1000...000.0 USD|
|XXX|Female|1024.0 CNY|

|a|b|c|
:--|--|--
1|hello|world
10|git|hub
|20|hub|hub|

## Extra Reference Link Provider

These are some wikipedia link: [Merkle–Damgård construction][wiki:Merkle–Damgård construction] and
 [wiki:Markdown][]

## Special characters

\*\*\*
\\\\\\
\`\`\`
\_\_\_
\-\-\-
...More, This is not \`code\`.

## HTML

<div style="text-align:right;color:green">green text in the right side!</div>

***

  [MyGithub]: https://github.com/hangxingliu
