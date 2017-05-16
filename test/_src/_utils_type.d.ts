type ValidateHTMLObject = {
	select(selector: string): ValidateHTMLSelectResult;
};
type ValidateHTMLSelectResult = {
	length(len: number): ValidateHTMLSelectResult;
	attr(attr: string, value: string): ValidateHTMLSelectResult;
	html(html: string): ValidateHTMLSelectResult;
	text(text: string): ValidateHTMLSelectResult;
	select(selector: string): ValidateHTMLSelectResult;
};