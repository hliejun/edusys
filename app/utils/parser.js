const getNameFromEmail = email => {
	const chunks = email.split('@');
	return chunks[0];
};

const getTagsFromText = text => {
	const regex = /(?<![\w@])@([\w@]+(?:[.!][\w@]+)*)/g;
	const tags = text.match(regex) || [];
	return tags;
};

/* 

Original regex from https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript:

/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

*/
const getEmailTagsFromText = text => {
	const tags = getTagsFromText(text);
	const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	const emails = tags.filter(regex.test);
	return emails;
};

module.exports = {
	getNameFromEmail,
	getTagsFromText,
	getEmailTagsFromText
};
