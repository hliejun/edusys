const store = require('../store');
const { getTaggedEmailsFromText } = require('../utils/parser');

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
 * Find students eligible to receive a notification from teacher.
 *
 * Teacher must exist in the system and notification will not be created.
 * This gives a preview of the potential recipients, who are
 * identified by the following traits:
 *   - student is not suspended
 *   - student is either:
 * 	     - registered with teacher, or...
 * 			 - tagged in the notification with a prefixed '@'
 * 				( e.g. @student@email.com )
 *
 * If the teacher sending the notification cannot be found,
 * an error will be thrown.
 *
 * @param {String} teacherEmail
 * Email of the teacher sending the notification.
 *
 * @param {String} notification
 * Notification text containing notification content and any student tags.
 *
 * @return {Promise}
 * Promise that resolves into student emails of eligible recipients.
 */
const getNotificationRecipients = (teacherEmail, notification) =>
	store.teachers
		.getByEmail({ email: teacherEmail }, true)
		.then(teacher => store.registers.getStudentsOfTeachers([teacher.id]))
		.then(studentIds => store.students.getByIds(studentIds))
		.then(registeredStudents => {
			const taggedEmails = getTaggedEmailsFromText(notification);
			return Promise.all([
				Promise.resolve(registeredStudents),
				store.students.getByEmails(taggedEmails)
			]).then(([registeredStudents, taggedStudents]) => {
				const students = [...registeredStudents, ...taggedStudents];
				const recipientEmails = students
					.filter(student => !student['is_suspended'])
					.map(student => student.email);
				return Promise.resolve([...new Set(recipientEmails)]);
			});
		});

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

/**
 * Suspends a student by toggling the is_suspended flag.
 *
 * Student must exist for suspension to be processed.
 * Student can be suspended by any teacher, regardless
 * of the registration relationship.
 *
 * If the student cannot be found, an error will be thrown.
 *
 * @param {String} studentEmail
 * Email of the student to suspend.
 *
 * @return {Promise}
 * Promise that resolves into student id of the suspended student.
 */
const suspendStudent = studentEmail =>
	store.students
		.getByEmail({ email: studentEmail }, true)
		.then(student =>
			store.students.setSuspension({ id: student.id, isSuspended: true })
		);

module.exports = {
	findCommonStudents,
	getNotificationRecipients,
	registerStudents,
	suspendStudent
};
