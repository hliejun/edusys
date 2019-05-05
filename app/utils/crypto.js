const bcrypt = require('bcrypt');

const { SALT_ROUNDS } = require('../constants');

// FIXME: Intercept bcrypt errors
const comparePassword = bcrypt.compare;
const encryptPassword = password => bcrypt.hash(password, SALT_ROUNDS);

module.exports = {
	comparePassword,
	encryptPassword
};
