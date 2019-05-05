const { REGEX_EMAIL, REGEX_TAG } = require('../constants');

const getNameFromEmail = email => {
	const chunks = email.split('@') || [];
	return chunks[0];
};

const getTagsFromText = text => text.match(REGEX_TAG) || [];

const getEmailTagsFromText = text => {
	const tags = getTagsFromText(text);
	return tags.filter(REGEX_EMAIL.test);
};

module.exports = {
	getNameFromEmail,
	getTagsFromText,
	getEmailTagsFromText
};
