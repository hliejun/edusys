const MIN_LENGTH_NAME = 3;
const MIN_LENGTH_PASSWORD = 7;
const MIN_LENGTH_TITLE = 5;

const REGEX_EMAIL = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const REGEX_TAG = /(?<![\w@])@([\w@]+(?:[.!][\w@]+)*)/g;

module.exports = {
	MIN_LENGTH_NAME,
	MIN_LENGTH_PASSWORD,
	MIN_LENGTH_TITLE,
	REGEX_EMAIL,
	REGEX_TAG
};
