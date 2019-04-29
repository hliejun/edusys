const chai = require('chai');
const knex = require('knex');

const config = require('../../../knexfile');

const studentDAO = require('./student');

chai.use(require('chai-datetime'));

const assert = chai.assert;
const expect = chai.expect;

const db = knex(config);

const john = {
	name: 'John Doe',
	email: 'john@email.com'
};

const jane = {
	name: 'Jane Doe',
	email: 'jane@email.com'
};

const alice = {
	name: 'Alice',
	email: 'john@email.com'
};

describe('Data Access Object: Student', function() {
	beforeEach(function() {
		return db.migrate
			.rollback()
			.then(() => db.migrate.latest())
			.then(() => db.seed.run());
	});

	afterEach(function() {
		return db.migrate.rollback();
	});

	context('create', function() {
		it('should create a row with returning values', function() {
			return studentDAO
				.create(john)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('students')
						.where({ id })
						.first();
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: john.name,
							email: john.email,
							is_suspended: false
						});
					expect(result['created_at'])
						.to.be.a('date')
						.that.equalDate(result['updated_at'])
						.and.equalTime(result['updated_at']);
				});
		});

		it('should create another row if email is unique', function() {
			return studentDAO
				.create(john)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return studentDAO.create(jane);
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return db('students')
						.where({ id })
						.first();
				})
				.then(function(result) {
					assert.notEqual(john.email, jane.email);
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 2,
							name: jane.name,
							email: jane.email,
							is_suspended: false
						});
					expect(result['created_at'])
						.to.be.a('date')
						.that.equalDate(result['updated_at']);
				});
		});

		it('should NOT create a row if email is non-unique', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.create(alice);
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The email (${
							john.email
						}) already exists. Please use a different and unique email.`
					);
				});
		});

		it('should NOT create a row if name is invalid', function() {
			// TODO: Validation test...
		});

		it('should NOT create a row if email is invalid', function() {
			// TODO: Validation test...
		});
	});

	context('getById', function() {
		it('should read and return the row corresponding to given id', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.create(jane);
				})
				.then(function() {
					return studentDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: john.name,
							email: john.email,
							is_suspended: false
						});
				});
		});

		it('should read and return "undefined" if given a row id that does not exist', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.getById({ id: 2 });
				})
				.then(function(result) {
					expect(result).to.be.an('undefined');
				});
		});
	});

	context('getByEmail', function() {
		it('should read and return the row corresponding to given email', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.create(jane);
				})
				.then(function() {
					return studentDAO.getByEmail({ email: jane.email });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 2,
							name: jane.name,
							email: jane.email,
							is_suspended: false
						});
				});
		});

		it('should read and return "undefined" if given an email that does not exist', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.getByEmail({ email: jane.email });
				})
				.then(function(result) {
					expect(result).to.be.an('undefined');
				});
		});
	});

	context('setName', function() {
		it('should update name field with provided value and return id', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.setName({
						id: 1,
						name: 'Jonathan Doe'
					});
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return studentDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: 'Jonathan Doe',
							email: john.email,
							is_suspended: false
						});
					expect(result['updated_at'])
						.to.be.a('date')
						.that.afterTime(result['created_at']);
				});
		});

		it('should NOT update name field if provided id does not exist', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.setName({
						id: 2,
						name: 'Jonathan Doe'
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The student with the given id: 2 does not exist.'
					);
				});
		});

		it('should NOT update name field if provided name is invalid', function() {
			// TODO: Validation test...
		});
	});

	context('setEmail', function() {
		it('should update email field with provided value and return id', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.setEmail({
						id: 1,
						email: 'jonathan@email.com'
					});
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return studentDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: john.name,
							email: 'jonathan@email.com',
							is_suspended: false
						});
					expect(result['updated_at'])
						.to.be.a('date')
						.that.afterTime(result['created_at']);
				});
		});

		it('should NOT update email field if provided id does not exist', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.setEmail({
						id: 2,
						email: 'jonathan@email.com'
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The student with the given id: 2 does not exist.'
					);
				});
		});

		it('should NOT update email field if provided email already exists', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.create(jane);
				})
				.then(function() {
					return studentDAO.setEmail({
						id: 2,
						email: john.email
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The email (${
							john.email
						}) already exists. Please use a different and unique email.`
					);
				});
		});

		it('should NOT update email field if provided email is invalid', function() {
			// TODO: Validation test...
		});
	});

	context('setSuspension', function() {
		it('should update is_suspended field with provided flag and return id', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.setSuspension({
						id: 1,
						isSuspended: true
					});
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return studentDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: john.name,
							email: john.email,
							is_suspended: true
						});
					expect(result['updated_at'])
						.to.be.a('date')
						.that.afterTime(result['created_at']);
				});
		});

		it('should NOT update is_suspended field if provided id does not exist', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.setSuspension({
						id: 2,
						isSuspended: true
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The student with the given id: 2 does not exist.'
					);
				});
		});
	});

	context('deleteById', function() {
		it('should delete a row corresponding to provided id with returning values', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.deleteById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: john.name,
							email: john.email,
							is_suspended: false
						});
					return studentDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result).to.be.an('undefined');
				});
		});

		it('should NOT delete a row if provided id does not exist', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.deleteById({ id: 2 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The student with the given id: 2 does not exist.'
					);
				});
		});
	});

	context('deleteByEmail', function() {
		it('should delete a row corresponding to provided email with returning values', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.deleteByEmail({ email: john.email });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: john.name,
							email: john.email,
							is_suspended: false
						});
					return studentDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result).to.be.an('undefined');
				});
		});

		it('should NOT delete a row if provided email does not exist', function() {
			return studentDAO
				.create(john)
				.then(function() {
					return studentDAO.deleteByEmail({ email: jane.email });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The student with the given email: ${jane.email} does not exist.`
					);
				});
		});
	});
});
