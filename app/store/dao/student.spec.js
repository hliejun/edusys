const chai = require('chai');
const knex = require('knex');

const config = require('../../../knexfile');
const studentDAO = require('./student');

const { STUDENTS } = require('../../constants');

const { MALICE, MAX, MAY } = STUDENTS;

chai.use(require('chai-datetime'));

const assert = chai.assert;
const expect = chai.expect;

const db = knex(config);

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

	// TODO: Add test for bulk create

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

	// TODO: Add test for bulk read by ids

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

	// TODO: Add test for bulk read by emails

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
