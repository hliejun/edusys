const knex = require('knex');

const config = require('../../../knexfile');

const {
	MalformedResponseError,
	NotFoundError,
	UniqueConstraintError,
	handle
} = require('../../utils/errors');

const teachers = require('./teacher');
const students = require('./student');
const classes = require('./class');

const db = knex(config);

const PRECISION_TIMESTAMP = 6;

/* Creators */

const checkIfExist = ({ teacherId, studentId, classId }) =>
	db('registers')
		.where({
			teacher_id: teacherId,
			student_id: studentId,
			class_id: classId || null
		})
		.select()
		.then(result => {
			if (result && result.length > 0) {
				return Promise.reject(
					new UniqueConstraintError(
						'register',
						`teacher id: ${teacherId}, student id: ${studentId}, class id: ${classId ||
							null}`
					)
				);
			}
			return Promise.resolve(false);
		});

const create = ({ teacherId, studentId, classId }) =>
	checkIfExist({ teacherId, studentId, classId })
		.then(entryExists => {
			if (!entryExists) {
				return db('registers').insert({
					teacher_id: teacherId,
					student_id: studentId,
					class_id: classId || null
				});
			}
			return false;
		})
		.then(ids => {
			if (ids && ids.length === 1) {
				return Promise.resolve(ids[0]);
			}
			return Promise.reject(
				new MalformedResponseError('id of register created', ids)
			);
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
				classId == null
					? Promise.resolve(null)
					: classes.getById({ id: classId })
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

// TODO: Add non-strict transactable create

// TODO: Add bulk create (using transactions)

// TODO: Add non-strict bulk create

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
		.catch(error =>
			handle(error, `finding registers (student email: ${studentEmail})`)
		);

const getByClass = ({ classId }) =>
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
		.catch(error => handle(error, `finding registers (class id: ${classId})`));

/* Updaters */

const setTeacherId = ({ id, teacherId }) =>
	db('registers')
		.where({ id })
		.update({
			teacher_id: teacherId,
			updated_at: db.fn.now(PRECISION_TIMESTAMP)
		});

const setTeacherById = ({ id, teacherId }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return checkIfExist({
				teacherId,
				studentId: result['student_id'],
				classId: result['class_id']
			});
		})
		.then(() => teachers.getById({ id: teacherId }))
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

const setTeacherByEmail = ({ id, teacherEmail }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return Promise.all([
				Promise.resolve(result),
				teachers.getByEmail({ email: teacherEmail })
			]);
		})
		.then(([register, teacher]) => {
			if (teacher == null) {
				return Promise.reject(
					new NotFoundError(`teacher (email: ${teacherEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(teacher.id),
				checkIfExist({
					teacherId: teacher.id,
					studentId: register['student_id'],
					classId: register['class_id']
				})
			]);
		})
		.then(([teacherId]) => setTeacherId({ id, teacherId }))
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

const setStudentById = ({ id, studentId }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return checkIfExist({
				teacherId: result['teacher_id'],
				studentId,
				classId: result['class_id']
			});
		})
		.then(() => students.getById({ id: studentId }))
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

const setStudentByEmail = ({ id, studentEmail }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return Promise.all([
				Promise.resolve(result),
				students.getByEmail({ email: studentEmail })
			]);
		})
		.then(([register, student]) => {
			if (student == null) {
				return Promise.reject(
					new NotFoundError(`student (email: ${studentEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(student.id),
				checkIfExist({
					teacherId: register['teacher_id'],
					studentId: student.id,
					classId: register['class_id']
				})
			]);
		})
		.then(([studentId]) => setStudentId({ id, studentId }))
		.catch(error =>
			handle(
				error,
				`updating student of register (id: ${id}) to student (email: ${studentEmail})`
			)
		);

const setClass = ({ id, classId }) =>
	getById({ id })
		.then(result => {
			if (result == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return checkIfExist({
				teacherId: result['teacher_id'],
				studentId: result['student_id'],
				classId
			});
		})
		.then(() => classes.getById({ id: classId }))
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
		.then(result =>
			Promise.all([
				Promise.resolve(result || []),
				result == null || result.length === 0
					? Promise.resolve(false)
					: deleteByStudent({ studentId })
			])
		)
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
		.then(([studentId, result]) =>
			Promise.all([
				Promise.resolve(result || []),
				result == null || result.length === 0
					? Promise.resolve(false)
					: deleteByStudent({ studentId })
			])
		)
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
		.then(result =>
			Promise.all([
				Promise.resolve(result || []),
				result == null || result.length === 0
					? Promise.resolve(false)
					: db('registers')
						.where({ class_id: classId })
						.del()
			])
		)
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
	getByClass,
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
