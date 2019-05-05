const database = require('./database');
const error = require('./error');
const regex = require('./regex');
const test = require('./test');

module.exports = {
	...database,
	...error,
	...regex,
	...test
};
