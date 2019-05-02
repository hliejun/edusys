const store = require('./store');

const PRECISION_TIMESTAMP = 6;
const SALT_ROUNDS = process.env.NODE_ENV === 'development' ? 5 : 12;

module.exports = {
	...store,
	PRECISION_TIMESTAMP,
	SALT_ROUNDS
};
