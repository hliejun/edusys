const bcrypt = require('bcrypt');

const { SALT_ROUNDS } = require('../constants');

// TODO: Intercept bcrypt errors
const encryptPassword = password => bcrypt.hash(password, SALT_ROUNDS);
const comparePassword = bcrypt.compare;

module.exports = {
	encryptPassword,
	comparePassword
};
