const chai = require('chai');
const knex = require('knex');

const config = require('../../../knexfile');

const registerDAO = require('./register');
const teacherDAO = require('./teacher');
const studentDAO = require('./student');
const classDAO = require('./class');

chai.use(require('chai-datetime'));

const expect = chai.expect;

const db = knex(config);

const john = {
	name: 'John Doe',
	email: 'john@email.com',
	password: 'P455w0rd'
};

const jane = {
	name: 'Jane Doe',
	email: 'jane@email.com',
	password: 'P455w0rd'
};

const max = {
	name: 'Max',
	email: 'max@email.com'
};

const may = {
	name: 'May',
	email: 'may@email.com'
};

const computing = {
	title: 'Computing'
};

const math = {
	title: 'Math'
};

// TODO: Shift commented validation tests to actions

describe('Data Access Object: Register', function() {
	beforeEach(function() {
		return db.migrate
			.rollback()
			.then(() => db.migrate.latest())
			.then(() => db.seed.run());
	});

	afterEach(function() {
		return db.migrate.rollback();
	});

	context('createById', function() {
		beforeEach(function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return classDAO.create(computing);
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
				.create(jane)
				.then(function() {
					return studentDAO.create(may);
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
				.create(john)
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return classDAO.create(computing);
				});
		});

		it('should register a student to a teacher with class, returning id', function() {
			return registerDAO
				.createByEmail({
					teacherEmail: john.email,
					studentEmail: max.email,
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
				.createByEmail({ teacherEmail: john.email, studentEmail: max.email })
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
				.create(jane)
				.then(function() {
					return studentDAO.create(may);
				})
				.then(function() {
					return registerDAO.createByEmail({
						teacherEmail: john.email,
						studentEmail: max.email
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
						teacherEmail: john.email,
						studentEmail: may.email
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
						teacherEmail: jane.email,
						studentEmail: max.email
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
				.createByEmail({ teacherEmail: jane.email, studentEmail: max.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${jane.email}) does not exist.`
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
				.createByEmail({ teacherEmail: john.email, studentEmail: may.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The student (email: ${may.email}) does not exist.`
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
					teacherEmail: john.email,
					studentEmail: max.email,
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
					teacherEmail: john.email,
					studentEmail: max.email,
					classId: 1
				})
				.then(function() {
					return registerDAO.createByEmail({
						teacherEmail: john.email,
						studentEmail: max.email,
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
						teacherEmail: john.email,
						studentEmail: max.email
					});
				})
				.then(function(id) {
					expect(id).to.equal(2);
					return registerDAO.createByEmail({
						teacherEmail: john.email,
						studentEmail: max.email
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

	context('getById', function() {
		beforeEach(function() {
			return teacherDAO.create(john).then(function() {
				return studentDAO.create(max);
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

	context('getByTeacherId', function() {
		beforeEach(function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
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
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
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
					return registerDAO.getByTeacherEmail({ teacherEmail: john.email });
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
					return registerDAO.getByTeacherEmail({ teacherEmail: jane.email });
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
				.getByTeacherEmail({ teacherEmail: jane.email })
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT return if teacher does not exist', function() {
			return registerDAO
				.getByTeacherEmail({ teacherEmail: may.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${may.email}) does not exist.`
					);
				});
		});
	});

	context('getByStudentId', function() {
		beforeEach(function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
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
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
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
					return registerDAO.getByStudentEmail({ studentEmail: max.email });
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
					return registerDAO.getByStudentEmail({ studentEmail: may.email });
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
				.getByStudentEmail({ studentEmail: may.email })
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT return if student does not exist', function() {
			return registerDAO
				.getByStudentEmail({ studentEmail: jane.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The student (email: ${jane.email}) does not exist.`
					);
				});
		});
	});

	context('getByClass', function() {
		beforeEach(function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
				})
				.then(function() {
					return classDAO.create(computing);
				})
				.then(function() {
					return classDAO.create(math);
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
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
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
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				});
		});

		it('should update teacher of register, returning id', function() {
			return registerDAO
				.setTeacherByEmail({ id: 1, teacherEmail: jane.email })
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
				.setTeacherByEmail({ id: 2, teacherEmail: jane.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The register (id: 2) does not exist.');
				});
		});

		it('should NOT update if teacher does not exist', function() {
			return registerDAO
				.setTeacherByEmail({ id: 1, teacherEmail: may.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${may.email}) does not exist.`
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
						teacherEmail: jane.email
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
				.create(john)
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
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
				.create(john)
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
				})
				.then(function() {
					return registerDAO.createById({ teacherId: 1, studentId: 1 });
				});
		});

		it('should update student of register, returning id', function() {
			return registerDAO
				.setStudentByEmail({ id: 1, studentEmail: may.email })
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
				.setStudentByEmail({ id: 2, studentEmail: may.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The register (id: 2) does not exist.');
				});
		});

		it('should NOT update if student does not exist', function() {
			return registerDAO
				.setStudentByEmail({ id: 1, studentEmail: jane.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The student (email: ${jane.email}) does not exist.`
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
						studentEmail: may.email
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
				.create(john)
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return classDAO.create(computing);
				})
				.then(function() {
					return classDAO.create(math);
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
				.create(john)
				.then(function() {
					return studentDAO.create(max);
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
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
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
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
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
					return registerDAO.deleteByTeacherEmail({ teacherEmail: john.email });
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
				.deleteByTeacherEmail({ teacherEmail: jane.email })
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT delete if teacher does not exist', function() {
			return registerDAO
				.deleteByTeacherEmail({ teacherEmail: may.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${may.email}) does not exist.`
					);
				});
		});
	});

	context('deleteByStudentId', function() {
		beforeEach(function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
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
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
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
					return registerDAO.deleteByStudentEmail({ studentEmail: max.email });
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
				.deleteByStudentEmail({ studentEmail: may.email })
				.then(function(registers) {
					expect(registers)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT delete if student does not exist', function() {
			return registerDAO
				.deleteByStudentEmail({ studentEmail: jane.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The student (email: ${jane.email}) does not exist.`
					);
				});
		});
	});

	context('deleteByClass', function() {
		beforeEach(function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return studentDAO.create(max);
				})
				.then(function() {
					return studentDAO.create(may);
				})
				.then(function() {
					return classDAO.create(computing);
				})
				.then(function() {
					return classDAO.create(math);
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
});
