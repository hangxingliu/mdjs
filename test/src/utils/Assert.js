//@ts-check

let assert = require('assert'),
	{ AssertionError } = assert;

module.exports = {
	Assert, Invoke
};

/** @param {any} value  */
function Assert(value) {
	let throwAssertionError = (message, expected, actual) => {
		throw new AssertionError({ message, expected, actual }) };

	let chains = {
		get and() { return chains },

		print,

		isTrue, isFalse, isUndefined, equals, equalsInJSON, fieldsEqual,
		differentFrom, greaterThan, lessThan,

		isString, isNumber, isObject, isTypeof,
		isArray, length,
		containsKeys, containsValue, containsSubString,
		doesNotContainSubString,

		allKeys, allKeyValueTuples, child, sort, parseJSON, each,
		convertBy,

		// aliases:
		field: child
	};
	return chains;

	function print() {
		console.log(value);
		return chains;
	}

	function isTrue() { return equals(true); }
	function isFalse() { return equals(false); }
	function isUndefined() { return equals(undefined); }
	function isString() { return isTypeof('string'); }
	function isNumber() { return isTypeof('number'); }
	function isObject() { return isTypeof('object'); }

	/** @param {string} type */
	function isTypeof(type) {
		assert.deepStrictEqual(typeof value, type);
		return chains;
	}

	function equals(expected) {
		assert.deepStrictEqual(value, expected);
		return chains;
	}
	function differentFrom(expected) {
		assert.notDeepStrictEqual(value, expected);
		return chains;
	}

	/** @type {any} */
	function equalsInJSON(expected) {
		assert.deepStrictEqual(JSON.stringify(value), JSON.stringify(expected));
		return chains;
	}

	function greaterThan(expected) {
		if(value > expected)
			return chains;
			throwAssertionError(`value is not greater than ${expected}`, `greater than ${expected}`, value);
	}
	function lessThan(expected) {
		if(value < expected)
			return chains;
		throwAssertionError(`value is not less than ${expected}`, `less than ${expected}`, value);
	}

	/** @param {{[fieldName: string]: any}} equalMap */
	function fieldsEqual(equalMap) {
		for (let fieldName in equalMap)
			assert.deepStrictEqual(value[fieldName], equalMap[fieldName]);
		return chains;
	}

	function isArray() {
		if (!Array.isArray(value))
			throwAssertionError('Value is not an array', 'An Array', value);
		return chains;
	}

	/** @param {number} len */
	function length(len) {
		if (!('length' in value))
			throwAssertionError('`length` is missing in value', 'has `length` field', value);
		if (value.length !== len)
			throwAssertionError(`value.length != ${len}`, len, value.length);
		return chains;
	}

	/** @param {string[]} keys */
	function containsKeys(...keys) {
		for (let k of keys)
			if (!(k in value))
				throwAssertionError(`\`${k}\` is missing in value`, `{ "${k}": any, ... }`, value);
		return chains;
	}

	/** @param {any} v */
	function containsValue(v) {
		for (let key in value)
			if (value[key] == v)
				return chains;
		throwAssertionError(`${JSON.stringify(v)} is missing in value`, `contains ${JSON.stringify(v)}`, value);
	}

	/** @param {string} subString */
	function containsSubString(subString) {
		isString();
		if (value.indexOf(subString) < 0) {
			let name = JSON.stringify(subString);
			if (name.length > 100) name = name.slice(0, 95) + " ... \"";
			throwAssertionError(`value doesn't contain substring`, `string contains ${name}`, value);
		}
		return chains;
	}

	/** @param {string} subString */
	function doesNotContainSubString(subString) {
		isString();
		if (value.indexOf(subString) >= 0) {
			let name = JSON.stringify(subString);
			if (name.length > 100) name = name.slice(0, 95) + " ... \"";
			throwAssertionError(`value contains substring`, `string doesn't contains ${name}`, value);
		}
		return chains;
	}

	function allKeys() { return convertBy(value => Object.keys(value)); }
	function allKeyValueTuples() { return convertBy(value => Object.keys(value).map(k => ({ k, v: value[k] })));}
	function sort() {
		isArray();
		return convertBy(value => Object.assign([], value).sort());
	}

	/** @param {string} fieldName */
	function child(fieldName) {
		containsKeys(fieldName);
		return convertBy(value => value[fieldName]);
	}

	/** @param {(value: any, key: string) => any} handler */
	function each(handler) {
		for (let k in value)
			handler(value[k], k);
		return chains;
	}

	function parseJSON() {
		let object = void 0;
		try {
			object = JSON.parse(value);
		} catch (ex) {
			throwAssertionError('Could not parse JSON', `A valid JSON`, `Invalid JSON: ${ex.message}`);
		}
		return Assert(object);
	}

	/** @param {(any) => any} handler */
	function convertBy(handler) {
		return Assert(handler(value));
	}
}

/**
 * @param {Function} func
 * @param {any} [context]
 * @param {any[]} [parameters]
 */
function Invoke(func, context, ...parameters) {
	let invokeExpression = `${func.name}(${parameters.map(p=>JSON.stringify(p)).join(', ')})`;
	let value = undefined,
		exception = undefined;

	try {
		value = func.call(context, ...parameters);
	} catch (e) {
		exception = e;
	}

	let chains = Object.assign({ hasException }, Assert(value));

	if (typeof exception != 'undefined') {
		let throwAgain = (originalCheckerName) => {
			throw new AssertionError({
				message: `${invokeExpression} thrown an exception`,
				expected: originalCheckerName,
				actual: 'message' in exception ? exception.message : exception
			});
		};
		for (let funcName in chains)
			if (funcName != hasException.name)
				chains[funcName] = throwAgain.bind(this, funcName);
	}

	return chains;

	function hasException(keyword = '') {
		let expected = keyword ? `An exception has keyword "${keyword}"` : `An exception`;
		if (typeof exception == 'undefined') {
			throw new AssertionError({
				message: `${invokeExpression} didn't thrown an exception`,
				expected, actual: 'No exception'
			});
		}
		if (keyword) {
			let message = String('message' in exception ? exception.message : exception);
			if (message.toLowerCase().indexOf(keyword.toLowerCase()) < 0)
				throw new AssertionError({
					message: `${invokeExpression} thrown an exception without keyword`,
					expected, actual: `An exception with keyword "${keyword}"`
				})
		}
		// OK
	}
}
