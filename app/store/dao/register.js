const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	NotFoundError,
	handle
} = require('../../utils/errors');

const teachers = require('./teacher');
const students = require('./student');
const classes = require('./class');

const db = knex(config);

const PRECISION_TIMESTAMP = 6;

/* Creators */

// TODO: Check for existing identical entry first
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
					new MalformedResponseError('id of register created', ids)
				);
			}
		});

const createById = ({ teacherId, studentId, classId }) =>
	teachers
		.getById({ id: teacherId })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return students.getById({ id: studentId });
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`student (id: ${studentId})`));
			}
			return classId == null
				? Promise.resolve(null)
				: classes.getById({ id: classId });
		})
		.then(result => {
			if (classId != null && result == null) {
				return Promise.reject(new NotFoundError(`class (id: ${classId})`));
			}
			return create({ teacherId, studentId, classId });
		})
		.catch(error =>
			handle(
				error,
				`creating register (teacher id: ${teacherId}, student id: ${studentId}, class id: ${classId})`
			)
		);

const createByEmail = ({ teacherEmail, studentEmail, classId }) =>
	teachers
		.getByEmail({ email: teacherEmail })
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher (email: ${teacherEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(result.id),
				students.getByEmail({ email: studentEmail })
			]);
		})
		.then(([teacherId, result]) => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student (email: ${studentEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(teacherId),
				Promise.resolve(result.id),
				classes.getById({ id: classId })
			]);
		})
		.then(([teacherId, studentId, result]) => {
			if (classId != null && result == null) {
				return Promise.reject(new NotFoundError(`class (id: ${classId})`));
			}
			return create({ teacherId, studentId, classId });
		})
		.catch(error =>
			handle(
				error,
				`creating register (teacher email: ${teacherEmail}, student email: ${studentEmail}, class id: ${classId})`
			)
		);

// TODO: Add bulk create (using transactions)

/* Readers */

const getById = ({ id }) =>
	db('registers')
		.where({ id })
		.first()
		.catch(error => handle(error, `finding register (id: ${id})`));

const selectByTeacherId = ({ teacherId }) =>
	db('registers')
		.where({ teacher_id: teacherId })
		.select();

const getByTeacherId = ({ teacherId }) =>
	db('teachers')
		.where({ id: teacherId })
		.first()
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return selectByTeacherId({ teacherId });
		})
		.then(result => {
			if (!result || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`register (teacher id: ${teacherId})`)
				);
			}
			return Promise.resolve(result);
		})
		.catch(error =>
			handle(error, `finding registers (teacher id: ${teacherId})`)
		);

const getByTeacherEmail = ({ teacherEmail }) =>
	teachers
		.getByEmail({ email: teacherEmail })
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher (email: ${teacherEmail})`)
				);
			}
			return selectByTeacherId({ teacherId: result.id });
		})
		.then(result => {
			if (!result || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`register (teacher email: ${teacherEmail})`)
				);
			}
			return Promise.resolve(result);
		})
		.catch(error =>
			handle(error, `finding registers (teacher email: ${teacherEmail})`)
		);

const selectByStudentId = ({ studentId }) =>
	db('registers')
		.where({ student_id: studentId })
		.select();

const getByStudentId = ({ studentId }) =>
	students
		.getById({ id: studentId })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`student (id: ${studentId})`));
			}
			return selectByStudentId({ studentId });
		})
		.then(result => {
			if (!result || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`register (student id: ${studentId})`)
				);
			}
			return Promise.resolve(result);
		})
		.catch(error =>
			handle(error, `finding registers (student id: ${studentId})`)
		);

const getByStudentEmail = ({ studentEmail }) =>
	students
		.getByEmail({ email: studentEmail })
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student (email: ${studentEmail})`)
				);
			}
			return selectByStudentId({ studentId: result.id });
		})
		.then(result => {
			if (!result || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`register (student email: ${studentEmail})`)
				);
			}
			return Promise.resolve(result);
		})
		.catch(error =>
			handle(error, `finding registers (student email: ${studentEmail})`)
		);

const getByClassId = ({ classId }) =>
	classes
		.getById({ id: classId })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`class (id: ${classId})`));
			}
			return db('registers')
				.where({ class_id: classId })
				.select();
		})
		.then(result => {
			if (!result || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`register (class id: ${classId})`)
				);
			}
			return Promise.resolve(result);
		})
		.catch(error => handle(error, `finding registers (class id: ${classId})`));

/* Updaters */

const setTeacherId = ({ id, teacherId }) =>
	db('registers')
		.where({ id })
		.update({
			teacher_id: teacherId,
			updated_at: db.fn.now(PRECISION_TIMESTAMP)
		});

// TODO: Check for existing identical entry first
const setTeacherById = ({ id, teacherId }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
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
				`updating teacher of register (id: ${id}) to teacher (id: ${teacherId})`
			)
		);

// TODO: Check for existing identical entry first
const setTeacherByEmail = ({ id, teacherEmail }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return teachers.getByEmail({ email: teacherEmail });
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher (email: ${teacherEmail})`)
				);
			}
			return setTeacherId({ id, teacherId: result.id });
		})
		.catch(error =>
			handle(
				error,
				`updating teacher of register (id: ${id}) to teacher (email: ${teacherEmail})`
			)
		);

const setStudentId = ({ id, studentId }) =>
	db('registers')
		.where({ id })
		.update({
			student_id: studentId,
			updated_at: db.fn.now(PRECISION_TIMESTAMP)
		});

// TODO: Check for existing identical entry first
const setStudentById = ({ id, studentId }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return students.getById({ id: studentId });
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`student (id: ${studentId})`));
			}
			return setStudentId({ id, studentId });
		})
		.catch(error =>
			handle(
				error,
				`updating student of register (id: ${id}) to student (id: ${studentId})`
			)
		);

// TODO: Check for existing identical entry first
const setStudentByEmail = ({ id, studentEmail }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return students.getByEmail({ email: studentEmail });
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student (email: ${studentEmail})`)
				);
			}
			return setStudentId({ id, studentId: result.id });
		})
		.catch(error =>
			handle(
				error,
				`updating student of register (id: ${id}) to student (email: ${studentEmail})`
			)
		);

// TODO: Check for existing identical entry first
const setClass = ({ id, classId }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return classes.getById({ id: classId });
		})
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`class (id: ${classId})`));
			}
			return db('registers')
				.where({ id })
				.update({
					class_id: result.id,
					updated_at: db.fn.now(PRECISION_TIMESTAMP)
				});
		})
		.catch(error =>
			handle(
				error,
				`updating class of register (id: ${id}) to class (id: ${classId})`
			)
		);

/* Deletors */

const deleteById = ({ id }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return Promise.all([
				Promise.resolve(result),
				db('registers')
					.where({ id })
					.del()
			]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error => handle(error, `deleting register (id: ${id})`));

// TODO: Use transactions for bulk delete

const deleteByTeacher = ({ teacherId }) =>
	db('registers')
		.where({ teacher_id: teacherId })
		.del();

const deleteByTeacherId = ({ teacherId }) =>
	teachers
		.getById({ id: teacherId })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return selectByTeacherId({ teacherId });
		})
		.then(result => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`registers (teacher id: ${teacherId})`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				deleteByTeacher({ teacherId })
			]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error =>
			handle(error, `deleting registers (teacher id: ${teacherId})`)
		);

const deleteByTeacherEmail = ({ teacherEmail }) =>
	teachers
		.getByEmail({ email: teacherEmail })
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`teacher (email: ${teacherEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(result.id),
				selectByTeacherId({ teacherId: result.id })
			]);
		})
		.then(([teacherId, result]) => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`register (teacher email: ${teacherEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				deleteByTeacher({ teacherId })
			]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error =>
			handle(error, `deleting registers (teacher email: ${teacherEmail})`)
		);

const deleteByStudent = ({ studentId }) =>
	db('registers')
		.where({ student_id: studentId })
		.del();

const deleteByStudentId = ({ studentId }) =>
	students
		.getById({ id: studentId })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`student (id: ${studentId})`));
			}
			return selectByStudentId({ studentId });
		})
		.then(result => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`register (student id: ${studentId})`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				deleteByStudent({ studentId })
			]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error =>
			handle(error, `deleting registers (student id: ${studentId})`)
		);

const deleteByStudentEmail = ({ studentEmail }) =>
	students
		.getByEmail({ email: studentEmail })
		.then(result => {
			if (result == null) {
				return Promise.reject(
					new NotFoundError(`student (email: ${studentEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(result.id),
				selectByStudentId({ studentId: result.id })
			]);
		})
		.then(([studentId, result]) => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`register (student email: ${studentEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				deleteByStudent({ studentId })
			]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error =>
			handle(error, `deleting registers (student email: ${studentEmail})`)
		);

const deleteByClass = ({ classId }) =>
	classes
		.getById({ id: classId })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`class (id: ${classId})`));
			}
			return db('registers')
				.where({ class_id: classId })
				.select();
		})
		.then(result => {
			if (result == null || result.length === 0) {
				return Promise.reject(
					new NotFoundError(`register (class id: ${classId})`)
				);
			}
			return Promise.all([
				Promise.resolve(result),
				db('registers')
					.where({ class_id: classId })
					.del()
			]);
		})
		.then(([result]) => {
			return Promise.resolve(result);
		})
		.catch(error => handle(error, `deleting registers (class id: ${classId})`));

/* Auxillary Actions */

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
