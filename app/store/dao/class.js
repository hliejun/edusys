const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	UniqueConstraintError,
	NotFoundError,
	handle
} = require('../../utils/errors');

const db = knex(config);

const PRECISION_TIMESTAMP = 6;

/* Creators */

const create = ({ title }) =>
	db('classes')
		.insert({ title })
		.then(ids => {
			if (ids && ids.length === 1) {
				return Promise.resolve(ids[0]);
			} else {
				return Promise.reject(
					new MalformedResponseError('id of class created', ids)
				);
			}
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('class title', title));
			}
			return handle(error, `creating class (title: ${title})`);
		});

// TODO: Add bulk create (using transactions)

/* Readers */

const getById = ({ id }) =>
	db('classes')
		.where({ id })
		.first()
		.catch(error => handle(error, `finding class (id: ${id})`));

const getByTitle = ({ title }) =>
	db('classes')
		.where({ title })
		.first()
		.catch(error => handle(error, `finding class (title: ${title})`));

// TODO: Add bulk read (using transactions)

/* Updaters */

const setTitle = ({ id, title }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`class (id: ${id})`));
			}
			return db('classes')
				.where({ id })
				.update({ title, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('class title', title));
			}
			return handle(error, `updating title of class (id: ${id}) to ${title}`);
		});

/* Deletors */

const remove = ({ id }) =>
	db('classes')
		.where({ id })
		.del();

const deleteById = ({ id }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`class (id: ${id})`));
			}
			return Promise.all([Promise.resolve(result), remove({ id })]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error => handle(error, `deleting class (id: ${id})`));

const deleteByTitle = ({ title }) =>
	getByTitle({ title })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`class (title: ${title})`));
			}
			return Promise.all([Promise.resolve(result), remove({ id: result.id })]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error => handle(error, `deleting class (title: ${title})`));

// TODO: Add bulk delete (using transactions)

module.exports = {
	create,
	getById,
	getByTitle,
	setTitle,
	deleteById,
	deleteByTitle
};
