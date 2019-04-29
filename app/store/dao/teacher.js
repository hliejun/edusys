const bcrypt = require('bcrypt');
const knex = require('knex');

const config = require('../../../knexfile');

// TODO: Use external DAOs to handle removal
// const classDAO = require('./class');
// const regDAO = require('./register');
// const notifDAO = require('./notification');

const db = knex(config);

// TODO: Validation of inputs to be done in actions level using express-validator

/* Utils */

const saltRounds = 12;

// TODO: Intercept bcrypt errors
const encryptPassword = password => bcrypt.hash(password, saltRounds);
const comparePassword = bcrypt.compare;

/* Creators */

// TODO: Validate name
// TODO: Validate email
// TODO: Validate password
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
				const error = new Error(
					'Failed to obtain the ID of the created teacher row.'
				);
				error.code = 'ER_RETURN_ID';
				return Promise.reject(error);
			}
		})
		.catch(error => {
			// TODO: Handle bcrypt encrypt error
			let errorMessage;
			switch (error.code) {
			case 'ER_DUP_ENTRY':
				errorMessage = `A teacher with email(${email}) already exists. Please register with a different and unique email address.`;
				break;
			default:
				errorMessage =
						error.message ||
						'An unknown error occurred while creating a teacher.';
			}
			const createError = error || new Error();
			createError.message = 'Teacher -- create: ' + errorMessage;
			createError.code = error.code || 'ER_UNKNOWN';
			return Promise.reject(createError);
		});

/* Readers */

const getById = ({ id }) =>
	db('teachers')
		.where({ id })
		.first()
		.catch(error => {
			const readError =
				error ||
				new Error(
					`An unknown error occurred while finding a teacher with id: ${id}.`
				);
			readError.message = 'Teacher -- getById: ' + readError.message;
			readError.code = error.code || 'ER_UNKNOWN';
			return Promise.reject(readError);
		});

const getByEmail = ({ email }) =>
	db('teachers')
		.where({ email })
		.first()
		.catch(error => {
			const readError =
				error ||
				new Error(
					`An unknown error occurred while finding a teacher with email: ${email}.`
				);
			readError.message = 'Teacher -- getByEmail: ' + readError.message;
			readError.code = error.code || 'ER_UNKNOWN';
			return Promise.reject(readError);
		});

/* Updaters */

// TODO: Validate name
const setName = ({ id, name }) =>
	db('teachers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				const error = new Error(
					`The teacher with the given id: ${id} does not exist.`
				);
				error.code = 'ER_NOT_FOUND';
				return Promise.reject(error);
			}
			return db('teachers')
				.where({ id })
				.update({ name, updated_at: db.fn.now(6) });
		})
		.catch(error => {
			const updateError =
				error ||
				new Error(
					`An unknown error occurred while updating a teacher of id: ${id} with name: ${name}.`
				);
			updateError.message = 'Teacher -- setName: ' + updateError.message;
			updateError.code = error.code || 'ER_UNKNOWN';
			return Promise.reject(updateError);
		});

// TODO: Validate email
const setEmail = ({ id, email }) =>
	db('teachers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				const error = new Error(
					`The teacher with the given id: ${id} does not exist.`
				);
				error.code = 'ER_NOT_FOUND';
				return Promise.reject(error);
			}
			return db('teachers')
				.where({ id })
				.update({ email, updated_at: db.fn.now(6) });
		})
		.catch(error => {
			const updateError =
				error ||
				new Error(
					`An unknown error occurred while updating a teacher of id: ${id} with email: ${email}.`
				);
			updateError.message = 'Teacher -- setEmail: ' + updateError.message;
			updateError.code = error.code || 'ER_UNKNOWN';
			return Promise.reject(updateError);
		});

// TODO: Validate password
const setPassword = ({ id, password }) =>
	db('teachers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				const error = new Error(
					`The teacher with the given id: ${id} does not exist.`
				);
				error.code = 'ER_NOT_FOUND';
				return Promise.reject(error);
			}
			return Promise.all([
				Promise.resolve(result),
				comparePassword(password, result.password)
			]);
		})
		.then(([result, isSamePassword]) => {
			if (isSamePassword) {
				const error = new Error(
					'The new password provided is identical to the old one. Please choose a different password.'
				);
				error.code = 'ER_IDEN_PASSWORD';
				return Promise.reject(error);
			}
			return encryptPassword(password, result.password);
		})
		.then(hash =>
			db('teachers')
				.where({ id })
				.update({ password: hash, updated_at: db.fn.now(6) })
		)
		.catch(error => {
			// TODO: Handle encryption error
			const updateError =
				error ||
				new Error(
					`An unknown error occurred while updating a teacher of id: ${id} with a given password.`
				);
			updateError.message = 'Teacher -- setPassword: ' + updateError.message;
			updateError.code = error.code || 'ER_UNKNOWN';
			return Promise.reject(updateError);
		});

/* Deletors */

const remove = ({ id }) =>
	db('teachers')
		.where({ id })
		.del()
		.then(() => {
			// TODO: Cascade delete in class, selecting by teacher using DAO
			return Promise.resolve();
		})
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
				const error = new Error(
					`The teacher with the given id: ${id} does not exist.`
				);
				error.code = 'ER_NOT_FOUND';
				return Promise.reject(error);
			}
			return Promise.all([Promise.resolve(result), remove({ id })]);
		})
		.then(([result, removal]) => {
			return Promise.resolve(result);
		})
		.catch(error => {
			const deleteError =
				error ||
				new Error(
					`An unknown error occurred while deleting a teacher of id: ${id}.`
				);
			deleteError.message = 'Teacher -- deleteById: ' + deleteError.message;
			deleteError.code = error.code || 'ER_UNKNOWN';
			return Promise.reject(deleteError);
		});

const deleteByEmail = ({ email }) =>
	db('teachers')
		.where({ email })
		.first()
		.then(result => {
			if (result == null) {
				const error = new Error(
					`The teacher with the given email: ${email} does not exist.`
				);
				error.code = 'ER_NOT_FOUND';
				return Promise.reject(error);
			}
			return Promise.all([Promise.resolve(result), remove({ id: result.id })]);
		})
		.then(([result, removal]) => {
			return Promise.resolve(result);
		})
		.catch(error => {
			const deleteError =
				error ||
				new Error(
					`An unknown error occurred while deleting a teacher of email: ${email}.`
				);
			deleteError.message = 'Teacher -- deleteByEmail: ' + deleteError.message;
			deleteError.code = error.code || 'ER_UNKNOWN';
			return Promise.reject(deleteError);
		});

/* Auxillary Actions */

// TODO: Handle bcrypt compare error
const validate = ({ email, password }) =>
	db('teachers')
		.where({ email })
		.first()
		.then(result => {
			if (result == null) {
				const error = new Error(
					`The teacher with the given email: ${email} does not exist.`
				);
				error.code = 'ER_NOT_FOUND';
				return Promise.reject(error);
			}
			return comparePassword(password, result.password);
		})
		.catch(error => {
			const validateError =
				error ||
				new Error(
					`An unknown error occurred while validating the password of a teacher of email: ${email}.`
				);
			validateError.message = 'Teacher -- validate: ' + validateError.message;
			validateError.code = error.code || 'ER_UNKNOWN';
			return Promise.reject(validateError);
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
