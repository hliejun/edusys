const store = require('../store');

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
	registerStudents
};
