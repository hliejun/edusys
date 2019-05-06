const {
	MIN_LENGTH_NAME,
	MIN_LENGTH_PASSWORD,
	MIN_LENGTH_TITLE,
	REGEX_EMAIL
} = require('../constants');

// FIXME: Add regex for validations
// FIXME: Add validations for notification fields

const isNonEmptyArray = value => Array.isArray(value) && value.length > 0;

const isValidClassTitle = title =>
	title != null && title.length && title.length >= MIN_LENGTH_TITLE;

const isValidEmail = REGEX_EMAIL.test;

const isValidName = name =>
	name != null && name.length && name.length >= MIN_LENGTH_NAME;

const isValidPassword = password =>
	password != null && password.length && password.length >= MIN_LENGTH_PASSWORD;

module.exports = {
	isNonEmptyArray,
	isValidClassTitle,
	isValidEmail,
	isValidName,
	isValidPassword
};
