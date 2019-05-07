const { REGEX_TAG } = require('../constants');
const { isValidEmail } = require('./validator');

const getNameFromEmail = email => (email.split('@') || [])[0];

const getTagsFromText = text => text.match(REGEX_TAG) || [];

const getTaggedEmailsFromText = text =>
	getTagsFromText(text)
		.map(emailTag => emailTag.substr(1))
		.filter(text => isValidEmail(text));

module.exports = {
	getNameFromEmail,
	getTaggedEmailsFromText,
	getTagsFromText
};
