const { db } = require('../knex');

const {
	MalformedResponseError,
	NotFoundError,
	handle
} = require('../../utils/errors');

const teacherDAO = require('./teacher');

const { PRECISION_TIMESTAMP, TABLE } = require('../../constants');

// TODO: Scope select and first

/* Creators */

const create = ({ teacherId, title, content }) =>
	db(TABLE.NOTIFICATION)
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
	teacherDAO
		.getById({ id: teacherId })
		.then(teacher => {
			if (teacher == null) {
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
	teacherDAO
		.getByEmail({ email })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (email: ${email})`));
			}
			return create({ teacherId: teacher.id, title, content });
		})
		.catch(error =>
			handle(
				error,
				`creating notification (email: ${email}, title: ${title}, content: ${content})`
			)
		);

/* Readers */

const getById = ({ id }) =>
	db(TABLE.NOTIFICATION)
		.where({ id })
		.first()
		.catch(error => handle(error, `finding notification (id: ${id})`));

// FIXME: Add bulk read (using transactions)

/* Updaters */

const setTeacherId = ({ id, teacherId }) =>
	db(TABLE.NOTIFICATION)
		.where({ id })
		.update({
			teacher_id: teacherId,
			updated_at: db.fn.now(PRECISION_TIMESTAMP)
		});

const setSenderById = ({ id, teacherId }) =>
	getById({ id })
		.then(notification => {
			if (notification == null) {
				return Promise.reject(new NotFoundError(`notification (id: ${id})`));
			}
			return teacherDAO.getById({ id: teacherId });
		})
		.then(teacher => {
			if (teacher == null) {
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
		.then(notification => {
			if (notification == null) {
				return Promise.reject(new NotFoundError(`notification (id: ${id})`));
			}
			return teacherDAO.getByEmail({ email });
		})
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (email: ${email})`));
			}
			return setTeacherId({ id, teacherId: teacher.id });
		})
		.catch(error =>
			handle(
				error,
				`updating sender of notification (id: ${id}) to teacher (email: ${email})`
			)
		);

const setTitle = ({ id, title }) =>
	getById({ id })
		.then(notification => {
			if (notification == null) {
				return Promise.reject(new NotFoundError(`notification (id: ${id})`));
			}
			return db(TABLE.NOTIFICATION)
				.where({ id })
				.update({ title, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error =>
			handle(error, `updating title of notification (id: ${id}) to ${title}`)
		);

const setContent = ({ id, content }) =>
	getById({ id })
		.then(notification => {
			if (notification == null) {
				return Promise.reject(new NotFoundError(`notification (id: ${id})`));
			}
			return db(TABLE.NOTIFICATION)
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
		.then(notification => {
			if (notification == null) {
				return Promise.reject(new NotFoundError(`notification (id: ${id})`));
			}
			return Promise.all([
				Promise.resolve(notification),
				db(TABLE.NOTIFICATION)
					.where({ id })
					.del()
			]);
		})
		.then(([notification]) => {
			return Promise.resolve(notification);
		})
		.catch(error => handle(error, `deleting notification (id: ${id})`));

const selectByTeacher = ({ teacherId }) =>
	db(TABLE.NOTIFICATION)
		.where({ teacher_id: teacherId })
		.select();

const deleteByTeacher = ({ teacherId }) =>
	db(TABLE.NOTIFICATION)
		.where({ teacher_id: teacherId })
		.del();

const deleteBySenderId = ({ teacherId }) =>
	teacherDAO
		.getById({ id: teacherId })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return selectByTeacher({ teacherId });
		})
		.then(notifications =>
			Promise.all([
				Promise.resolve(notifications || []),
				notifications == null || notifications.length === 0
					? Promise.resolve(false)
					: deleteByTeacher({ teacherId })
			])
		)
		.then(([notifications]) => {
			return Promise.resolve(notifications);
		})
		.catch(error =>
			handle(error, `deleting notifications (sender id: ${teacherId})`)
		);

const deleteBySenderEmail = ({ email }) =>
	teacherDAO
		.getByEmail({ email })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (email: ${email})`));
			}
			return Promise.all([
				Promise.resolve(teacher.id),
				selectByTeacher({ teacherId: teacher.id })
			]);
		})
		.then(([teacherId, notifications]) =>
			Promise.all([
				Promise.resolve(notifications || []),
				notifications == null || notifications.length === 0
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
