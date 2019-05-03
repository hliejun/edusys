const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	UniqueConstraintError,
	NotFoundError,
	handle
} = require('../../utils/errors');

const { PRECISION_TIMESTAMP } = require('../../constants');

const TABLE_CLASS = 'classes';

const db = knex(config);

/* Creators */

const create = ({ title }) =>
	db(TABLE_CLASS)
		.insert({ title })
		.then(ids => {
			if (ids && ids.length === 1) {
				return Promise.resolve(ids[0]);
			}
			return Promise.reject(
				new MalformedResponseError('id of class created', ids)
			);
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('class title', title));
			}
			return handle(error, `creating class (title: ${title})`);
		});

// TODO: Add non-strict transactable create

/* Readers */

const getById = ({ id }) =>
	db(TABLE_CLASS)
		.where({ id })
		.first()
		.catch(error => handle(error, `finding class (id: ${id})`));

const getByTitle = ({ title }) =>
	db(TABLE_CLASS)
		.where({ title })
		.first()
		.catch(error => handle(error, `finding class (title: ${title})`));

// FIXME: Add bulk read

/* Updaters */

const setTitle = ({ id, title }) =>
	getById({ id })
		.then(classroom => {
			if (classroom == null) {
				return Promise.reject(new NotFoundError(`class (id: ${id})`));
			}
			return db(TABLE_CLASS)
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
	db(TABLE_CLASS)
		.where({ id })
		.del();

const deleteById = ({ id }) =>
	getById({ id })
		.then(classroom => {
			if (classroom == null) {
				return Promise.reject(new NotFoundError(`class (id: ${id})`));
			}
			return Promise.all([Promise.resolve(classroom), remove({ id })]);
		})
		.then(([classroom]) => {
			return Promise.resolve(classroom);
		})
		.catch(error => handle(error, `deleting class (id: ${id})`));

const deleteByTitle = ({ title }) =>
	getByTitle({ title })
		.then(classroom => {
			if (classroom == null) {
				return Promise.reject(new NotFoundError(`class (title: ${title})`));
			}
			return Promise.all([
				Promise.resolve(classroom),
				remove({ id: classroom.id })
			]);
		})
		.then(([classroom]) => {
			return Promise.resolve(classroom);
		})
		.catch(error => handle(error, `deleting class (title: ${title})`));

module.exports = {
	create,
	getById,
	getByTitle,
	setTitle,
	deleteById,
	deleteByTitle
};
