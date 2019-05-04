const getNameFromEmail = email => {
	const chunks = email.split('@');
	return chunks[0];
};

module.exports = {
	getNameFromEmail
};
