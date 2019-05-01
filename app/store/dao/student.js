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

const create = ({ name, email }) =>
	db('students')
		.insert({ name, email })
		.then(ids => {
			if (ids && ids.length === 1) {
				return Promise.resolve(ids[0]);
			} else {
				return Promise.reject(
					new MalformedResponseError('id of student created', ids)
				);
			}
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('email', email));
			}
			return handle(error, `creating student (name: ${name}, email: ${email})`);
		});

// TODO: Add bulk create (using transactions)

/* Readers */

const getById = ({ id }) =>
	db('students')
		.where({ id })
		.first()
		.catch(error => handle(error, `finding student (id: ${id})`));

const getByEmail = ({ email }) =>
	db('students')
		.where({ email })
		.first()
		.catch(error => handle(error, `finding student (email: ${email})`));

// TODO: Add bulk read (using transactions)

/* Updaters */

const setName = ({ id, name }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`student (id: ${id})`));
			}
			return db('students')
				.where({ id })
				.update({ name, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error =>
			handle(error, `updating name of student (id: ${id}) to ${name}`)
		);

const setEmail = ({ id, email }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`student (id: ${id})`));
			}
			return db('students')
				.where({ id })
				.update({ email, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('email', email));
			}
			return handle(error, `updating email of student (id: ${id}) to ${email}`);
		});

const setSuspension = ({ id, isSuspended }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`student (id: ${id})`));
			}
			return db('students')
				.where({ id })
				.update({
					is_suspended: isSuspended,
					updated_at: db.fn.now(PRECISION_TIMESTAMP)
				});
		})
		.catch(error =>
			handle(
				error,
				`updating suspension status of student (id: ${id}) to ${isSuspended}`
			)
		);

/* Deletors */

const remove = ({ id }) =>
	db('students')
		.where({ id })
		.del();

const deleteById = ({ id }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`student (id: ${id})`));
			}
			return Promise.all([Promise.resolve(result), remove({ id })]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error => handle(error, `deleting student (id: ${id})`));

const deleteByEmail = ({ email }) =>
	getByEmail({ email })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`student (email: ${email})`));
			}
			return Promise.all([Promise.resolve(result), remove({ id: result.id })]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error => handle(error, `deleting student (email: ${email})`));

// TODO: Add bulk delete (using transactions)

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
