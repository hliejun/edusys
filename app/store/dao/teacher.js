const knex = require('knex');

const config = require('../../../knexfile');

const { PRECISION_TIMESTAMP } = require('../../constants');

const {
	MalformedResponseError,
	UniqueConstraintError,
	NotFoundError,
	IdenticalObjectError,
	handle
} = require('../../utils/errors');

const { encryptPassword, comparePassword } = require('../../utils/crypto');

const db = knex(config);

/* Creators */

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
			}
			return Promise.reject(
				new MalformedResponseError('id of teacher created', ids)
			);
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('email', email));
			}
			return handle(error, `creating teacher (name: ${name}, email: ${email})`);
		});

// TODO: Add bulk create (using transactions)

/* Readers */

const getById = ({ id }) =>
	db('teachers')
		.where({ id })
		.first()
		.catch(error => handle(error, `finding teacher (id: ${id})`));

const getByEmail = ({ email }) =>
	db('teachers')
		.where({ email })
		.first()
		.catch(error => handle(error, `finding teacher (email: ${email})`));

// TODO: Add bulk read (using transactions)

/* Updaters */

const setName = ({ id, name }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${id})`));
			}
			return db('teachers')
				.where({ id })
				.update({ name, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error =>
			handle(error, `updating name of teacher (id: ${id}) to ${name}`)
		);

const setEmail = ({ id, email }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${id})`));
			}
			return db('teachers')
				.where({ id })
				.update({ email, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('email', email));
			}
			return handle(error, `updating email of teacher (id: ${id}) to ${email}`);
		});

const setPassword = ({ id, password }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${id})`));
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
		.catch(error => handle(error, `updating password of teacher (id: ${id})`));

/* Deletors */

const remove = ({ id }) =>
	db('teachers')
		.where({ id })
		.del();

const deleteById = ({ id }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${id})`));
			}
			return Promise.all([Promise.resolve(result), remove({ id })]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error => handle(error, `deleting teacher (id: ${id})`));

const deleteByEmail = ({ email }) =>
	getByEmail({ email })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (email: ${email})`));
			}
			return Promise.all([Promise.resolve(result), remove({ id: result.id })]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error => handle(error, `deleting teacher (email: ${email})`));

// TODO: Add bulk delete (using transactions)

/* Auxillary Actions */

const validate = ({ email, password }) =>
	getByEmail({ email })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (email: ${email})`));
			}
			return comparePassword(password, result.password);
		})
		.catch(error =>
			handle(error, `validating password of teacher (email: ${email})`)
		);

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
