const store = require('../store');

/**
 * Queries the students who are taught by all of the specified teachers.
 *
 * Teachers in the query must already exist, or errors will be thrown.
 *
 * @param {Array<String>} teacherEmails
 * Emails of teachers that students must be registered with.
 *
 * @return {Promise}
 * Promise that resolves into an array of student emails.
 */
const findCommonStudents = teacherEmails =>
	Promise.all(
		teacherEmails.map(teacherEmail =>
			store.teachers.getByEmail({ email: teacherEmail }, true)
		)
	)
		.then(teachers => {
			const teacherIds = teachers.map(teacher => teacher.id);
			return store.registers.getStudentsOfTeachers(teacherIds);
		})
		.then(studentIds => store.students.getByIds(studentIds))
		.then(students => Promise.resolve(students.map(student => student.email)));

/**
 * Registers a class of students under a specific teacher.
 *
 * Teacher, class and students are created on demand with
 * default names and password if they do not already exist.
 *
 * If an error is thrown during the registration, the entire
 * registration is voided and undone.
 *
 * @param {String} teacherEmail
 * Email of the teacher to register under.
 *
 * @param {Array<String>} studentEmails
 * Emails of students to register with the teacher.
 *
 * @param {String|undefined} classTitle
 * Title of the class associated with this registration.
 *
 * @return {Promise}
 * Promise that resolves into an array of registration ids.
 */
const registerStudents = (teacherEmail, studentEmails, classTitle) =>
	store.data.transaction(trx =>
		store.teachers
			.createIfNotExists({ email: teacherEmail }, trx)
			.then(teacherId => {
				const idResolutions = [
					Promise.resolve(teacherId),
					classTitle
						? store.classes.createIfNotExists({ title: classTitle }, trx)
						: Promise.resolve()
				];
				return Promise.all(idResolutions);
			})
			.then(([teacherId, classId]) => {
				const registrations = studentEmails.map(studentEmail =>
					store.students
						.createIfNotExists({ email: studentEmail }, trx)
						.then(studentId =>
							store.registers.createIfNotExists(
								{ teacherId, studentId, classId },
								trx
							)
						)
				);
				return Promise.all(registrations);
			})
	);

module.exports = {
	findCommonStudents,
	registerStudents
};
