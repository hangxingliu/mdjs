exports = module.exports = (
	function VSCodeProblemMatcher(runner) {
		require('mocha').reporters.Base.call(this, runner)
		runner.on('fail', onFail)
		/**
		 * @param {any} test 
		 * @param {Error} err 
		 */
		function onFail(test, err) {
			console.log('============');
			console.log(test.title);
			console.log(err.stack);
			let obj = String(err.stack).match(/^\s*at\s+Context\.it\s+\((.+):(\d+):(\d+)\)/m);
			obj && console.log(`error: ${obj[1]}|${obj[2]}|${obj[3]}| [ TEST NAME ] ${test.title}`);
			obj && console.log(`error: ${obj[1]}|${obj[2]}|${obj[3]}|${err.message}`);
		}
	}
);