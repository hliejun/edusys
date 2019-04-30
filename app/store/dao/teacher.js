const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	UniqueConstraintError,
	UnknownError,
	NotFoundError,
	IdenticalObjectError
} = require('../../utils/errors');

const { encryptPassword, comparePassword } = require('../../utils/crypto');

// TODO: Validation of inputs to be done in actions level using express-validator

// TODO: Use external DAOs to handle removal
// const regDAO = require('./register');
// const notifDAO = require('./notification');

const db = knex(config);

const PRECISION_TIMESTAMP = 6;

/* Creators */

// TODO: Validate name
// TODO: Validate email
// TODO: Validate password
// TODO: Handle encryption error
const create = ({ name, email, password }) =>
	encryptPassword(password)
		.then(hash =>
			db('teachers').insert({
				name,
				email,
				password: hash
			})
		)
		.then(ids => {
			if (ids && ids.length === 1) {
				return Promise.resolve(ids[0]);
			} else {
				return Promise.reject(
					new MalformedResponseError('id of the created teacher row', ids)
				);
			}
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('email', email));
			}
			if (error.code === 'ER_MAL_RESPONSE') {
				return Promise.reject(error);
			}
			return Promise.reject(new UnknownError('creating a teacher', error));
		});

/* Readers */

const getById = ({ id }) =>
	db('teachers')
		.where({ id })
		.first()
		.catch(error => {
			return Promise.reject(
				new UnknownError(`finding a teacher with id: ${id}`)
			);
		});

const getByEmail = ({ email }) =>
	db('teachers')
		.where({ email })
		.first()
		.catch(error => {
			return Promise.reject(
				new UnknownError(`finding a teacher with email: ${email}`, error)
			);
		});

/* Updaters */

// TODO: Validate name
const setName = ({ id, name }) =>
	db('teachers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given id: ${id}`)
				);
			}
			return db('teachers')
				.where({ id })
				.update({ name, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a teacher of id: ${id} with name: ${name}`,
					error
				)
			);
		});

// TODO: Validate email
const setEmail = ({ id, email }) =>
	db('teachers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given id: ${id}`)
				);
			}
			return db('teachers')
				.where({ id })
				.update({ email, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('email', email));
			}
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a teacher of id: ${id} with email: ${email}`,
					error
				)
			);
		});

// TODO: Validate password
// TODO: Handle encryption error
const setPassword = ({ id, password }) =>
	db('teachers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given id: ${id}`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				comparePassword(password, result.password)
			]);
		})
		.then(([result, isSamePassword]) => {
			if (isSamePassword) {
				return Promise.reject(new IdenticalObjectError('password'));
			}
			return encryptPassword(password, result.password);
		})
		.then(hash =>
			db('teachers')
				.where({ id })
				.update({ password: hash, updated_at: db.fn.now(PRECISION_TIMESTAMP) })
		)
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND' || error.code === 'ER_IDEN_OBJECT') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a teacher of id: ${id} with a given password`,
					error
				)
			);
		});

/* Deletors */

const remove = ({ id }) =>
	db('teachers')
		.where({ id })
		.del()
		.then(() => {
			// TODO: Cascade delete in register, selecting by teacher using DAO
			return Promise.resolve();
		})
		.then(() => {
			// TODO: Cascade delete in notification, selecting by teacher using DAO
			return Promise.resolve();
		});

const deleteById = ({ id }) =>
	db('teachers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given id: ${id}`)
				);
			}
			return Promise.all([Promise.resolve(result), remove({ id })]);
		})
		.then(([result, removal]) => {
			return Promise.resolve(result);
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(`deleting a teacher of id: ${id}`, error)
			);
		});

const deleteByEmail = ({ email }) =>
	db('teachers')
		.where({ email })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given email: ${email}`)
				);
			}
			return Promise.all([Promise.resolve(result), remove({ id: result.id })]);
		})
		.then(([result, removal]) => {
			return Promise.resolve(result);
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(`deleting a teacher of email: ${email}`, error)
			);
		});

/* Auxillary Actions */

// TODO: Handle decryption error
const validate = ({ email, password }) =>
	db('teachers')
		.where({ email })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given email: ${email}`)
				);
			}
			return comparePassword(password, result.password);
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`validating the password of a teacher of email: ${email}`,
					error
				)
			);
		});

module.exports = {
	create,
	getById,
	getByEmail,
	setName,
	setEmail,
	setPassword,
	deleteById,
	deleteByEmail,
	validate
};
