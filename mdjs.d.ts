
/// <reference types="node" />
/// <reference path="./types.d.ts" />

export class Mdjs extends MdjsClass { };

export var md2html: Mdjs_md2html;
export var escapedHTML: Mdjs_escapedHTML;

declare global {
	class Mdjs extends MdjsClass { };
}
