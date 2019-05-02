const bcrypt = require('bcrypt');

const SALT_ROUNDS = process.env.NODE_ENV === 'development' ? 5 : 12;

// TODO: Intercept bcrypt errors
const encryptPassword = password => bcrypt.hash(password, SALT_ROUNDS);
const comparePassword = bcrypt.compare;

module.exports = {
	encryptPassword,
	comparePassword
};
