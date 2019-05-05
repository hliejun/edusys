const chai = require('chai');

chai.use(require('chai-datetime'));
chai.use(require('chai-subset'));

const assert = chai.assert;
const expect = chai.expect;

const { db } = require('../knex');
const studentDAO = require('./student');

const { STUDENTS } = require('../../constants');

const { MALICE, MATT, MAX, MAY } = STUDENTS;

// TODO: Refactor and regroup beforeEach

describe('Data Access Object: Student', function() {
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

	context('create', function() {
		it('should create a student, returning attributes', function() {
			return studentDAO
				.create(MAX)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('students')
						.where({ id })
						.first();
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
					expect(student['created_at'])
						.to.be.a('date')
						.that.equalDate(student['updated_at'])
						.and.equalTime(student['updated_at']);
				});
		});

		it('should create another student if email is unique', function() {
			return studentDAO
				.create(MAX)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return studentDAO.create(MAY);
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return db('students')
						.where({ id })
						.first();
				})
				.then(function(student) {
					assert.notEqual(MAX.email, MAY.email);
					expect(student)
						.to.be.an('object')
						.that.includes({
							id: 2,
							name: MAY.name,
							email: MAY.email,
							is_suspended: false
						});
					expect(student['created_at'])
						.to.be.a('date')
						.that.equalDate(student['updated_at']);
				});
		});

		it('should NOT create a student if email is identical', function() {
			return studentDAO
				.create(MAX)
				.then(function() {
					return studentDAO.create(MALICE);
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The email (${
							MAX.email
						}) already exists. Please use a different and unique email.`
					);
				});
		});
	});

	context('createIfNotExists', function() {
		beforeEach(function() {
			return studentDAO.create(MAX);
		});

		it('should create student if not exists, returning id', function() {
			return studentDAO
				.createIfNotExists(MAY)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return studentDAO.getById({ id });
				})
				.then(function(student) {
					expect(student)
						.to.be.an('object')
						.that.includes({
							name: MAY.name,
							email: MAY.email,
							is_suspended: false
						});
				});
		});

		it('should create student with email username if none is provided, returning id', function() {
			return studentDAO
				.createIfNotExists({ email: MAY.email })
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return studentDAO.getById({ id });
				})
				.then(function(student) {
					expect(student)
						.to.be.an('object')
						.that.includes({
							name: 'may',
							email: MAY.email,
							is_suspended: false
						});
				});
		});

		it('should NOT create if student exists, returning id', function() {
			return studentDAO
				.createIfNotExists(MAX)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return studentDAO.getById({ id: 2 });
				})
				.then(function(teacher) {
					expect(teacher).to.be.an('undefined');
				});
		});

		it('should create student in a transaction, returning id', function() {
			const students = [{ email: MAY.email }, { email: MATT.email }];
			return db
				.transaction(function(transaction) {
					return Promise.all(
						students.map(function(student) {
							return studentDAO.createIfNotExists(student, transaction);
						})
					);
				})
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(2)
						.that.contains.members([2, 3]);
					return studentDAO.getByIds(ids);
				})
				.then(function(students) {
					expect(students).to.containSubset([
						{
							name: 'may',
							email: MAY.email
						},
						{
							name: 'matt',
							email: MATT.email
						}
					]);
				});
		});

		it('should create only one instance if duplicate emails are used in transaction, returning same ids', function() {
			const students = [
				{ email: MAY.email },
				{ email: MATT.email },
				{ email: MAY.email }
			];
			return db
				.transaction(function(transaction) {
					return Promise.all(
						students.map(function(student) {
							return studentDAO.createIfNotExists(student, transaction);
						})
					);
				})
				.then(function(ids) {
					const uniqueIds = [...new Set(ids)];
					expect(ids)
						.to.be.an('array')
						.of.length(3);
					expect(uniqueIds)
						.to.be.an('array')
						.of.length(2)
						.that.contains.members([2, 3]);
					return studentDAO.getByIds(uniqueIds);
				})
				.then(function(students) {
					expect(students).to.containSubset([
						{
							name: 'may',
							email: MAY.email
						},
						{
							name: 'matt',
							email: MATT.email
						}
					]);
				});
		});

		it('should NOT create student in a transaction if student exists, returning id', function() {
			const students = [
				{ email: MAX.email },
				{ email: MAY.email },
				{ email: MATT.email }
			];
			return db
				.transaction(function(transaction) {
					return Promise.all(
						students.map(function(student) {
							return studentDAO.createIfNotExists(student, transaction);
						})
					);
				})
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(3)
						.that.contains.members([1, 2, 3]);
					return studentDAO.getByIds(ids);
				})
				.then(function(teachers) {
					expect(teachers).to.containSubset([
						{
							id: 1,
							name: MAX.name,
							email: MAX.email
						},
						{
							name: 'may',
							email: MAY.email
						},
						{
							name: 'matt',
							email: MATT.email
						}
					]);
				});
		});

		it('should NOT create student in a transaction if an error is thrown', function() {
			const errorMessage =
				'Simulating an error thrown within transaction boundary';
			const students = [{ email: MAY.email }, { email: MATT.email }];
			return db
				.transaction(function(transaction) {
					return Promise.all([
						...students.map(function(student) {
							return studentDAO.createIfNotExists(student, transaction);
						})
					]).then(function() {
						return Promise.reject(new Error(errorMessage));
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, errorMessage);
					return studentDAO.getByIds([2, 3]);
				})
				.then(function(students) {
					expect(students)
						.to.be.an('array')
						.of.length(0);
				});
		});
	});

	context('bulkCreate', function() {
		beforeEach(function() {
			return studentDAO.create(MAY);
		});

		it('should create students, returning an array of attributes', function() {
			return studentDAO
				.bulkCreate([MATT, MAX])
				.then(function(studentIds) {
					expect(studentIds)
						.to.be.an('array')
						.of.length(2);
					expect(studentIds).to.have.members([2, 3]);
					return studentDAO.getByIds(studentIds);
				})
				.then(function(students) {
					expect(students)
						.to.be.an('array')
						.of.length(2);
					students.forEach(function(student, index) {
						switch (student.email) {
						case MATT.email:
							expect(student)
								.to.be.an('object')
								.that.includes({
									id: index + 2,
									name: MATT.name,
									email: MATT.email,
									is_suspended: false
								});
							break;
						case MAX.email:
							expect(student)
								.to.be.an('object')
								.that.includes({
									id: index + 2,
									name: MAX.name,
									email: MAX.email,
									is_suspended: false
								});
							break;
						default:
							assert.fail('Unexpected student email after bulk creation.');
						}
					});
				});
		});

		it('should NOT create any student if one or more has email identical to an existing student', function() {
			return studentDAO
				.bulkCreate([MATT, MAX, MAY])
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The email (${
							MAY.email
						}) already exists. Please use a different and unique email.`
					);
					return studentDAO.getByIds([2, 3, 4]);
				})
				.then(function(students) {
					expect(students)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT create any student if two or more has email identical to each other', function() {
			return studentDAO
				.bulkCreate([MALICE, MATT, MAX])
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The email (${
							MAX.email
						}) already exists. Please use a different and unique email.`
					);
					return studentDAO.getByIds([2, 3, 4]);
				})
				.then(function(students) {
					expect(students)
						.to.be.an('array')
						.of.length(0);
				});
		});
	});

	context('getById', function() {
		beforeEach(function() {
			return studentDAO.create(MAX);
		});

		it('should read student with matching id, returning attributes', function() {
			return studentDAO.getById({ id: 1 }).then(function(student) {
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

		it('should return "undefined" if student with matching id does not exist', function() {
			return studentDAO.getById({ id: 2 }).then(function(student) {
				expect(student).to.be.an('undefined');
			});
		});
	});

	context('getByIds', function() {
		beforeEach(function() {
			return studentDAO.bulkCreate([MAX, MAY]);
		});

		it('should read student with matching ids, returning array of attributes', function() {
			return studentDAO.getByIds([1, 2, 3]).then(function(students) {
				expect(students)
					.to.be.an('array')
					.of.length(2);
				students.forEach(function(student) {
					switch (student.email) {
					case MAY.email:
						expect(student)
							.to.be.an('object')
							.that.includes({
								name: MAY.name,
								email: MAY.email,
								is_suspended: false
							});
						break;
					case MAX.email:
						expect(student)
							.to.be.an('object')
							.that.includes({
								name: MAX.name,
								email: MAX.email,
								is_suspended: false
							});
						break;
					default:
						assert.fail('Unexpected student email when getting from ids.');
					}
				});
			});
		});

		it('should return an empty array if teacher with matching id does not exist', function() {
			return studentDAO.getByIds([4, 5]).then(function(students) {
				expect(students)
					.to.be.an('array')
					.of.length(0);
			});
		});
	});

	context('getByEmail', function() {
		beforeEach(function() {
			return studentDAO.create(MAX);
		});

		it('should read student with matching email, returning attributes', function() {
			return studentDAO
				.create(MAY)
				.then(function() {
					return studentDAO.getByEmail({ email: MAY.email });
				})
				.then(function(student) {
					expect(student)
						.to.be.an('object')
						.that.includes({
							id: 2,
							name: MAY.name,
							email: MAY.email,
							is_suspended: false
						});
				});
		});

		it('should return "undefined" if student with matching email does not exist', function() {
			return studentDAO
				.getByEmail({ email: MAY.email })
				.then(function(student) {
					expect(student).to.be.an('undefined');
				});
		});
	});

	context('getByEmails', function() {
		beforeEach(function() {
			return studentDAO.bulkCreate([MAX, MAY]);
		});

		it('should read student with matching emails, returning array of attributes', function() {
			return studentDAO
				.getByEmails([MAY.email, MAX.email, MATT.email])
				.then(function(students) {
					expect(students)
						.to.be.an('array')
						.of.length(2);
					students.forEach(function(student) {
						switch (student.email) {
						case MAY.email:
							expect(student)
								.to.be.an('object')
								.that.includes({
									name: MAY.name,
									email: MAY.email,
									is_suspended: false
								});
							break;
						case MAX.email:
							expect(student)
								.to.be.an('object')
								.that.includes({
									name: MAX.name,
									email: MAX.email,
									is_suspended: false
								});
							break;
						default:
							assert.fail('Unexpected student email when getting from ids.');
						}
					});
				});
		});

		it('should return an empty array if student with matching email does not exist', function() {
			return studentDAO.getByEmails([MATT.email]).then(function(students) {
				expect(students)
					.to.be.an('array')
					.of.length(0);
			});
		});
	});

	context('setName', function() {
		beforeEach(function() {
			return studentDAO.create(MAX);
		});

		it('should update name of student, returning id', function() {
			const name = 'Maximilian';
			return studentDAO
				.setName({ id: 1, name })
				.then(function(id) {
					expect(id).to.equal(1);
					return studentDAO.getById({ id: 1 });
				})
				.then(function(student) {
					expect(student)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name,
							email: MAX.email,
							is_suspended: false
						});
					expect(student['updated_at'])
						.to.be.a('date')
						.that.afterTime(student['created_at']);
				});
		});

		it('should NOT update if student does not exist', function() {
			return studentDAO
				.setName({
					id: 2,
					name: 'Maximilian'
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The student (id: 2) does not exist.');
				});
		});
	});

	context('setEmail', function() {
		beforeEach(function() {
			return studentDAO.create(MAX);
		});

		it('should update email of student, returning id', function() {
			const email = 'maximilian@email.com';
			return studentDAO
				.setEmail({ id: 1, email })
				.then(function(id) {
					expect(id).to.equal(1);
					return studentDAO.getById({ id: 1 });
				})
				.then(function(student) {
					expect(student)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: MAX.name,
							email,
							is_suspended: false
						});
					expect(student['updated_at'])
						.to.be.a('date')
						.that.afterTime(student['created_at']);
				});
		});

		it('should NOT update if student does not exist', function() {
			return studentDAO
				.setEmail({
					id: 2,
					email: 'maximilian@email.com'
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The student (id: 2) does not exist.');
				});
		});

		it('should NOT update if email is already in use', function() {
			return studentDAO
				.create(MAY)
				.then(function() {
					return studentDAO.setEmail({
						id: 2,
						email: MAX.email
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The email (${
							MAX.email
						}) already exists. Please use a different and unique email.`
					);
				});
		});
	});

	context('setSuspension', function() {
		beforeEach(function() {
			return studentDAO.create(MAX);
		});

		it('should update suspension flag of student, returning id', function() {
			return studentDAO
				.setSuspension({
					id: 1,
					isSuspended: true
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return studentDAO.getById({ id: 1 });
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
					expect(student['updated_at'])
						.to.be.a('date')
						.that.afterTime(student['created_at']);
				});
		});

		it('should NOT update if student does not exist', function() {
			return studentDAO
				.setSuspension({
					id: 2,
					isSuspended: true
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The student (id: 2) does not exist.');
				});
		});
	});

	context('deleteById', function() {
		beforeEach(function() {
			return studentDAO.create(MAX);
		});

		it('should delete student with matching id, returning attributes', function() {
			return studentDAO
				.deleteById({ id: 1 })
				.then(function(student) {
					expect(student)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: MAX.name,
							email: MAX.email,
							is_suspended: false
						});
					return studentDAO.getById({ id: 1 });
				})
				.then(function(student) {
					expect(student).to.be.an('undefined');
				});
		});

		it('should NOT delete if student does not exist', function() {
			return studentDAO.deleteById({ id: 2 }).catch(function(error) {
				expect(function() {
					throw error;
				}).to.throw(Error, 'The student (id: 2) does not exist.');
			});
		});
	});

	context('deleteByEmail', function() {
		beforeEach(function() {
			return studentDAO.create(MAX);
		});

		it('should delete student with matching email, returning attributes', function() {
			return studentDAO
				.deleteByEmail({ email: MAX.email })
				.then(function(student) {
					expect(student)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: MAX.name,
							email: MAX.email,
							is_suspended: false
						});
					return studentDAO.getById({ id: 1 });
				})
				.then(function(student) {
					expect(student).to.be.an('undefined');
				});
		});

		it('should NOT delete if student does not exist', function() {
			return studentDAO
				.deleteByEmail({ email: MAY.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The student (email: ${MAY.email}) does not exist.`
					);
				});
		});
	});

	// FIXME: Add test for bulk delete
});
