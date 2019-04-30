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

// TODO: Validate title
const create = ({ title }) =>
	db('classes')
		.insert({ title })
		.then(ids => {
			if (ids && ids.length === 1) {
				return Promise.resolve(ids[0]);
			} else {
				return Promise.reject(
					new MalformedResponseError('id of the created class row', ids)
				);
			}
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('class title', title));
			}
			if (error.code === 'ER_MAL_RESPONSE') {
				return Promise.reject(error);
			}
			return Promise.reject(new UnknownError('creating a class', error));
		});

/* Readers */

const getById = ({ id }) =>
	db('classes')
		.where({ id })
		.first()
		.catch(error => {
			return Promise.reject(
				new UnknownError(`finding a class with id: ${id}`, error)
			);
		});

const getByTitle = ({ title }) =>
	db('classes')
		.where({ title })
		.first()
		.catch(error => {
			return Promise.reject(
				new UnknownError(`finding a class with title: ${title}`, error)
			);
		});

/* Updaters */

// TODO: Validate title
const setTitle = ({ id, title }) =>
	db('classes')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`class with the given id: ${id}`)
				);
			}
			return db('classes')
				.where({ id })
				.update({ title, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('class title', title));
			}
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a class of id: ${id} with title: ${title}`,
					error
				)
			);
		});

/* Deletors */

const remove = ({ id }) =>
	db('classes')
		.where({ id })
		.del()
		.then(() => {
			// TODO: Cascade delete in register, selecting by class using DAO
			return Promise.resolve();
		});

const deleteById = ({ id }) =>
	db('classes')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`class with the given id: ${id}`)
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
				new UnknownError(`deleting a class of id: ${id}`, error)
			);
		});

const deleteByTitle = ({ title }) =>
	db('classes')
		.where({ title })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`class with the given title: ${title}`)
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
				new UnknownError(`deleting a class of title: ${title}`, error)
			);
		});

module.exports = {
	create,
	getById,
	getByTitle,
	setTitle,
	deleteById,
	deleteByTitle
};
