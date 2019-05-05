const { REGEX_EMAIL } = require('../constants');

const MIN_LENGTH_NAME = 3;
const MIN_LENGTH_PASSWORD = 7;
const MIN_LENGTH_TITLE = 5;

const isValidEmail = REGEX_EMAIL.test;

// FIXME: Add regex for name validation
const isValidName = name =>
	name != null && name.length && name.length >= MIN_LENGTH_NAME;

// FIXME: Add regex for password validation
const isValidPassword = password =>
	password != null && password.length && password.length >= MIN_LENGTH_PASSWORD;

const isValidClassTitle = title =>
	title != null && title.length && title.length >= MIN_LENGTH_TITLE;

// FIXME: Add validations for notification fields

module.exports = {
	isValidEmail,
	isValidName,
	isValidPassword,
	isValidClassTitle
};
