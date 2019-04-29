const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	UniqueConstraintError,
	UnknownError,
	NotFoundError
} = require('../../utils/errors');

// TODO: Validation of inputs to be done in actions level using express-validator

// TODO: Use external DAOs to handle removal
// const regDAO = require('./register');

const db = knex(config);

const PRECISION_TIMESTAMP = 6;

/* Creators */

// TODO: Validate name
// TODO: Validate email
const create = ({ name, email }) =>
	db('students')
		.insert({ name, email })
		.then(ids => {
			if (ids && ids.length === 1) {
				return Promise.resolve(ids[0]);
			} else {
				return Promise.reject(
					new MalformedResponseError('id of the created student row', ids)
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
			return Promise.reject(new UnknownError('creating a student'));
		});

/* Readers */

const getById = ({ id }) =>
	db('students')
		.where({ id })
		.first()
		.catch(error => {
			return Promise.reject(
				new UnknownError(`finding a student with id: ${id}`)
			);
		});

const getByEmail = ({ email }) =>
	db('students')
		.where({ email })
		.first()
		.catch(error => {
			return Promise.reject(
				new UnknownError(`finding a student with email: ${email}`)
			);
		});

/* Updaters */

// TODO: Validate name
const setName = ({ id, name }) =>
	db('students')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given id: ${id}`)
				);
			}
			return db('students')
				.where({ id })
				.update({ name, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(`updating a student of id: ${id} with name: ${name}`)
			);
		});

// TODO: Validate email
const setEmail = ({ id, email }) =>
	db('students')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given id: ${id}`)
				);
			}
			return db('students')
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
				new UnknownError(`updating a student of id: ${id} with email: ${email}`)
			);
		});

// TODO: Validate isSuspended
const setSuspension = ({ id, isSuspended }) =>
	db('students')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given id: ${id}`)
				);
			}
			return db('students')
				.where({ id })
				.update({
					is_suspended: isSuspended,
					updated_at: db.fn.now(PRECISION_TIMESTAMP)
				});
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a student of id: ${id} with suspension status: ${isSuspended}`
				)
			);
		});

/* Deletors */

const remove = ({ id }) =>
	db('students')
		.where({ id })
		.del()
		.then(() => {
			// TODO: Cascade delete in register, selecting by student using DAO
			return Promise.resolve();
		});

const deleteById = ({ id }) =>
	db('students')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given id: ${id}`)
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
				new UnknownError(`deleting a student of id: ${id}`)
			);
		});

const deleteByEmail = ({ email }) =>
	db('students')
		.where({ email })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given email: ${email}`)
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
				new UnknownError(`deleting a student of email: ${email}`)
			);
		});

module.exports = {
	create,
	getById,
	getByEmail,
	setName,
	setEmail,
	setSuspension,
	deleteById,
	deleteByEmail
};
