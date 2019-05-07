const { db } = require('../knex');

const {
	MalformedResponseError,
	NotFoundError,
	UniqueConstraintError,
	handle
} = require('../../utils/errors');

const { getNameFromEmail } = require('../../utils/parser');

const {
	DEFAULT_STUDENT_NAME,
	ERROR_TYPES_EXT,
	PRECISION_TIMESTAMP,
	TABLE
} = require('../../constants');

// TODO: Scope select and first

/* Creators */

const create = ({ name, email }) =>
	db(TABLE.STUDENT)
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
			if (error.code === ERROR_TYPES_EXT.ER_DUP_ENTRY) {
				return Promise.reject(new UniqueConstraintError('email', email));
			}
			return handle(error, `creating student (name: ${name}, email: ${email})`);
		});

const createIfNotExists = ({ email, name }, transaction) => {
	const table = transaction || db;
	return table
		.from(TABLE.STUDENT)
		.where({ email })
		.first('id')
		.then(student => {
			if (student && student.id != null) {
				return Promise.resolve([student.id]);
			}
			return table
				.insert({
					email,
					name: name || getNameFromEmail(email) || DEFAULT_STUDENT_NAME
				})
				.into(TABLE.STUDENT);
		})
		.then(ids => {
			if (ids == null || ids.length === 0 || ids[0] == null) {
				return Promise.reject(new MalformedResponseError('id of student', ids));
			}
			return Promise.resolve(ids[0]);
		})
		.catch(error => {
			if (error.code === ERROR_TYPES_EXT.ER_DUP_ENTRY) {
				return table
					.from(TABLE.STUDENT)
					.where({ email })
					.first('id')
					.then(student => Promise.resolve(student.id));
			}
			return handle(error, `creating student (email: ${email})`);
		});
};

const bulkCreate = students =>
	db.transaction(transaction => {
		const creations = students.map(student =>
			transaction
				.insert({
					name: student.name,
					email: student.email
				})
				.into(TABLE.STUDENT)
				.then(ids => {
					if (ids && ids.length === 1) {
						return Promise.resolve(ids[0]);
					}
					return Promise.reject(
						new MalformedResponseError('id of student created', ids)
					);
				})
				.catch(error => {
					if (error.code === ERROR_TYPES_EXT.ER_DUP_ENTRY) {
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
	db(TABLE.STUDENT)
		.where({ id })
		.first()
		.catch(error => handle(error, `finding student (id: ${id})`));

const getByIds = ids =>
	db(TABLE.STUDENT)
		.whereIn('id', ids)
		.select()
		.catch(error => handle(error, `finding students (ids: ${ids})`));

const getByEmail = ({ email }, isStrict = false) =>
	db(TABLE.STUDENT)
		.where({ email })
		.first()
		.then(student => {
			if (isStrict && student == null) {
				return Promise.reject(new NotFoundError(`student (email: ${email})`));
			}
			return Promise.resolve(student);
		})
		.catch(error => handle(error, `finding student (email: ${email})`));

const getByEmails = emails =>
	db(TABLE.STUDENT)
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
			return db(TABLE.STUDENT)
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
			return db(TABLE.STUDENT)
				.where({ id })
				.update({ email, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error => {
			if (error.code === ERROR_TYPES_EXT.ER_DUP_ENTRY) {
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
			return db(TABLE.STUDENT)
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
	db(TABLE.STUDENT)
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
	createIfNotExists,
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
