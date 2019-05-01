// NOTE: Prevent repeated values by checking always

const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	UnknownError,
	NotFoundError
} = require('../../utils/errors');

const db = knex(config);

const PRECISION_TIMESTAMP = 6;

/* Creators */

const create = ({ teacherId, studentId, classId }) =>
	db('registers')
		.insert({
			teacher_id: teacherId,
			student_id: studentId,
			class_id: classId || null
		})
		.then(ids => {
			if (ids && ids.length === 1) {
				return Promise.resolve(ids[0]);
			} else {
				return Promise.reject(
					new MalformedResponseError('id of the created register row', ids)
				);
			}
		});

const createById = ({ teacherId, studentId, classId }) =>
	db('teachers')
		.where({ id: teacherId })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given id: ${teacherId}`)
				);
			}
			return db('students')
				.where({ id: studentId })
				.first();
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given id: ${studentId}`)
				);
			}
			return db('classes')
				.where({ id: classId })
				.first();
		})
		.then(result => {
			if (classId != null && result == null) {
				return Promise.reject(
					new NotFoundError(`class with the given id: ${classId}`)
				);
			}
			return create({ teacherId, studentId, classId });
		})
		.catch(error => {
			if (error.code === 'ER_MAL_RESPONSE' || error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`creating a register with teacher_id: ${teacherId}, student_id: ${studentId} and class_id: ${classId}`,
					error
				)
			);
		});

const createByEmail = ({ teacherEmail, studentEmail, classId }) =>
	db('teachers')
		.where({ email: teacherEmail })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given email: ${teacherEmail}`)
				);
			}
			return Promise.all([
				Promise.resolve(result.id),
				db('students')
					.where({ email: studentEmail })
					.first()
			]);
		})
		.then(([teacherId, result]) => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given email: ${studentEmail}`)
				);
			}
			return Promise.all([
				Promise.resolve(teacherId),
				Promise.resolve(result.id),
				db('classes')
					.where({ id: classId })
					.first()
			]);
		})
		.then(([teacherId, studentId, result]) => {
			if (classId != null && result == null) {
				return Promise.reject(
					new NotFoundError(`class with the given id: ${classId}`)
				);
			}
			return create({ teacherId, studentId, classId });
		})
		.catch(error => {
			if (error.code === 'ER_MAL_RESPONSE' || error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`creating a register with teacher email: ${teacherEmail}, student email: ${studentEmail} and class_id: ${classId}`,
					error
				)
			);
		});

/* Readers */

const getById = ({ id }) =>
	db('registers')
		.where({ id })
		.first()
		.catch(error => {
			return Promise.reject(
				new UnknownError(`finding a register with id: ${id}`, error)
			);
		});

const getByTeacherId = ({ teacherId }) =>
	db('teachers')
		.where({ id: teacherId })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given id: ${teacherId}`)
				);
			}
			return db('registers')
				.where({ teacher_id: teacherId })
				.select();
		})
		.then(result => {
			if (!result || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`registers with the given teacher id: ${teacherId}`)
				);
			}
			return Promise.resolve(result);
		})
		.catch(error => {
			return Promise.reject(
				new UnknownError(
					`finding registers with teacher id: ${teacherId}`,
					error
				)
			);
		});

const getByTeacherEmail = ({ teacherEmail }) =>
	db('teachers')
		.where({ email: teacherEmail })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given email: ${teacherEmail}`)
				);
			}
			return db('registers')
				.where({ teacher_id: result.id })
				.select();
		})
		.then(result => {
			if (!result || result.length === 0) {
				return Promise.reject(
					new NotFoundError(
						`registers with the given teacher email: ${teacherEmail}`
					)
				);
			}
			return Promise.resolve(result);
		})
		.catch(error => {
			return Promise.reject(
				new UnknownError(
					`finding registers with teacher email: ${teacherEmail}`,
					error
				)
			);
		});

const getByStudentId = ({ studentId }) =>
	db('students')
		.where({ id: studentId })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given id: ${studentId}`)
				);
			}
			return db('registers')
				.where({ student_id: studentId })
				.select();
		})
		.then(result => {
			if (!result || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`registers with the given student id: ${studentId}`)
				);
			}
			return Promise.resolve(result);
		})
		.catch(error => {
			return Promise.reject(
				new UnknownError(
					`finding registers with student id: ${studentId}`,
					error
				)
			);
		});

const getByStudentEmail = ({ studentEmail }) =>
	db('students')
		.where({ email: studentEmail })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given email: ${studentEmail}`)
				);
			}
			return db('registers')
				.where({ student_id: result.id })
				.select();
		})
		.then(result => {
			if (!result || result.length === 0) {
				return Promise.reject(
					new NotFoundError(
						`registers with the given student email: ${studentEmail}`
					)
				);
			}
			return Promise.resolve(result);
		})
		.catch(error => {
			return Promise.reject(
				new UnknownError(
					`finding registers with student email: ${studentEmail}`,
					error
				)
			);
		});

const getByClassId = ({ classId }) =>
	db('classes')
		.where({ id: classId })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`class with the given id: ${classId}`)
				);
			}
			return db('registers')
				.where({ class_id: classId })
				.select();
		})
		.then(result => {
			if (!result || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`registers with the given class id: ${classId}`)
				);
			}
			return Promise.resolve(result);
		})
		.catch(error => {
			return Promise.reject(
				new UnknownError(`finding registers with class id: ${classId}`, error)
			);
		});

/* Updaters */

const setTeacherById = ({ id, teacherId }) =>
	db('registers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`register with the given id: ${id}`)
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
			return db('registers')
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
					`updating a register of id: ${id} with teacher id: ${teacherId}`,
					error
				)
			);
		});

const setTeacherByEmail = ({ id, email }) =>
	db('registers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`register with the given id: ${id}`)
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
			return db('registers')
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
					`updating a register of id: ${id} with teacher email: ${email}`,
					error
				)
			);
		});

const setStudentById = ({ id, studentId }) =>
	db('registers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`register with the given id: ${id}`)
				);
			}
			return db('students')
				.where({ id: studentId })
				.first();
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given id: ${studentId}`)
				);
			}
			return db('registers')
				.where({ id })
				.update({
					student_id: result.id,
					updated_at: db.fn.now(PRECISION_TIMESTAMP)
				});
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a register of id: ${id} with student id: ${studentId}`,
					error
				)
			);
		});

const setStudentByEmail = ({ id, email }) =>
	db('registers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`register with the given id: ${id}`)
				);
			}
			return db('students')
				.where({ email })
				.first();
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given email: ${email}`)
				);
			}
			return db('registers')
				.where({ id })
				.update({
					student_id: result.id,
					updated_at: db.fn.now(PRECISION_TIMESTAMP)
				});
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a register of id: ${id} with student email: ${email}`,
					error
				)
			);
		});

const setClass = ({ id, classId }) =>
	db('registers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`register with the given id: ${id}`)
				);
			}
			return db('classes')
				.where({ id: classId })
				.first();
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`class with the given id: ${classId}`)
				);
			}
			return db('registers')
				.where({ id })
				.update({
					class_id: result.id,
					updated_at: db.fn.now(PRECISION_TIMESTAMP)
				});
		})
		.catch(error => {
			if (error.code === 'ER_NOT_FOUND') {
				return Promise.reject(error);
			}
			return Promise.reject(
				new UnknownError(
					`updating a register of id: ${id} with class id: ${classId}`,
					error
				)
			);
		});

/* Deletors */

const deleteById = ({ id }) =>
	db('registers')
		.where({ id })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`register with the given id: ${id}`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				db('registers')
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
				new UnknownError(`deleting a register of id: ${id}`, error)
			);
		});

const deleteByTeacherId = ({ teacherId }) =>
	db('teachers')
		.where({ id: teacherId })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher with the given id: ${teacherId}`)
				);
			}
			return db('registers')
				.where({ teacher_id: teacherId })
				.select();
		})
		.then(result => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`registers with the given teacher id: ${teacherId}`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				db('registers')
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
					`deleting registers of teacher id: ${teacherId}`,
					error
				)
			);
		});

const deleteByTeacherEmail = ({ email }) =>
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
				db('registers')
					.where({ teacher_id: result.id })
					.select()
			]);
		})
		.then(([teacherId, result]) => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`registers with the given teacher email: ${email}`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				db('registers')
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
				new UnknownError(`deleting registers of teacher email: ${email}`, error)
			);
		});

const deleteByStudentId = ({ studentId }) =>
	db('students')
		.where({ id: studentId })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given id: ${studentId}`)
				);
			}
			return db('registers')
				.where({ student_id: studentId })
				.select();
		})
		.then(result => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`registers with the given student id: ${studentId}`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				db('registers')
					.where({ student_id: studentId })
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
					`deleting registers of student id: ${studentId}`,
					error
				)
			);
		});

const deleteByStudentEmail = ({ email }) =>
	db('students')
		.where({ email })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student with the given email: ${email}`)
				);
			}
			return Promise.all([
				Promise.resolve(result.id),
				db('registers')
					.where({ student_id: result.id })
					.select()
			]);
		})
		.then(([studentId, result]) => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`registers with the given student email: ${email}`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				db('registers')
					.where({ student_id: studentId })
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
				new UnknownError(`deleting registers of student email: ${email}`, error)
			);
		});

const deleteByClass = ({ classId }) =>
	db('classes')
		.where({ id: classId })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`class with the given id: ${classId}`)
				);
			}
			return db('registers')
				.where({ class_id: classId })
				.select();
		})
		.then(result => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`registers with the given class id: ${classId}`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				db('registers')
					.where({ class_id: classId })
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
				new UnknownError(`deleting registers of class id: ${classId}`, error)
			);
		});

/* Cross Table Actions */

// get teachers by student
// get teachers by class

// get students by class
// get students by teacher

// get classes by teacher
// get classes by student

// get common students by teachers

module.exports = {
	createById,
	createByEmail,
	getById,
	getByTeacherId,
	getByTeacherEmail,
	getByStudentId,
	getByStudentEmail,
	getByClassId,
	setTeacherById,
	setTeacherByEmail,
	setStudentById,
	setStudentByEmail,
	setClass,
	deleteById,
	deleteByTeacherId,
	deleteByTeacherEmail,
	deleteByStudentId,
	deleteByStudentEmail,
	deleteByClass
};
