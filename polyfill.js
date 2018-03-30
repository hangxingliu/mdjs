(function () {
	//Copy from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
	polyfill('trim', function () {
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	});

	//Copy from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
	polyfill('startsWith', function (searchString, position) {
		position = position || 0;
		return this.substr(position, searchString.length) === searchString;
	});

	//Copy from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
	polyfill('endsWith', function (searchString, position) {
		var subjectString = this.toString();
		if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
			position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.lastIndexOf(searchString, position);
		return lastIndex !== -1 && lastIndex === position;
	});

	/**
	 * @param {string} name
	 * @param {Function} func
	 */
	function polyfill(name, func) {
		if (!String.prototype[name])
			String.prototype[name] = func;
	}
})();
