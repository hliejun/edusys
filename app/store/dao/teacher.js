const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	UniqueConstraintError,
	NotFoundError,
	IdenticalObjectError,
	handle
} = require('../../utils/errors');

const { encryptPassword, comparePassword } = require('../../utils/crypto');

const { PRECISION_TIMESTAMP } = require('../../constants');

const TABLE_TEACHER = 'teachers';

const db = knex(config);

/* Creators */

const create = ({ name, email, password }) =>
	encryptPassword(password)
		.then(hash =>
			db(TABLE_TEACHER).insert({
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

// TODO: Add non-strict transactable create

const bulkCreate = teachers =>
	db.transaction(transaction => {
		const creations = teachers.map(teacher =>
			encryptPassword(teacher.password)
				.then(hash =>
					transaction
						.insert({
							name: teacher.name,
							email: teacher.email,
							password: hash
						})
						.into(TABLE_TEACHER)
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
						return Promise.reject(
							new UniqueConstraintError('email', teacher.email)
						);
					}
					return handle(
						error,
						`creating teacher (name: ${teacher.name}, email: ${teacher.email})`
					);
				})
		);
		return Promise.all(creations);
	});

/* Readers */

const getById = ({ id }) =>
	db(TABLE_TEACHER)
		.where({ id })
		.first()
		.catch(error => handle(error, `finding teacher (id: ${id})`));

const getByIds = ids =>
	db(TABLE_TEACHER)
		.whereIn('id', ids)
		.select()
		.catch(error => handle(error, `finding teachers (ids: ${ids})`));

const getByEmail = ({ email }) =>
	db(TABLE_TEACHER)
		.where({ email })
		.first()
		.catch(error => handle(error, `finding teacher (email: ${email})`));

const getByEmails = emails =>
	db(TABLE_TEACHER)
		.whereIn('email', emails)
		.select()
		.catch(error => handle(error, `finding teachers (emails: ${emails})`));

/* Updaters */

const setName = ({ id, name }) =>
	getById({ id })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${id})`));
			}
			return db(TABLE_TEACHER)
				.where({ id })
				.update({ name, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error =>
			handle(error, `updating name of teacher (id: ${id}) to ${name}`)
		);

const setEmail = ({ id, email }) =>
	getById({ id })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${id})`));
			}
			return db(TABLE_TEACHER)
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
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${id})`));
			}
			return Promise.all([
				Promise.resolve(teacher),
				comparePassword(password, teacher.password)
			]);
		})
		.then(([teacher, isSamePassword]) => {
			if (isSamePassword) {
				return Promise.reject(new IdenticalObjectError('password'));
			}
			return encryptPassword(password, teacher.password);
		})
		.then(hash =>
			db(TABLE_TEACHER)
				.where({ id })
				.update({ password: hash, updated_at: db.fn.now(PRECISION_TIMESTAMP) })
		)
		.catch(error => handle(error, `updating password of teacher (id: ${id})`));

/* Deletors */

const remove = ({ id }) =>
	db(TABLE_TEACHER)
		.where({ id })
		.del();

const deleteById = ({ id }) =>
	getById({ id })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${id})`));
			}
			return Promise.all([Promise.resolve(teacher), remove({ id })]);
		})
		.then(([teacher]) => {
			return Promise.resolve(teacher);
		})
		.catch(error => handle(error, `deleting teacher (id: ${id})`));

const deleteByEmail = ({ email }) =>
	getByEmail({ email })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (email: ${email})`));
			}
			return Promise.all([
				Promise.resolve(teacher),
				remove({ id: teacher.id })
			]);
		})
		.then(([teacher]) => {
			return Promise.resolve(teacher);
		})
		.catch(error => handle(error, `deleting teacher (email: ${email})`));

// FIXME: Add bulk delete by emails (using transactions)

/* Auxillary Actions */

const validate = ({ email, password }) =>
	getByEmail({ email })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (email: ${email})`));
			}
			return comparePassword(password, teacher.password);
		})
		.catch(error =>
			handle(error, `validating password of teacher (email: ${email})`)
		);

module.exports = {
	create,
	bulkCreate,
	getById,
	getByIds,
	getByEmail,
	getByEmails,
	setName,
	setEmail,
	setPassword,
	deleteById,
	deleteByEmail,
	validate
};
