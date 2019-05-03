const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	UniqueConstraintError,
	NotFoundError,
	handle
} = require('../../utils/errors');

const { PRECISION_TIMESTAMP } = require('../../constants');

const TABLE_STUDENT = 'students';

const db = knex(config);

/* Creators */

const create = ({ name, email }) =>
	db(TABLE_STUDENT)
		.insert({ name, email })
		.then(ids => {
			if (ids && ids.length === 1) {
				return Promise.resolve(ids[0]);
			}
			return Promise.reject(
				new MalformedResponseError('id of student created', ids)
			);
		})
		.catch(error => {
			if (error.code === 'ER_DUP_ENTRY') {
				return Promise.reject(new UniqueConstraintError('email', email));
			}
			return handle(error, `creating student (name: ${name}, email: ${email})`);
		});

const bulkCreate = students =>
	db.transaction(transaction => {
		const creations = students.map(student =>
			transaction
				.insert({
					name: student.name,
					email: student.email
				})
				.into(TABLE_STUDENT)
				.then(ids => {
					if (ids && ids.length === 1) {
						return Promise.resolve(ids[0]);
					}
					return Promise.reject(
						new MalformedResponseError('id of student created', ids)
					);
				})
				.catch(error => {
					if (error.code === 'ER_DUP_ENTRY') {
						return Promise.reject(
							new UniqueConstraintError('email', student.email)
						);
					}
					return handle(
						error,
						`creating student (name: ${student.name}, email: ${student.email})`
					);
				})
		);
		return Promise.all(creations);
	});

/* Readers */

const getById = ({ id }) =>
	db(TABLE_STUDENT)
		.where({ id })
		.first()
		.catch(error => handle(error, `finding student (id: ${id})`));

const getByIds = ids =>
	db(TABLE_STUDENT)
		.whereIn('id', ids)
		.select()
		.catch(error => handle(error, `finding students (ids: ${ids})`));

const getByEmail = ({ email }) =>
	db(TABLE_STUDENT)
		.where({ email })
		.first()
		.catch(error => handle(error, `finding student (email: ${email})`));

const getByEmails = emails =>
	db(TABLE_STUDENT)
		.whereIn('email', emails)
		.select()
		.catch(error => handle(error, `finding students (emails: ${emails})`));

/* Updaters */

const setName = ({ id, name }) =>
	getById({ id })
		.then(student => {
			if (student == null) {
				return Promise.reject(new NotFoundError(`student (id: ${id})`));
			}
			return db(TABLE_STUDENT)
				.where({ id })
				.update({ name, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error =>
			handle(error, `updating name of student (id: ${id}) to ${name}`)
		);

const setEmail = ({ id, email }) =>
	getById({ id })
		.then(student => {
			if (student == null) {
				return Promise.reject(new NotFoundError(`student (id: ${id})`));
			}
			return db(TABLE_STUDENT)
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
		.then(student => {
			if (student == null) {
				return Promise.reject(new NotFoundError(`student (id: ${id})`));
			}
			return db(TABLE_STUDENT)
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
	db(TABLE_STUDENT)
		.where({ id })
		.del();

const deleteById = ({ id }) =>
	getById({ id })
		.then(student => {
			if (student == null) {
				return Promise.reject(new NotFoundError(`student (id: ${id})`));
			}
			return Promise.all([Promise.resolve(student), remove({ id })]);
		})
		.then(([student]) => {
			return Promise.resolve(student);
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

// FIXME: Add bulk delete (using transactions)

module.exports = {
	create,
	bulkCreate,
	getById,
	getByIds,
	getByEmail,
	getByEmails,
	setName,
	setEmail,
	setSuspension,
	deleteById,
	deleteByEmail
};
