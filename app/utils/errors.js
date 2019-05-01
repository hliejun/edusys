const ERROR_TYPES = {
	ER_DECRYPTION: 'ER_DECRYPTION',
	ER_ENCRYPTION: 'ER_ENCRYPTION',
	ER_GEN_UNKNOWN: 'ER_GEN_UNKNOWN',
	ER_IDEN_OBJECT: 'ER_IDEN_OBJECT',
	ER_MAL_RESPONSE: 'ER_MAL_RESPONSE',
	ER_NOT_FOUND: 'ER_NOT_FOUND',
	ER_UNIQ_CONSTRAINT: 'ER_UNIQ_CONSTRAINT'
};

const isHandled = error => error && !!ERROR_TYPES[error.code];

const handle = (error, description) => {
	if (isHandled(error)) {
		return Promise.reject(error);
	}
	return Promise.reject(new UnknownError(description, error));
};

/**
 * 'Unknown' generic error
 */
class UnknownError extends Error {
	/**
	 * Error constructor
	 * @param {String} action The description of the action during which the error occurred.
	 * @param {Error} error An error object received in the unhandled case.
	 */
	constructor(action, error) {
		super(
			`An unknown error occurred while ${action || 'executing a subroutine'}.`
		);
		if (error && error.message) {
			this.message += `\n Details: ${error.message}`;
		}
		this.code = ERROR_TYPES.ER_GEN_UNKNOWN;
		Error.captureStackTrace(this, UnknownError);
	}
}

/**
 * 'Not Found' data error
 */
class NotFoundError extends Error {
	/**
	 * Error constructor
	 * @param {String} object The description of the object that cannot be found.
	 */
	constructor(object) {
		super(`The ${object || 'object'} does not exist.`);
		this.code = ERROR_TYPES.ER_NOT_FOUND;
		Error.captureStackTrace(this, NotFoundError);
	}
}

/**
 * 'Identical Object' data error
 */
class IdenticalObjectError extends Error {
	/**
	 * Error constructor
	 * @param {String} object The description of the object or field that cannot be identical.
	 */
	constructor(object) {
		super(
			`The new ${object ||
				'object'} provided is identical to the old one. Please use a different ${object ||
				'object'}.`
		);
		this.code = ERROR_TYPES.ER_IDEN_OBJECT;
		Error.captureStackTrace(this, IdenticalObjectError);
	}
}

/**
 * 'Malformed Response' data error
 */
class MalformedResponseError extends Error {
	/**
	 * Error constructor
	 * @param {String} response The description of the response that is expected.
	 * @param {String} actual The description of the actual response received.
	 */
	constructor(response, actual) {
		super(
			`A response with ${response} is expected but received ${actual} instead.`
		);
		this.code = ERROR_TYPES.ER_MAL_RESPONSE;
		Error.captureStackTrace(this, MalformedResponseError);
	}
}

/**
 * 'Unique Constraint' data error
 */
class UniqueConstraintError extends Error {
	/**
	 * Error constructor
	 * @param {String} constraint The description of the unique constraint that is violated.
	 * @param {String} value The value of the violated constraint.
	 */
	constructor(constraint, value) {
		super(
			`The ${constraint} (${value}) already exists. Please use a different and unique ${constraint}.`
		);
		this.code = ERROR_TYPES.ER_UNIQ_CONSTRAINT;
		Error.captureStackTrace(this, UniqueConstraintError);
	}
}

/**
 * 'Encryption' data error
 */
class EncryptionError extends Error {
	/**
	 * Error constructor
	 * @param {String} data The description of the data being encrypted.
	 */
	constructor(data) {
		super(`An error occurred while encrypting the ${data}.`);
		this.code = ERROR_TYPES.ER_ENCRYPTION;
		Error.captureStackTrace(this, EncryptionError);
	}
}

/**
 * 'Decryption' data error
 */
class DecryptionError extends Error {
	/**
	 * Error constructor
	 * @param {String} data The description of the data being decrypted.
	 */
	constructor(data) {
		super(`An error occurred while decrypting the ${data}.`);
		this.code = ERROR_TYPES.ER_DECRYPTION;
		Error.captureStackTrace(this, DecryptionError);
	}
}

module.exports = {
	UnknownError,
	NotFoundError,
	IdenticalObjectError,
	MalformedResponseError,
	UniqueConstraintError,
	EncryptionError,
	DecryptionError,
	handle
};
