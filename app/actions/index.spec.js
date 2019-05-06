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

describe.only('Actions: All', function() {
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
});
