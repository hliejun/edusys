const chai = require('chai');

chai.use(require('chai-datetime'));
chai.use(require('chai-subset'));

const expect = chai.expect;

const { db } = require('../knex');
const registerDAO = require('./register');
const teacherDAO = require('./teacher');
const studentDAO = require('./student');
const classDAO = require('./class');

const { TEACHERS, STUDENTS, CLASSES } = require('../../constants');

const { JOHN, JANE, BOB } = TEACHERS;
const { MAX, MAY, MATT } = STUDENTS;
const { COMPUTING, MATH, PHYSICS } = CLASSES;

// TODO: Refactor and regroup beforeEach
// TODO: Use bulk create of DAO if order is unimportant
// TODO: Shorten switch-case for bulk create cases

describe('Data Access Object: Register', function() {
	beforeEach(function() {
		return db.migrate
			.rollback()
			.then(function() {
				return db.migrate.latest();
			})
			.then(function() {
				return db.seed.run();
			});
	});

	afterEach(function() {
		return db.migrate.rollback();
	});

	context('createById', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return classDAO.create(COMPUTING);
				});
		});

		it('should register a student to a teacher with class, returning id', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 1, classId: 1 })
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('registers')
						.where({ id })
						.first();
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: 1
						});
					expect(register['created_at'])
						.to.be.a('date')
						.that.equalDate(register['updated_at'])
						.and.equalTime(register['updated_at']);
				});
		});

		it('should register a student to a teacher without class, returning id', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 1 })
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('registers')
						.where({ id })
						.first();
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					expect(register['created_at'])
						.to.be.a('date')
						.that.equalDate(register['updated_at'])
						.and.equalTime(register['updated_at']);
				});
		});

		it('should register in a many-to-many relationship between teachers and students', function() {
			return teacherDAO
				.create(JANE)
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('registers')
						.where({ id })
						.first();
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					return registerDAO.createById({ teacherId: 1, studentId: 2 });
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return db('registers')
						.where({ id })
						.first();
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
					return registerDAO.createById({ teacherId: 2, studentId: 1 });
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(3);
					return db('registers')
						.where({ id })
						.first();
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
				});
		});

		it('should NOT register if teacher does not exist', function() {
			return registerDAO
				.createById({ teacherId: 2, studentId: 1 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
					return db('registers')
						.where({ id: 1 })
						.first();
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT register if student does not exist', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 2 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The student (id: 2) does not exist.');
					return db('registers')
						.where({ id: 1 })
						.first();
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT register if class is provided but does not exist', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 1, classId: 2 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The class (id: 2) does not exist.');
					return db('registers')
						.where({ id: 1 })
						.first();
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT register if an identical registration already exists', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 1, classId: 1 })
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1,
						classId: 1
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The register (teacher id: 1, student id: 1, class id: 1) already exists. Please use a different and unique register.'
					);
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1
					});
				})
				.then(function(id) {
					expect(id).to.equal(2);
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The register (teacher id: 1, student id: 1, class id: null) already exists. Please use a different and unique register.'
					);
				});
		});
	});

	context('createByEmail', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return classDAO.create(COMPUTING);
				});
		});

		it('should register a student to a teacher with class, returning id', function() {
			return registerDAO
				.createByEmail({
					teacherEmail: JOHN.email,
					studentEmail: MAX.email,
					classId: 1
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('registers')
						.where({ id })
						.first();
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: 1
						});
					expect(register['created_at'])
						.to.be.a('date')
						.that.equalDate(register['updated_at'])
						.and.equalTime(register['updated_at']);
				});
		});

		it('should register a student to a teacher without class, returning id', function() {
			return registerDAO
				.createByEmail({ teacherEmail: JOHN.email, studentEmail: MAX.email })
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('registers')
						.where({ id })
						.first();
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					expect(register['created_at'])
						.to.be.a('date')
						.that.equalDate(register['updated_at'])
						.and.equalTime(register['updated_at']);
				});
		});

		it('should register in a many-to-many relationship between teachers and students', function() {
			return teacherDAO
				.create(JANE)
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MAX.email
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('registers')
						.where({ id })
						.first();
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					return registerDAO.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MAY.email
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return db('registers')
						.where({ id })
						.first();
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
					return registerDAO.createByEmail({
						teacherEmail: JANE.email,
						studentEmail: MAX.email
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(3);
					return db('registers')
						.where({ id })
						.first();
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
				});
		});

		it('should NOT register if teacher does not exist', function() {
			return registerDAO
				.createByEmail({ teacherEmail: JANE.email, studentEmail: MAX.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${JANE.email}) does not exist.`
					);
					return db('registers')
						.where({ id: 1 })
						.first();
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT register if student does not exist', function() {
			return registerDAO
				.createByEmail({ teacherEmail: JOHN.email, studentEmail: MAY.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The student (email: ${MAY.email}) does not exist.`
					);
					return db('registers')
						.where({ id: 1 })
						.first();
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT register if class is provided but does not exist', function() {
			return registerDAO
				.createByEmail({
					teacherEmail: JOHN.email,
					studentEmail: MAX.email,
					classId: 2
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The class (id: 2) does not exist.');
					return db('registers')
						.where({ id: 1 })
						.first();
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT register if an identical registration already exists', function() {
			return registerDAO
				.createByEmail({
					teacherEmail: JOHN.email,
					studentEmail: MAX.email,
					classId: 1
				})
				.then(function() {
					return registerDAO.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MAX.email,
						classId: 1
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The register (teacher id: 1, student id: 1, class id: 1) already exists. Please use a different and unique register.'
					);
					return registerDAO.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MAX.email
					});
				})
				.then(function(id) {
					expect(id).to.equal(2);
					return registerDAO.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MAX.email
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The register (teacher id: 1, student id: 1, class id: null) already exists. Please use a different and unique register.'
					);
				});
		});
	});

	context('createIfNotExists', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return classDAO.create(COMPUTING);
				})
				.then(function() {
					return classDAO.create(MATH);
				})
				.then(function() {
					return registerDAO.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MAX.email,
						classId: 1
					});
				})
				.then(function() {
					return registerDAO.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MAY.email,
						classId: 1
					});
				})
				.then(function() {
					return registerDAO.createByEmail({
						teacherEmail: JANE.email,
						studentEmail: MAX.email,
						classId: 2
					});
				});
		});

		it('should create register if not exists, returning id', function() {
			return registerDAO
				.createIfNotExists({
					teacherId: 2,
					studentId: 2,
					classId: 2
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(4);
					return registerDAO.getById({ id });
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 2,
							student_id: 2,
							class_id: 2
						});
				});
		});

		it('should create register without class if not exists, returning id', function() {
			return registerDAO
				.createIfNotExists({
					teacherId: 2,
					studentId: 2
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(4);
					return registerDAO.getById({ id });
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 2,
							student_id: 2,
							class_id: null
						});
				});
		});

		it('should NOT create if identical register exists, returning id', function() {
			return registerDAO
				.createIfNotExists({
					teacherId: 2,
					studentId: 1,
					classId: 2
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(3);
					return registerDAO.getById({ id: 4 });
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT create if teacher does not exists', function() {
			return registerDAO
				.createIfNotExists({
					teacherId: 3,
					studentId: 2,
					classId: 2
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 3) does not exist.');
					return registerDAO.getById({ id: 4 });
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT create if student does not exists', function() {
			return registerDAO
				.createIfNotExists({
					teacherId: 2,
					studentId: 3,
					classId: 2
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The student (id: 3) does not exist.');
					return registerDAO.getById({ id: 4 });
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT create if class is defined but does not exists', function() {
			return registerDAO
				.createIfNotExists({
					teacherId: 2,
					studentId: 2,
					classId: 3
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The class (id: 3) does not exist.');
					return registerDAO.getById({ id: 4 });
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should create register in a transaction, returning id', function() {
			const registers = [
				{
					teacherId: 2,
					studentId: 2,
					classId: 1
				},
				{
					teacherId: 2,
					studentId: 2,
					classId: 2
				}
			];
			return db
				.transaction(function(transaction) {
					return Promise.all(
						registers.map(function(register) {
							return registerDAO.createIfNotExists(register, transaction);
						})
					);
				})
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(2)
						.that.contains.members([4, 5]);
					return registerDAO.getByIds(ids);
				})
				.then(function(registers) {
					expect(registers).to.containSubset([
						{
							teacher_id: 2,
							student_id: 2,
							class_id: 1
						},
						{
							teacher_id: 2,
							student_id: 2,
							class_id: 2
						}
					]);
				});
		});

		it('should create only one instance if there are duplicates in transaction, returning same ids', function() {
			const registers = [
				{
					teacherId: 2,
					studentId: 2,
					classId: 1
				},
				{
					teacherId: 2,
					studentId: 2,
					classId: 1
				}
			];
			return db
				.transaction(function(transaction) {
					return Promise.all(
						registers.map(function(register) {
							return registerDAO.createIfNotExists(register, transaction);
						})
					);
				})
				.then(function(ids) {
					const uniqueIds = [...new Set(ids)];
					expect(ids)
						.to.be.an('array')
						.of.length(2);
					expect(uniqueIds)
						.to.be.an('array')
						.of.length(1)
						.that.contains.members([4]);
					return registerDAO.getByIds(uniqueIds);
				})
				.then(function(registers) {
					expect(registers).to.containSubset([
						{
							teacher_id: 2,
							student_id: 2,
							class_id: 1
						}
					]);
					return registerDAO.getById({ id: 5 });
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT create register in a transaction if an identical one exists, returning id', function() {
			const registers = [
				{
					teacherId: 2,
					studentId: 2,
					classId: 1
				},
				{
					teacherId: 1,
					studentId: 1,
					classId: 1
				}
			];
			return db
				.transaction(function(transaction) {
					return Promise.all(
						registers.map(function(register) {
							return registerDAO.createIfNotExists(register, transaction);
						})
					);
				})
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(2)
						.that.contains.members([4, 1]);
					return registerDAO.getById({ id: 5 });
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT create registers in a transaction if an error is thrown', function() {
			const errorMessage =
				'Simulating an error thrown within transaction boundary';
			const registers = [
				{
					teacherId: 2,
					studentId: 2,
					classId: 1
				}
			];
			return db
				.transaction(function(transaction) {
					return Promise.all([
						...registers.map(function(register) {
							return registerDAO.createIfNotExists(register, transaction);
						})
					]).then(function() {
						return Promise.reject(new Error(errorMessage));
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, errorMessage);
					return registerDAO.getById({ id: 4 });
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});
	});

	context('getById', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN).then(function() {
				return studentDAO.create(MAX);
			});
		});

		it('should return values of register with matching id', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 1 })
				.then(function(id) {
					return registerDAO.getById({ id });
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
				});
		});

		it('should NOT return values if matching register does not exist', function() {
			return registerDAO.getById({ id: 1 }).catch(function(error) {
				expect(function() {
					throw error;
				}).to.throw(Error, 'The register (id: 1) does not exist.');
			});
		});
	});

	context('getByIds', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return classDAO.create(COMPUTING);
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1,
						classId: 1
					});
				});
		});

		it('should read registers with matching ids, returning array of attributes', function() {
			return registerDAO.getByIds([1, 2, 3]).then(function(registers) {
				expect(registers)
					.to.be.an('array')
					.of.length(2);
				expect(registers).to.containSubset([
					{ teacher_id: 1, student_id: 1, class_id: null },
					{ teacher_id: 1, student_id: 1, class_id: 1 }
				]);
			});
		});

		it('should return an empty array if register with matching id does not exist', function() {
			return registerDAO.getByIds([4, 5]).then(function(registers) {
				expect(registers)
					.to.be.an('array')
					.of.length(0);
			});
		});
	});

	context('getByTeacherId', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 2 });
				});
		});

		it('should return array of values of registers with matching teacher', function() {
			return registerDAO
				.createById({ teacherId: 2, studentId: 1 })
				.then(function() {
					return registerDAO.getByTeacherId({ teacherId: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(2);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					expect(result[1])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
					return registerDAO.getByTeacherId({ teacherId: 2 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(1);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
				});
		});

		it('should return empty array if no matching register is found', function() {
			return registerDAO
				.getByTeacherId({ teacherId: 2 })
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT return if teacher does not exist', function() {
			return registerDAO
				.getByTeacherId({ teacherId: 3 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 3) does not exist.');
				});
		});
	});

	context('getByTeacherEmail', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 2 });
				});
		});

		it('should return array of values of registers with matching teacher', function() {
			return registerDAO
				.createById({ teacherId: 2, studentId: 1 })
				.then(function() {
					return registerDAO.getByTeacherEmail({ teacherEmail: JOHN.email });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(2);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					expect(result[1])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
					return registerDAO.getByTeacherEmail({ teacherEmail: JANE.email });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(1);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
				});
		});

		it('should return empty array if no matching register is found', function() {
			return registerDAO
				.getByTeacherEmail({ teacherEmail: JANE.email })
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT return if teacher does not exist', function() {
			return registerDAO
				.getByTeacherEmail({ teacherEmail: MAY.email })
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

	context('getByStudentId', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 2, studentId: 1 });
				});
		});

		it('should return array of values of registers with matching student', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 2 })
				.then(function() {
					return registerDAO.getByStudentId({ studentId: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(2);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					expect(result[1])
						.to.be.an('object')
						.that.includes({
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
					return registerDAO.getByStudentId({ studentId: 2 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(1);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
				});
		});

		it('should return empty array if no matching register is found', function() {
			return registerDAO
				.getByStudentId({ studentId: 2 })
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT return if student does not exist', function() {
			return registerDAO
				.getByStudentId({ studentId: 3 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The student (id: 3) does not exist.');
				});
		});
	});

	context('getByStudentEmail', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 2, studentId: 1 });
				});
		});

		it('should return array of values of registers with matching student', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 2 })
				.then(function() {
					return registerDAO.getByStudentEmail({ studentEmail: MAX.email });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(2);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					expect(result[1])
						.to.be.an('object')
						.that.includes({
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
					return registerDAO.getByStudentEmail({ studentEmail: MAY.email });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(1);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
				});
		});

		it('should return empty array if no matching register is found', function() {
			return registerDAO
				.getByStudentEmail({ studentEmail: MAY.email })
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT return if student does not exist', function() {
			return registerDAO
				.getByStudentEmail({ studentEmail: JANE.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The student (email: ${JANE.email}) does not exist.`
					);
				});
		});
	});

	context('getByClass', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return classDAO.create(COMPUTING);
				})
				.then(function() {
					return classDAO.create(MATH);
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1,
						classId: 1
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 2,
						classId: 1
					});
				});
		});

		it('should return array of values of registers with matching class', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 1, classId: 2 })
				.then(function() {
					return registerDAO.getByClass({ classId: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(2);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: 1
						});
					expect(result[1])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 2,
							class_id: 1
						});
					return registerDAO.getByClass({ classId: 2 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(1);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: 2
						});
				});
		});

		it('should return empty array if no matching register is found', function() {
			return registerDAO.getByClass({ classId: 2 }).then(function(result) {
				expect(result)
					.to.be.an('array')
					.of.length(0);
			});
		});

		it('should NOT return if class does not exist', function() {
			return registerDAO.getByClass({ classId: 3 }).catch(function(error) {
				expect(function() {
					throw error;
				}).to.throw(Error, 'The class (id: 3) does not exist.');
			});
		});
	});

	context('setTeacherById', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				});
		});

		it('should update teacher of register, returning id', function() {
			return registerDAO
				.setTeacherById({ id: 1, teacherId: 2 })
				.then(function(id) {
					expect(id).to.equal(1);
					return registerDAO.getById({ id });
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
					expect(register['updated_at'])
						.to.be.a('date')
						.that.afterTime(register['created_at']);
				});
		});

		it('should NOT update if register does not exist', function() {
			return registerDAO
				.setTeacherById({ id: 2, teacherId: 2 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The register (id: 2) does not exist.');
				});
		});

		it('should NOT update if teacher does not exist', function() {
			return registerDAO
				.setTeacherById({ id: 1, teacherId: 3 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 3) does not exist.');
				});
		});

		it('should NOT update if an identical register already exists', function() {
			return registerDAO
				.createById({ teacherId: 2, studentId: 1 })
				.then(function(id) {
					expect(id).to.equal(2);
					return registerDAO.setTeacherById({ id: 1, teacherId: 2 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The register (teacher id: 2, student id: 1, class id: null) already exists. Please use a different and unique register.'
					);
				});
		});
	});

	context('setTeacherByEmail', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				});
		});

		it('should update teacher of register, returning id', function() {
			return registerDAO
				.setTeacherByEmail({ id: 1, teacherEmail: JANE.email })
				.then(function(id) {
					expect(id).to.equal(1);
					return registerDAO.getById({ id });
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
					expect(register['updated_at'])
						.to.be.a('date')
						.that.afterTime(register['created_at']);
				});
		});

		it('should NOT update if register does not exist', function() {
			return registerDAO
				.setTeacherByEmail({ id: 2, teacherEmail: JANE.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The register (id: 2) does not exist.');
				});
		});

		it('should NOT update if teacher does not exist', function() {
			return registerDAO
				.setTeacherByEmail({ id: 1, teacherEmail: MAY.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${MAY.email}) does not exist.`
					);
				});
		});

		it('should NOT update if an identical register already exists', function() {
			return registerDAO
				.createById({ teacherId: 2, studentId: 1 })
				.then(function(id) {
					expect(id).to.equal(2);
					return registerDAO.setTeacherByEmail({
						id: 1,
						teacherEmail: JANE.email
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The register (teacher id: 2, student id: 1, class id: null) already exists. Please use a different and unique register.'
					);
				});
		});
	});

	context('setStudentById', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				});
		});

		it('should update student of register, returning id', function() {
			return registerDAO
				.setStudentById({ id: 1, studentId: 2 })
				.then(function(id) {
					expect(id).to.equal(1);
					return registerDAO.getById({ id });
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
					expect(register['updated_at'])
						.to.be.a('date')
						.that.afterTime(register['created_at']);
				});
		});

		it('should NOT update if register does not exist', function() {
			return registerDAO
				.setStudentById({ id: 2, studentId: 2 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The register (id: 2) does not exist.');
				});
		});

		it('should NOT update if student does not exist', function() {
			return registerDAO
				.setStudentById({ id: 1, studentId: 3 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The student (id: 3) does not exist.');
				});
		});

		it('should NOT update if an identical register already exists', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 2 })
				.then(function(id) {
					expect(id).to.equal(2);
					return registerDAO.setStudentById({ id: 1, studentId: 2 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The register (teacher id: 1, student id: 2, class id: null) already exists. Please use a different and unique register.'
					);
				});
		});
	});

	context('setStudentByEmail', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				});
		});

		it('should update student of register, returning id', function() {
			return registerDAO
				.setStudentByEmail({ id: 1, studentEmail: MAY.email })
				.then(function(id) {
					expect(id).to.equal(1);
					return registerDAO.getById({ id });
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
					expect(register['updated_at'])
						.to.be.a('date')
						.that.afterTime(register['created_at']);
				});
		});

		it('should NOT update if register does not exist', function() {
			return registerDAO
				.setStudentByEmail({ id: 2, studentEmail: MAY.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The register (id: 2) does not exist.');
				});
		});

		it('should NOT update if student does not exist', function() {
			return registerDAO
				.setStudentByEmail({ id: 1, studentEmail: JANE.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The student (email: ${JANE.email}) does not exist.`
					);
				});
		});

		it('should NOT update if an identical register already exists', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 2 })
				.then(function(id) {
					expect(id).to.equal(2);
					return registerDAO.setStudentByEmail({
						id: 1,
						studentEmail: MAY.email
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The register (teacher id: 1, student id: 2, class id: null) already exists. Please use a different and unique register.'
					);
				});
		});
	});

	context('setClass', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return classDAO.create(COMPUTING);
				})
				.then(function() {
					return classDAO.create(MATH);
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1,
						classId: 1
					});
				});
		});

		it('should update class of register, returning id', function() {
			return registerDAO
				.setClass({ id: 1, classId: 2 })
				.then(function(id) {
					expect(id).to.equal(1);
					return registerDAO.getById({ id });
				})
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							teacher_id: 1,
							student_id: 1,
							class_id: 2
						});
					expect(register['updated_at'])
						.to.be.a('date')
						.that.afterTime(register['created_at']);
				});
		});

		it('should NOT update if register does not exist', function() {
			return registerDAO.setClass({ id: 2, classId: 2 }).catch(function(error) {
				expect(function() {
					throw error;
				}).to.throw(Error, 'The register (id: 2) does not exist.');
			});
		});

		it('should NOT update if class does not exist', function() {
			return registerDAO.setClass({ id: 1, classId: 3 }).catch(function(error) {
				expect(function() {
					throw error;
				}).to.throw(Error, 'The class (id: 3) does not exist.');
			});
		});

		it('should NOT update if an identical register already exists', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 1, classId: 2 })
				.then(function(id) {
					expect(id).to.equal(2);
					return registerDAO.setClass({ id: 1, classId: 2 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The register (teacher id: 1, student id: 1, class id: 2) already exists. Please use a different and unique register.'
					);
				});
		});
	});

	context('deleteById', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				});
		});

		it('should delete register with matching id, returning values', function() {
			return registerDAO
				.deleteById({ id: 1 })
				.then(function(register) {
					expect(register)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					return registerDAO.getById({ id: register.id });
				})
				.then(function(register) {
					expect(register).to.be.an('undefined');
				});
		});

		it('should NOT delete if register does not exist', function() {
			return registerDAO.deleteById({ id: 2 }).catch(function(error) {
				expect(function() {
					throw error;
				}).to.throw(Error, 'The register (id: 2) does not exist.');
			});
		});
	});

	context('deleteByTeacherId', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 2 });
				});
		});

		it('should delete registers with matching teacher, returning array of values', function() {
			return registerDAO
				.createById({ teacherId: 2, studentId: 1 })
				.then(function() {
					return registerDAO.deleteByTeacherId({ teacherId: 1 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(2);
					expect(registers[0])
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					expect(registers[1])
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
					return registerDAO.getByTeacherId({ teacherId: 1 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
					return registerDAO.getByTeacherId({ teacherId: 2 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(1);
					expect(registers[0])
						.to.be.an('object')
						.that.includes({
							id: 3,
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
				});
		});

		it('should NOT delete, returning empty array if no matches found', function() {
			return registerDAO
				.deleteByTeacherId({ teacherId: 2 })
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT delete if teacher does not exist', function() {
			return registerDAO
				.deleteByTeacherId({ teacherId: 3 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 3) does not exist.');
				});
		});
	});

	context('deleteByTeacherEmail', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 2 });
				});
		});

		it('should delete registers with matching teacher, returning array of values', function() {
			return registerDAO
				.createById({ teacherId: 2, studentId: 1 })
				.then(function() {
					return registerDAO.deleteByTeacherEmail({ teacherEmail: JOHN.email });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(2);
					expect(registers[0])
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					expect(registers[1])
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
					return registerDAO.getByTeacherId({ teacherId: 1 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
					return registerDAO.getByTeacherId({ teacherId: 2 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(1);
					expect(registers[0])
						.to.be.an('object')
						.that.includes({
							id: 3,
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
				});
		});

		it('should NOT delete, returning empty array if no matches found', function() {
			return registerDAO
				.deleteByTeacherEmail({ teacherEmail: JANE.email })
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT delete if teacher does not exist', function() {
			return registerDAO
				.deleteByTeacherEmail({ teacherEmail: MAY.email })
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

	context('deleteByStudentId', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 2, studentId: 1 });
				});
		});

		it('should delete registers with matching student, returning array of values', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 2 })
				.then(function() {
					return registerDAO.deleteByStudentId({ studentId: 1 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(2);
					expect(registers[0])
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					expect(registers[1])
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
					return registerDAO.getByStudentId({ studentId: 1 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
					return registerDAO.getByStudentId({ studentId: 2 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(1);
					expect(registers[0])
						.to.be.an('object')
						.that.includes({
							id: 3,
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
				});
		});

		it('should NOT delete, returning empty array if no matches found', function() {
			return registerDAO
				.deleteByStudentId({ studentId: 2 })
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT delete if student does not exist', function() {
			return registerDAO
				.deleteByStudentId({ studentId: 3 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The student (id: 3) does not exist.');
				});
		});
	});

	context('deleteByStudentEmail', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 2, studentId: 1 });
				});
		});

		it('should delete registers with matching student, returning array of values', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 2 })
				.then(function() {
					return registerDAO.deleteByStudentEmail({ studentEmail: MAX.email });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(2);
					expect(registers[0])
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							student_id: 1,
							class_id: null
						});
					expect(registers[1])
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 2,
							student_id: 1,
							class_id: null
						});
					return registerDAO.getByStudentId({ studentId: 1 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
					return registerDAO.getByStudentId({ studentId: 2 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(1);
					expect(registers[0])
						.to.be.an('object')
						.that.includes({
							id: 3,
							teacher_id: 1,
							student_id: 2,
							class_id: null
						});
				});
		});

		it('should NOT delete, returning empty array if no matches found', function() {
			return registerDAO
				.deleteByStudentEmail({ studentEmail: MAY.email })
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT delete if student does not exist', function() {
			return registerDAO
				.deleteByStudentEmail({ studentEmail: JANE.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The student (email: ${JANE.email}) does not exist.`
					);
				});
		});
	});

	context('deleteByClass', function() {
		beforeEach(function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(JANE);
				})
				.then(function() {
					return studentDAO.create(MAX);
				})
				.then(function() {
					return studentDAO.create(MAY);
				})
				.then(function() {
					return classDAO.create(COMPUTING);
				})
				.then(function() {
					return classDAO.create(MATH);
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 2,
						classId: 1
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 2,
						studentId: 1,
						classId: 1
					});
				});
		});

		it('should delete registers with matching class, returning array of values', function() {
			return registerDAO
				.createById({ teacherId: 1, studentId: 1, classId: 2 })
				.then(function() {
					return registerDAO.deleteByClass({ classId: 1 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(2);
					expect(registers[0])
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							student_id: 2,
							class_id: 1
						});
					expect(registers[1])
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 2,
							student_id: 1,
							class_id: 1
						});
					return registerDAO.getByClass({ classId: 1 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
					return registerDAO.getByClass({ classId: 2 });
				})
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(1);
					expect(registers[0])
						.to.be.an('object')
						.that.includes({
							id: 3,
							teacher_id: 1,
							student_id: 1,
							class_id: 2
						});
				});
		});

		it('should NOT delete, returning empty array if no matches found', function() {
			return registerDAO
				.deleteByClass({ classId: 2 })
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT delete if class does not exist', function() {
			return registerDAO.deleteByClass({ classId: 3 }).catch(function(error) {
				expect(function() {
					throw error;
				}).to.throw(Error, 'The class (id: 3) does not exist.');
			});
		});
	});

	context('getStudentsOfTeacher', function() {
		beforeEach(function() {
			return teacherDAO
				.bulkCreate([JOHN, JANE, BOB])
				.then(function() {
					return studentDAO.bulkCreate([MAX, MAY, MATT]);
				})
				.then(function() {
					return classDAO.create(COMPUTING);
				})
				.then(function() {
					return classDAO.create(MATH);
				})
				.then(function() {
					return classDAO.create(PHYSICS);
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1,
						classId: 1
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 2,
						classId: 1
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 2,
						studentId: 1,
						classId: 2
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 2,
						studentId: 3,
						classId: 2
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1,
						classId: 3
					});
				});
		});

		it('should read distinct students of a teacher, returning array of student ids', function() {
			return registerDAO
				.getStudentsOfTeacher({ teacherId: 1 })
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(2);
					expect(ids).to.have.members([1, 2]);
					return registerDAO.getStudentsOfTeacher({ teacherId: 2 });
				})
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(2);
					expect(ids).to.have.members([1, 3]);
					return registerDAO.getStudentsOfTeacher({ teacherId: 3 });
				})
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT read if teacher with matching id does not exist', function() {
			return registerDAO
				.getStudentsOfTeacher({ teacherId: 4 })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 4) does not exist.');
				});
		});
	});

	context('getStudentsOfTeachers', function() {
		beforeEach(function() {
			return teacherDAO
				.bulkCreate([JOHN, JANE, BOB])
				.then(function() {
					return studentDAO.bulkCreate([MAX, MAY, MATT]);
				})
				.then(function() {
					return classDAO.create(COMPUTING);
				})
				.then(function() {
					return classDAO.create(MATH);
				})
				.then(function() {
					return classDAO.create(PHYSICS);
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1,
						classId: 1
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 2,
						classId: 1
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 2,
						studentId: 1,
						classId: 2
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 2,
						studentId: 3,
						classId: 2
					});
				})
				.then(function() {
					return registerDAO.createById({
						teacherId: 1,
						studentId: 1,
						classId: 3
					});
				});
		});

		it('should get common students by an array of teachers, returning array of student ids', function() {
			return registerDAO
				.getStudentsOfTeachers([1])
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(2);
					expect(ids).to.have.members([1, 2]);
					return registerDAO.getStudentsOfTeachers([2]);
				})
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(2);
					expect(ids).to.have.members([1, 3]);
					return registerDAO.getStudentsOfTeachers([1, 2]);
				})
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(1);
					expect(ids).to.have.members([1]);
				});
		});

		it('should return empty array if no common students are found', function() {
			return registerDAO.getStudentsOfTeachers([3]).then(function(ids) {
				expect(ids)
					.to.be.an('array')
					.of.length(0);
			});
		});

		it('should NOT read if teacher with matching id does not exist', function() {
			return registerDAO
				.getStudentsOfTeachers([1, 2, 4])
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 4) does not exist.');
				});
		});
	});
});
