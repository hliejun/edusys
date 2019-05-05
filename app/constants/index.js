const database = require('./database');
const error = require('./error');
const test = require('./test');
const validation = require('./validation');

module.exports = {
	...database,
	...error,
	...test,
	...validation
};
