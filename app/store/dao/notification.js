const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	UnknownError,
	NotFoundError
} = require('../../utils/errors');

// TODO: Validation of inputs to be done in actions level using express-validator

const db = knex(config);

const PRECISION_TIMESTAMP = 6;

/* Creators */

// TODO: Validate title
// TODO: Validate content
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
			} else {
				return Promise.reject(
					new MalformedResponseError('id of the created notification row', ids)
				);
			}
		})
		.catch(error => {
			if (error.code === 'ER_MAL_RESPONSE') {
				return Promise.reject(error);
			}
			return Promise.reject(new UnknownError('creating a notification', error));
		});

const createBySenderId = ({ teacherId, title, content }) =>
	db('teachers')
		.where({ id: teacherId })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given id: ${teacherId}`)
				);
			}
			return create({ teacherId, title, content });
		});

const createBySenderEmail = ({ email, title, content }) =>
	db('teachers')
		.where({ email })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given email: ${email}`)
				);
			}
			return create({ teacherId: result.id, title, content });
		});

/* Readers */

const getById = ({ id }) =>
	db('notifications')
		.where({ id })
		.first()
		.catch(error => {
			return Promise.reject(
				new UnknownError(`finding a notification with id: ${id}`, error)
			);
		});

/* Updaters */

const setSenderById = ({ id, teacherId }) =>
	db('notifications')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`notification with the given id: ${id}`)
				);
			}
			return db('teachers')
				.where({ id: teacherId })
				.first();
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given id: ${teacherId}`)
				);
			}
			return db('notifications')
				.where({ id })
				.update({
					teacher_id: result.id,
					updated_at: db.fn.now(PRECISION_TIMESTAMP)
				});
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a notification of id: ${id} with sender (teacher_id): ${teacherId}`,
					error
				)
			);
		});

const setSenderByEmail = ({ id, email }) =>
	db('notifications')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`notification with the given id: ${id}`)
				);
			}
			return db('teachers')
				.where({ email })
				.first();
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given email: ${email}`)
				);
			}
			return db('notifications')
				.where({ id })
				.update({
					teacher_id: result.id,
					updated_at: db.fn.now(PRECISION_TIMESTAMP)
				});
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a notification of id: ${id} with sender (email): ${email}`,
					error
				)
			);
		});

// TODO: Validate title
const setTitle = ({ id, title }) =>
	db('notifications')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`notification with the given id: ${id}`)
				);
			}
			return db('notifications')
				.where({ id })
				.update({ title, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a notification of id: ${id} with title: ${title}`,
					error
				)
			);
		});

// TODO: Validate content
const setContent = ({ id, content }) =>
	db('notifications')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`notification with the given id: ${id}`)
				);
			}
			return db('notifications')
				.where({ id })
				.update({ content, updated_at: db.fn.now(PRECISION_TIMESTAMP) });
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a notification of id: ${id} with content: ${content}`,
					error
				)
			);
		});

/* Deletors */

const deleteById = ({ id }) =>
	db('notifications')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`notification with the given id: ${id}`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				db('notifications')
					.where({ id })
					.del()
			]);
		})
		.then(([result, removal]) => {
			return Promise.resolve(result);
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(`deleting a notification of id: ${id}`, error)
			);
		});

const deleteBySenderId = ({ teacherId }) =>
	db('teachers')
		.where({ id: teacherId })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given id: ${teacherId}`)
				);
			}
			return db('notifications')
				.where({ teacher_id: teacherId })
				.select();
		})
		.then(result => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(
						`notifications with the given sender (teacher_id): ${teacherId}`
					)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				db('notifications')
					.where({ teacher_id: teacherId })
					.del()
			]);
		})
		.then(([result, removal]) => {
			return Promise.resolve(result);
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`deleting notifications of sender (teacher_id): ${teacherId}`,
					error
				)
			);
		});

const deleteBySenderEmail = ({ email }) =>
	db('teachers')
		.where({ email })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given email: ${email}`)
				);
			}
			return Promise.all([
				Promise.resolve(result.id),
				db('notifications')
					.where({ teacher_id: result.id })
					.select()
			]);
		})
		.then(([teacherId, result]) => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(
						`notifications with the given sender (email): ${email}`
					)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				db('notifications')
					.where({ teacher_id: teacherId })
					.del()
			]);
		})
		.then(([result, removal]) => {
			return Promise.resolve(result);
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`deleting notifications of sender (email): ${email}`,
					error
				)
			);
		});

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
