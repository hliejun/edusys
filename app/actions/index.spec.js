const chai = require('chai');
const sandbox = require('sinon').createSandbox();

chai.use(require('chai-subset'));

const expect = chai.expect;

const store = require('../store');
const actions = require('../actions');

const { TEACHERS, CLASSES, STUDENTS } = require('../constants');

const { MATT, MAX, MAY } = STUDENTS;
const { BOB, JANE, JOHN } = TEACHERS;
const { COMPUTING, MATH } = CLASSES;

const SAMPLE_NOTIFICATION = 'Test notification.';

describe('Actions: All', function() {
	beforeEach(function() {
		return store.data.migrate
			.rollback()
			.then(function() {
				return store.data.migrate.latest();
			})
			.then(function() {
				return store.data.seed.run();
			});
	});

	afterEach(function() {
		sandbox.restore();
		return store.data.migrate.rollback();
	});

	context('registerStudents', function() {
		beforeEach(function() {
			return store.students.create(MAX).then(function() {
				return store.students.create(MAY);
			});
		});

		context('with existing teacher(s)', function() {
			beforeEach(function() {
				return store.teachers.create(JOHN).then(function() {
					return store.teachers.create(JANE);
				});
			});

			it('should register new students with existing teacher, resolving into array of registration ids', function() {
				return actions
					.registerStudents(JOHN.email, [MATT.email])
					.then(function(registerIds) {
						expect(registerIds)
							.to.be.an('array')
							.of.length(1);
						expect(registerIds[0]).to.equal(1);
						return store.registers.getById({ id: registerIds[0] });
					})
					.then(function(register) {
						expect(register)
							.to.be.an('object')
							.that.includes({
								id: 1,
								teacher_id: 1,
								student_id: 3,
								class_id: null
							});
						return store.students.getById({ id: 3 });
					})
					.then(function(student) {
						expect(student)
							.to.be.an('object')
							.that.includes({
								id: 3,
								name: 'matt',
								email: MATT.email,
								is_suspended: false
							});
						return store.teachers.getByIds([1, 2, 3]);
					})
					.then(function(teachers) {
						expect(teachers)
							.to.be.an('array')
							.of.length(2);
						expect(teachers).to.containSubset([
							{
								id: 1,
								name: JOHN.name,
								email: JOHN.email
							},
							{
								id: 2,
								name: JANE.name,
								email: JANE.email
							}
						]);
					});
			});

			it('should register existing students with existing teacher, resolving into array of registration ids', function() {
				return actions
					.registerStudents(JOHN.email, [MAX.email, MAY.email])
					.then(function(registerIds) {
						expect(registerIds)
							.to.be.an('array')
							.of.length(2);
						expect(registerIds).to.have.members([1, 2]);
						return store.registers.getByIds(registerIds);
					})
					.then(function(registers) {
						expect(registers)
							.to.be.an('array')
							.of.length(2);
						expect(registers).to.containSubset([
							{
								teacher_id: 1,
								student_id: 1,
								class_id: null
							},
							{
								teacher_id: 1,
								student_id: 2,
								class_id: null
							}
						]);
						return store.students.getByIds([3, 4]);
					})
					.then(function(students) {
						expect(students)
							.to.be.an('array')
							.of.length(0);
						return store.teachers.getByIds([1, 2, 3]);
					})
					.then(function(teachers) {
						expect(teachers)
							.to.be.an('array')
							.of.length(2);
						expect(teachers).to.containSubset([
							{
								id: 1,
								name: JOHN.name,
								email: JOHN.email
							},
							{
								id: 2,
								name: JANE.name,
								email: JANE.email
							}
						]);
					});
			});

			context('with existing register(s)', function() {
				beforeEach(function() {
					return store.registers
						.createByEmail({
							teacherEmail: JOHN.email,
							studentEmail: MAX.email
						})
						.then(function() {
							return store.registers.createByEmail({
								teacherEmail: JOHN.email,
								studentEmail: MAY.email
							});
						});
				});

				it('should NOT register if registers already exist, resolving into array of existing registration ids ', function() {
					return actions
						.registerStudents(JOHN.email, [MAX.email, MAY.email])
						.then(function(registerIds) {
							expect(registerIds)
								.to.be.an('array')
								.of.length(2);
							expect(registerIds).to.have.members([1, 2]);
							return store.registers.getByIds([1, 2, 3, 4]);
						})
						.then(function(registers) {
							expect(registers)
								.to.be.an('array')
								.of.length(2);
							expect(registers).to.containSubset([
								{
									id: 1,
									teacher_id: 1,
									student_id: 1,
									class_id: null
								},
								{
									id: 2,
									teacher_id: 1,
									student_id: 2,
									class_id: null
								}
							]);
						});
				});

				it('should NOT register or create new teacher/student/register if error is thrown when creating register', function() {
					const errorMessage = 'failing intentionally';
					const createRegisterStub = sandbox
						.stub(store.registers, 'createIfNotExists')
						.throws(new Error(errorMessage));
					return actions
						.registerStudents(BOB.email, [MATT.email])
						.catch(function(error) {
							expect(function() {
								throw error;
							}).to.throw(Error, errorMessage);
							expect(createRegisterStub.calledOnce).to.be.true;
							return store.teachers.getByEmail({ email: BOB.email });
						})
						.then(function(teacher) {
							expect(teacher).to.be.an('undefined');
							return store.students.getByEmail({ email: MATT.email });
						})
						.then(function(student) {
							expect(student).to.be.an('undefined');
							return store.registers.getById({ id: 3 });
						})
						.then(function(register) {
							expect(register).to.be.an('undefined');
						});
				});
			});
		});

		context('without existing teacher(s)', function() {
			it('should register new students with new teacher, resolving into array of registration ids', function() {
				return actions
					.registerStudents(JOHN.email, [MATT.email])
					.then(function(registerIds) {
						expect(registerIds)
							.to.be.an('array')
							.of.length(1);
						return store.registers.getByIds(registerIds);
					})
					.then(function(registers) {
						expect(registers)
							.to.be.an('array')
							.of.length(1);
						expect(registers).to.containSubset([
							{
								id: 1,
								teacher_id: 1,
								student_id: 3,
								class_id: null
							}
						]);
						return store.teachers.getByEmail({ email: JOHN.email });
					})
					.then(function(teacher) {
						expect(teacher)
							.to.be.an('object')
							.that.includes({
								id: 1,
								name: 'john',
								email: JOHN.email
							});
						return store.students.getByEmail({ email: MATT.email });
					})
					.then(function(student) {
						expect(student)
							.to.be.an('object')
							.that.includes({
								id: 3,
								name: 'matt',
								email: MATT.email
							});
					});
			});

			it('should register existing students with new teacher, resolving into array of registration ids', function() {
				return actions
					.registerStudents(JOHN.email, [MAX.email, MAY.email])
					.then(function(registerIds) {
						expect(registerIds)
							.to.be.an('array')
							.of.length(2);
						return store.registers.getByIds(registerIds);
					})
					.then(function(registers) {
						expect(registers)
							.to.be.an('array')
							.of.length(2);
						expect(registers).to.containSubset([
							{
								teacher_id: 1,
								student_id: 1,
								class_id: null
							},
							{
								teacher_id: 1,
								student_id: 2,
								class_id: null
							}
						]);
						return store.teachers.getByEmail({ email: JOHN.email });
					})
					.then(function(teacher) {
						expect(teacher)
							.to.be.an('object')
							.that.includes({
								id: 1,
								name: 'john',
								email: JOHN.email
							});
						return store.students.getByEmails([MAX.email, MAY.email]);
					})
					.then(function(students) {
						expect(students)
							.to.be.an('array')
							.of.length(2);
						expect(students).to.containSubset([
							{ id: 1, is_suspended: false, ...MAX },
							{ id: 2, is_suspended: false, ...MAY }
						]);
					});
			});

			it('should register only once for duplicating students, resolving into array of unique registration ids', function() {
				return actions
					.registerStudents(JOHN.email, [MATT.email, MATT.email])
					.then(function(registerIds) {
						expect(registerIds)
							.to.be.an('array')
							.of.length(2);
						return store.registers.getByIds(registerIds);
					})
					.then(function(registers) {
						expect(registers)
							.to.be.an('array')
							.of.length(1);
						expect(registers).to.containSubset([
							{
								id: 1,
								teacher_id: 1,
								student_id: 3,
								class_id: null
							}
						]);
						return store.teachers.getByEmail({ email: JOHN.email });
					})
					.then(function(teacher) {
						expect(teacher)
							.to.be.an('object')
							.that.includes({
								id: 1,
								name: 'john',
								email: JOHN.email
							});
						return store.students.getByEmails([MATT.email]);
					})
					.then(function(students) {
						expect(students)
							.to.be.an('array')
							.of.length(1);
						expect(students).to.containSubset([
							{
								id: 3,
								name: 'matt',
								email: MATT.email
							}
						]);
					});
			});
		});

		context('with classes', function() {
			beforeEach(function() {
				return store.classes.create(COMPUTING);
			});

			it('should register new students with new teacher and new class, resolving into array of registration ids', function() {
				return actions
					.registerStudents(JOHN.email, [MATT.email], MATH.title)
					.then(function(registerIds) {
						expect(registerIds)
							.to.be.an('array')
							.of.length(1);
						expect(registerIds).to.have.members([1]);
						return store.registers.getById({ id: 1 });
					})
					.then(function(register) {
						expect(register)
							.to.be.an('object')
							.that.includes({
								id: 1,
								teacher_id: 1,
								student_id: 3,
								class_id: 2
							});
						return store.classes.getByTitle({ title: MATH.title });
					})
					.then(function(classroom) {
						expect(classroom)
							.to.be.an('object')
							.that.includes({
								id: 2,
								title: MATH.title
							});
					});
			});

			it('should register new students with new teacher and existing class, resolving into array of registration ids', function() {
				return actions
					.registerStudents(JOHN.email, [MATT.email], COMPUTING.title)
					.then(function(registerIds) {
						expect(registerIds)
							.to.be.an('array')
							.of.length(1);
						expect(registerIds).to.have.members([1]);
						return store.registers.getById({ id: 1 });
					})
					.then(function(register) {
						expect(register)
							.to.be.an('object')
							.that.includes({
								id: 1,
								teacher_id: 1,
								student_id: 3,
								class_id: 1
							});
						return store.classes.getByTitles([COMPUTING.title]);
					})
					.then(function(classrooms) {
						expect(classrooms)
							.to.be.an('array')
							.of.length(1);
						expect(classrooms).to.containSubset([
							{ id: 1, title: COMPUTING.title }
						]);
					});
			});
		});
	});

	context('findCommonStudents', function() {
		beforeEach(function() {
			return store.teachers
				.bulkCreate([BOB, JOHN, JANE])
				.then(function() {
					return store.students.bulkCreate([MAX, MAY, MATT]);
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MAX.email
					});
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MATT.email
					});
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JANE.email,
						studentEmail: MAY.email
					});
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JANE.email,
						studentEmail: MATT.email
					});
				});
		});

		it('should read all students registered under teacher if array is size 1, returning student emails', function() {
			return actions
				.findCommonStudents([JOHN.email])
				.then(function(studentEmails) {
					expect(studentEmails)
						.to.be.an('array')
						.of.length(2);
					expect(studentEmails).to.have.members([MAX.email, MATT.email]);
					return actions.findCommonStudents([JANE.email]);
				})
				.then(function(studentEmails) {
					expect(studentEmails)
						.to.be.an('array')
						.of.length(2);
					expect(studentEmails).to.have.members([MAY.email, MATT.email]);
					return actions.findCommonStudents([BOB.email]);
				})
				.then(function(studentEmails) {
					expect(studentEmails)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should read all common students registered under all teachers in array, returning student emails', function() {
			return actions
				.findCommonStudents([JOHN.email, JANE.email])
				.then(function(studentEmails) {
					expect(studentEmails)
						.to.be.an('array')
						.of.length(1);
					expect(studentEmails).to.have.members([MATT.email]);
				});
		});

		it('should read no common students if at least 1 teacher has exclusive student(s), returning empty array', function() {
			return actions
				.findCommonStudents([JOHN.email, BOB.email])
				.then(function(studentEmails) {
					expect(studentEmails)
						.to.be.an('array')
						.of.length(0);
					return actions.findCommonStudents([JANE.email, BOB.email]);
				})
				.then(function(studentEmails) {
					expect(studentEmails)
						.to.be.an('array')
						.of.length(0);
					return actions.findCommonStudents([
						JANE.email,
						JOHN.email,
						BOB.email
					]);
				})
				.then(function(studentEmails) {
					expect(studentEmails)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should not read if 1 or more teachers in array do not exist', function() {
			return actions
				.findCommonStudents([JOHN.email, MAX.email])
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${MAX.email}) does not exist.`
					);
				});
		});
	});

	context('suspendStudent', function() {
		beforeEach(function() {
			return store.students
				.create(MAX)
				.then(function(studentId) {
					return store.students.getById({ id: studentId });
				})
				.then(function(student) {
					expect(student)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: MAX.name,
							email: MAX.email,
							is_suspended: false
						});
				});
		});

		it('should suspend existing student with matching email', function() {
			return actions
				.suspendStudent(MAX.email)
				.then(function() {
					return store.students.getByEmail({ email: MAX.email });
				})
				.then(function(student) {
					expect(student)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: MAX.name,
							email: MAX.email,
							is_suspended: true
						});
				});
		});

		it('should NOT suspend if student with matching email does not exist', function() {
			return actions.suspendStudent(MAY.email).catch(function(error) {
				expect(function() {
					throw error;
				}).to.throw(Error, `The student (email: ${MAY.email}) does not exist.`);
			});
		});
	});

	context('getNotificationRecipients', function() {
		beforeEach(function() {
			return store.teachers
				.bulkCreate([BOB, JOHN, JANE])
				.then(function() {
					return store.students.bulkCreate([MAX, MAY]);
				})
				.then(function() {
					return store.students.create(MATT);
				})
				.then(function(id) {
					return store.students.setSuspension({ id, isSuspended: true });
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MAX.email
					});
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MATT.email
					});
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JANE.email,
						studentEmail: MAY.email
					});
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JANE.email,
						studentEmail: MATT.email
					});
				});
		});

		it('should retrieve all registered and non-suspended recipient emails for teacher without tags', function() {
			return actions
				.getNotificationRecipients(JOHN.email, SAMPLE_NOTIFICATION)
				.then(function(emails) {
					expect(emails)
						.to.be.an('array')
						.of.length(1)
						.and.have.members([MAX.email]);
					return actions.getNotificationRecipients(
						JANE.email,
						SAMPLE_NOTIFICATION
					);
				})
				.then(function(emails) {
					expect(emails)
						.to.be.an('array')
						.of.length(1)
						.and.have.members([MAY.email]);
					return actions.getNotificationRecipients(
						BOB.email,
						SAMPLE_NOTIFICATION
					);
				})
				.then(function(emails) {
					expect(emails)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should retrieve all registered and non-suspended recipient emails for teacher with qualifying tagged students', function() {
			return actions
				.getNotificationRecipients(
					JOHN.email,
					`${SAMPLE_NOTIFICATION} @${MATT.email} @${MAX.email} @${MAY.email}`
				)
				.then(function(emails) {
					expect(emails)
						.to.be.an('array')
						.of.length(2)
						.and.have.members([MAX.email, MAY.email]);
					return actions.getNotificationRecipients(
						JANE.email,
						`${SAMPLE_NOTIFICATION} @${MATT.email} @${MAX.email} @${MAY.email}`
					);
				})
				.then(function(emails) {
					expect(emails)
						.to.be.an('array')
						.of.length(2)
						.and.have.members([MAX.email, MAY.email]);
					return actions.getNotificationRecipients(
						BOB.email,
						`${SAMPLE_NOTIFICATION} @${MATT.email} @${MAX.email} @${MAY.email}`
					);
				})
				.then(function(emails) {
					expect(emails)
						.to.be.an('array')
						.of.length(2)
						.and.have.members([MAX.email, MAY.email]);
				});
		});

		it('should retrieve all registered and non-suspended recipient emails for teacher ignoring non-existing student tags', function() {
			return actions
				.getNotificationRecipients(
					JOHN.email,
					`${SAMPLE_NOTIFICATION} @${BOB.email} @${MAY.email} @${MAY.email}`
				)
				.then(function(emails) {
					expect(emails)
						.to.be.an('array')
						.of.length(2)
						.and.have.members([MAX.email, MAY.email]);
				});
		});

		it('should NOT retrieve if teacher with matching email does not exist', function() {
			return actions
				.getNotificationRecipients(MAY.email, `${SAMPLE_NOTIFICATION}`)
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${MAY.email}) does not exist.`
					);
				});
		});
	});
});
