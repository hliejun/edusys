const ERROR_MSG = {
	UNSUPPORTED_ROUTES: 'Endpoint not found. This service route is unsupported.',
	MALFORMED_EMAILS:
		'One or more email addresses provided are malformed or invalid.'
};

const ERROR_TYPES = {
	ER_DECRYPTION: 'ER_DECRYPTION',
	ER_ENCRYPTION: 'ER_ENCRYPTION',
	ER_GEN_UNKNOWN: 'ER_GEN_UNKNOWN',
	ER_IDEN_OBJECT: 'ER_IDEN_OBJECT',
	ER_MAL_RESPONSE: 'ER_MAL_RESPONSE',
	ER_NOT_FOUND: 'ER_NOT_FOUND',
	ER_UNIQ_CONSTRAINT: 'ER_UNIQ_CONSTRAINT'
};

const ERROR_TYPES_EXT = {
	ER_DUP_ENTRY: 'ER_DUP_ENTRY'
};

module.exports = {
	ERROR_MSG,
	ERROR_TYPES,
	ERROR_TYPES_EXT
};
