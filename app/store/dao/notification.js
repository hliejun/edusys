const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	NotFoundError,
	handle
} = require('../../utils/errors');

const teachers = require('./teacher');

const db = knex(config);

const PRECISION_TIMESTAMP = 6;

// TODO: Refactor

/* Creators */

const create = ({ teacherId, title, content }) =>
	db('notifications')
		.insert({
			teacher_id: teacherId,
			title,
			content
		})
		.then(ids => {
			if (ids && ids.length === 1) {
				return Promise.resolve(ids[0]);
			}
			return Promise.reject(
				new MalformedResponseError('id of notification created', ids)
			);
		});

const createBySenderId = ({ teacherId, title, content }) =>
	teachers
		.getById({ id: teacherId })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return create({ teacherId, title, content });
		})
		.catch(error =>
			handle(
				error,
				`creating notification (teacher id: ${teacherId}, title: ${title}, content: ${content})`
			)
		);

const createBySenderEmail = ({ email, title, content }) =>
	teachers
		.getByEmail({ email })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (email: ${email})`));
			}
			return create({ teacherId: result.id, title, content });
		})
		.catch(error =>
			handle(
				error,
				`creating notification (email: ${email}, title: ${title}, content: ${content})`
			)
		);

/* Readers */

const getById = ({ id }) =>
	db('notifications')
		.where({ id })
		.first()
		.catch(error => handle(error, `finding notification (id: ${id})`));

// TODO: Add bulk read (using transactions)

/* Updaters */

const setTeacherId = ({ id, teacherId }) =>
	db('notifications')
		.where({ id })
		.update({
			teacher_id: teacherId,
			updated_at: db.fn.now(PRECISION_TIMESTAMP)
		});

const setSenderById = ({ id, teacherId }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`notification (id: ${id})`));
			}
			return teachers.getById({ id: teacherId });
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return setTeacherId({ id, teacherId });
		})
		.catch(error =>
			handle(
				error,
				`updating sender of notification (id: ${id}) to teacher (id: ${teacherId})`
			)
		);

const setSenderByEmail = ({ id, email }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`notification (id: ${id})`));
			}
			return teachers.getByEmail({ email });
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (email: ${email})`));
			}
			return setTeacherId({ id, teacherId: result.id });
		})
		.catch(error =>
			handle(
				error,
				`updating sender of notification (id: ${id}) to teacher (email: ${email})`
			)
		);

const setTitle = ({ id, title }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`notification (id: ${id})`));
			}
			return db('notifications')
				.where({ id })
				.update({ title, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error =>
			handle(error, `updating title of notification (id: ${id}) to ${title}`)
		);

const setContent = ({ id, content }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`notification (id: ${id})`));
			}
			return db('notifications')
				.where({ id })
				.update({ content, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error =>
			handle(
				error,
				`updating content of notification (id: ${id}) to ${content}`
			)
		);

/* Deletors */

const deleteById = ({ id }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`notification (id: ${id})`));
			}
			return Promise.all([
				Promise.resolve(result),
				db('notifications')
					.where({ id })
					.del()
			]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error => handle(error, `deleting notification (id: ${id})`));

// TODO: Use transactions for bulk delete

const selectByTeacher = ({ teacherId }) =>
	db('notifications')
		.where({ teacher_id: teacherId })
		.select();

const deleteByTeacher = ({ teacherId }) =>
	db('notifications')
		.where({ teacher_id: teacherId })
		.del();

const deleteBySenderId = ({ teacherId }) =>
	teachers
		.getById({ id: teacherId })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return selectByTeacher({ teacherId });
		})
		.then(result =>
			Promise.all([
				Promise.resolve(result || []),
				result == null || result.length === 0
					? Promise.resolve(false)
					: deleteByTeacher({ teacherId })
			])
		)
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error =>
			handle(error, `deleting notifications (sender id: ${teacherId})`)
		);

const deleteBySenderEmail = ({ email }) =>
	teachers
		.getByEmail({ email })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (email: ${email})`));
			}
			return Promise.all([
				Promise.resolve(result.id),
				selectByTeacher({ teacherId: result.id })
			]);
		})
		.then(([teacherId, result]) =>
			Promise.all([
				Promise.resolve(result || []),
				result == null || result.length === 0
					? Promise.resolve(false)
					: deleteByTeacher({ teacherId })
			])
		)
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error =>
			handle(error, `deleting notifications (sender email: ${email})`)
		);

module.exports = {
	createBySenderId,
	createBySenderEmail,
	getById,
	setSenderById,
	setSenderByEmail,
	setTitle,
	setContent,
	deleteById,
	deleteBySenderId,
	deleteBySenderEmail
};
