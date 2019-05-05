const { REGEX_TAG } = require('../constants');
const { isValidEmail } = require('./validator');

const getNameFromEmail = email => (email.split('@') || [])[0];

const getTagsFromText = text => text.match(REGEX_TAG) || [];

const getEmailTagsFromText = text => getTagsFromText(text).filter(isValidEmail);

module.exports = {
	getEmailTagsFromText,
	getNameFromEmail,
	getTagsFromText
};
