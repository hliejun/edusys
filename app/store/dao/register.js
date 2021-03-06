const { db } = require('../knex');

const {
	MalformedResponseError,
	NotFoundError,
	UniqueConstraintError,
	handle
} = require('../../utils/errors');

const classDAO = require('./class');
const studentDAO = require('./student');
const teacherDAO = require('./teacher');

const {
	ERROR_TYPES_EXT,
	PRECISION_TIMESTAMP,
	TABLE
} = require('../../constants');

// TODO: Scope select and first

/* Creators */

const selectByIds = ({ teacherId, studentId, classId }) =>
	db(TABLE.REGISTER)
		.where({
			teacher_id: teacherId,
			student_id: studentId,
			class_id: classId || null
		})
		.first();

const checkIfExist = ({ teacherId, studentId, classId }) =>
	selectByIds({ teacherId, studentId, classId }).then(register => {
		if (register != null) {
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
				return db(TABLE.REGISTER).insert({
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
	teacherDAO
		.getById({ id: teacherId })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return studentDAO.getById({ id: studentId });
		})
		.then(student => {
			if (student == null) {
				return Promise.reject(new NotFoundError(`student (id: ${studentId})`));
			}
			return classId == null
				? Promise.resolve(null)
				: classDAO.getById({ id: classId });
		})
		.then(classroom => {
			if (classId != null && classroom == null) {
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
	teacherDAO
		.getByEmail({ email: teacherEmail })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(
					new NotFoundError(`teacher (email: ${teacherEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(teacher.id),
				studentDAO.getByEmail({ email: studentEmail })
			]);
		})
		.then(([teacherId, student]) => {
			if (student == null) {
				return Promise.reject(
					new NotFoundError(`student (email: ${studentEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(teacherId),
				Promise.resolve(student.id),
				classId == null
					? Promise.resolve(null)
					: classDAO.getById({ id: classId })
			]);
		})
		.then(([teacherId, studentId, classroom]) => {
			if (classId != null && classroom == null) {
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

const createIfNotExists = ({ teacherId, studentId, classId }, transaction) => {
	const table = transaction || db;
	return table
		.from(TABLE.TEACHER)
		.where({ id: teacherId })
		.first('id')
		.then(teacher => {
			if (!teacher || teacher.id == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return table
				.from(TABLE.STUDENT)
				.where({ id: studentId })
				.first('id');
		})
		.then(student => {
			if (!student || student.id == null) {
				return Promise.reject(new NotFoundError(`student (id: ${studentId})`));
			}
			return classId == null
				? Promise.resolve()
				: table
					.from(TABLE.CLASS)
					.where({ id: classId })
					.first('id');
		})
		.then(classroom => {
			if (classId != null && (!classroom || classroom.id == null)) {
				return Promise.reject(new NotFoundError(`class (id: ${classId})`));
			}
			return table
				.from(TABLE.REGISTER)
				.where({
					teacher_id: teacherId,
					student_id: studentId,
					class_id: classId || null
				})
				.first('id');
		})
		.then(register => {
			if (register && register.id != null) {
				return Promise.resolve([register.id]);
			}
			return table
				.insert({
					teacher_id: teacherId,
					student_id: studentId,
					class_id: classId || null
				})
				.into(TABLE.REGISTER);
		})
		.then(ids => {
			if (ids == null || ids.length === 0 || ids[0] == null) {
				return Promise.reject(
					new MalformedResponseError('id of register', ids)
				);
			}
			return Promise.resolve(ids[0]);
		})
		.catch(error => {
			if (error.code === ERROR_TYPES_EXT.ER_DUP_ENTRY) {
				return table
					.from(TABLE.REGISTER)
					.where({
						teacher_id: teacherId,
						student_id: studentId,
						class_id: classId || null
					})
					.first('id')
					.then(register => Promise.resolve(register.id));
			}
			return handle(
				error,
				`creating register (teacher id: ${teacherId}, student id: ${studentId}, class id: ${classId})`
			);
		});
};

/* Readers */

const getById = ({ id }) =>
	db(TABLE.REGISTER)
		.where({ id })
		.first()
		.catch(error => handle(error, `finding register (id: ${id})`));

const getByIds = ids =>
	db(TABLE.REGISTER)
		.whereIn('id', ids)
		.select()
		.catch(error => handle(error, `finding registers (ids: ${ids})`));

const selectByTeacherId = ({ teacherId }) =>
	db(TABLE.REGISTER)
		.where({ teacher_id: teacherId })
		.select();

const getByTeacherId = ({ teacherId }) =>
	teacherDAO
		.getById({ id: teacherId })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return selectByTeacherId({ teacherId });
		})
		.catch(error =>
			handle(error, `finding registers (teacher id: ${teacherId})`)
		);

const getByTeacherEmail = ({ teacherEmail }) =>
	teacherDAO
		.getByEmail({ email: teacherEmail })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(
					new NotFoundError(`teacher (email: ${teacherEmail})`)
				);
			}
			return selectByTeacherId({ teacherId: teacher.id });
		})
		.catch(error =>
			handle(error, `finding registers (teacher email: ${teacherEmail})`)
		);

const selectByStudentId = ({ studentId }) =>
	db(TABLE.REGISTER)
		.where({ student_id: studentId })
		.select();

const getByStudentId = ({ studentId }) =>
	studentDAO
		.getById({ id: studentId })
		.then(student => {
			if (student == null) {
				return Promise.reject(new NotFoundError(`student (id: ${studentId})`));
			}
			return selectByStudentId({ studentId });
		})
		.catch(error =>
			handle(error, `finding registers (student id: ${studentId})`)
		);

const getByStudentEmail = ({ studentEmail }) =>
	studentDAO
		.getByEmail({ email: studentEmail })
		.then(student => {
			if (student == null) {
				return Promise.reject(
					new NotFoundError(`student (email: ${studentEmail})`)
				);
			}
			return selectByStudentId({ studentId: student.id });
		})
		.catch(error =>
			handle(error, `finding registers (student email: ${studentEmail})`)
		);

const getByClass = ({ classId }) =>
	classDAO
		.getById({ id: classId })
		.then(classroom => {
			if (classroom == null) {
				return Promise.reject(new NotFoundError(`class (id: ${classId})`));
			}
			return db(TABLE.REGISTER)
				.where({ class_id: classId })
				.select();
		})
		.catch(error => handle(error, `finding registers (class id: ${classId})`));

/* Updaters */

const setTeacherId = ({ id, teacherId }) =>
	db(TABLE.REGISTER)
		.where({ id })
		.update({
			teacher_id: teacherId,
			updated_at: db.fn.now(PRECISION_TIMESTAMP)
		});

const setTeacherById = ({ id, teacherId }) =>
	getById({ id })
		.then(register => {
			if (register == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return checkIfExist({
				teacherId,
				studentId: register['student_id'],
				classId: register['class_id']
			});
		})
		.then(() => teacherDAO.getById({ id: teacherId }))
		.then(teacher => {
			if (teacher == null) {
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
		.then(register => {
			if (register == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return Promise.all([
				Promise.resolve(register),
				teacherDAO.getByEmail({ email: teacherEmail })
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
	db(TABLE.REGISTER)
		.where({ id })
		.update({
			student_id: studentId,
			updated_at: db.fn.now(PRECISION_TIMESTAMP)
		});

const setStudentById = ({ id, studentId }) =>
	getById({ id })
		.then(register => {
			if (register == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return checkIfExist({
				teacherId: register['teacher_id'],
				studentId,
				classId: register['class_id']
			});
		})
		.then(() => studentDAO.getById({ id: studentId }))
		.then(student => {
			if (student == null) {
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
		.then(register => {
			if (register == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return Promise.all([
				Promise.resolve(register),
				studentDAO.getByEmail({ email: studentEmail })
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
		.then(register => {
			if (register == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return checkIfExist({
				teacherId: register['teacher_id'],
				studentId: register['student_id'],
				classId
			});
		})
		.then(() => classDAO.getById({ id: classId }))
		.then(classroom => {
			if (classroom == null) {
				return Promise.reject(new NotFoundError(`class (id: ${classId})`));
			}
			return db(TABLE.REGISTER)
				.where({ id })
				.update({
					class_id: classroom.id,
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
		.then(register => {
			if (register == null) {
				return Promise.reject(new NotFoundError(`register (id: ${id})`));
			}
			return Promise.all([
				Promise.resolve(register),
				db(TABLE.REGISTER)
					.where({ id })
					.del()
			]);
		})
		.then(([register]) => {
			return Promise.resolve(register);
		})
		.catch(error => handle(error, `deleting register (id: ${id})`));

const deleteByTeacher = ({ teacherId }) =>
	db(TABLE.REGISTER)
		.where({ teacher_id: teacherId })
		.del();

const deleteByTeacherId = ({ teacherId }) =>
	teacherDAO
		.getById({ id: teacherId })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return selectByTeacherId({ teacherId });
		})
		.then(registers =>
			Promise.all([
				Promise.resolve(registers || []),
				registers == null || registers.length === 0
					? Promise.resolve(false)
					: deleteByTeacher({ teacherId })
			])
		)
		.then(([registers]) => {
			return Promise.resolve(registers);
		})
		.catch(error =>
			handle(error, `deleting registers (teacher id: ${teacherId})`)
		);

const deleteByTeacherEmail = ({ teacherEmail }) =>
	teacherDAO
		.getByEmail({ email: teacherEmail })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(
					new NotFoundError(`teacher (email: ${teacherEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(teacher.id),
				selectByTeacherId({ teacherId: teacher.id })
			]);
		})
		.then(([teacherId, registers]) =>
			Promise.all([
				Promise.resolve(registers || []),
				registers == null || registers.length === 0
					? Promise.resolve(false)
					: deleteByTeacher({ teacherId })
			])
		)
		.then(([registers]) => {
			return Promise.resolve(registers);
		})
		.catch(error =>
			handle(error, `deleting registers (teacher email: ${teacherEmail})`)
		);

const deleteByStudent = ({ studentId }) =>
	db(TABLE.REGISTER)
		.where({ student_id: studentId })
		.del();

const deleteByStudentId = ({ studentId }) =>
	studentDAO
		.getById({ id: studentId })
		.then(student => {
			if (student == null) {
				return Promise.reject(new NotFoundError(`student (id: ${studentId})`));
			}
			return selectByStudentId({ studentId });
		})
		.then(registers =>
			Promise.all([
				Promise.resolve(registers || []),
				registers == null || registers.length === 0
					? Promise.resolve(false)
					: deleteByStudent({ studentId })
			])
		)
		.then(([registers]) => {
			return Promise.resolve(registers);
		})
		.catch(error =>
			handle(error, `deleting registers (student id: ${studentId})`)
		);

const deleteByStudentEmail = ({ studentEmail }) =>
	studentDAO
		.getByEmail({ email: studentEmail })
		.then(student => {
			if (student == null) {
				return Promise.reject(
					new NotFoundError(`student (email: ${studentEmail})`)
				);
			}
			return Promise.all([
				Promise.resolve(student.id),
				selectByStudentId({ studentId: student.id })
			]);
		})
		.then(([studentId, registers]) =>
			Promise.all([
				Promise.resolve(registers || []),
				registers == null || registers.length === 0
					? Promise.resolve(false)
					: deleteByStudent({ studentId })
			])
		)
		.then(([registers]) => {
			return Promise.resolve(registers);
		})
		.catch(error =>
			handle(error, `deleting registers (student email: ${studentEmail})`)
		);

const deleteByClass = ({ classId }) =>
	classDAO
		.getById({ id: classId })
		.then(classroom => {
			if (classroom == null) {
				return Promise.reject(new NotFoundError(`class (id: ${classId})`));
			}
			return db(TABLE.REGISTER)
				.where({ class_id: classId })
				.select();
		})
		.then(registers =>
			Promise.all([
				Promise.resolve(registers || []),
				registers == null || registers.length === 0
					? Promise.resolve(false)
					: db(TABLE.REGISTER)
						.where({ class_id: classId })
						.del()
			])
		)
		.then(([registers]) => {
			return Promise.resolve(registers);
		})
		.catch(error => handle(error, `deleting registers (class id: ${classId})`));

/* Auxillary Actions */

const getStudentsOfTeacher = ({ teacherId }) =>
	teacherDAO
		.getById({ id: teacherId })
		.then(teacher => {
			if (teacher == null) {
				return Promise.reject(new NotFoundError(`teacher (id: ${teacherId})`));
			}
			return db(TABLE.REGISTER)
				.distinct('student_id')
				.where('teacher_id', teacherId);
		})
		.then(students =>
			Promise.resolve(students.map(student => student['student_id']))
		);

const getStudentsOfTeachers = teacherIds =>
	Promise.all(
		teacherIds.map(teacherId => getStudentsOfTeacher({ teacherId }))
	).then(studentsByTeachers => {
		const classCount = studentsByTeachers.reduce((multiset, studentIds) => {
			studentIds.forEach(studentId => {
				multiset[studentId] = (multiset[studentId] || 0) + 1;
			});
			return multiset;
		}, {});
		const commonIds = Object.keys(classCount).filter(
			studentId => classCount[studentId] === teacherIds.length
		);
		return Promise.resolve(commonIds.map(studentId => parseInt(studentId)));
	});

module.exports = {
	createById,
	createByEmail,
	createIfNotExists,
	getById,
	getByIds,
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
	deleteByClass,
	getStudentsOfTeacher,
	getStudentsOfTeachers
};
