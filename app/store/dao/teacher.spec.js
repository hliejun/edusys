// const bcrypt = require('bcrypt');
// const chai = require('chai');
// const knex = require('knex');

// const config = require('../../../knexfile');

// const teacherDAO = require('./teacher');

// chai.use(require('chai-datetime'));

// const assert = chai.assert;
// const expect = chai.expect;

// const db = knex(config);

// const john = {
// 	name: 'John Doe',
// 	email: 'john@email.com',
// 	password: 'P455w0rd'
// };

// const jane = {
// 	name: 'Jane Doe',
// 	email: 'jane@email.com',
// 	password: 'P455w0rd'
// };

// const alice = {
// 	name: 'Alice',
// 	email: 'john@email.com',
// 	password: 'P455w0rd'
// };

// const bob = {
// 	name: 'Bob',
// 	email: 'bob@email.com',
// 	password: 'P@ssword123'
// };

// // TODO: Shift commented validation tests to actions

// describe('Data Access Object: Teacher', function() {
// 	beforeEach(function() {
// 		return db.migrate
// 			.rollback()
// 			.then(() => db.migrate.latest())
// 			.then(() => db.seed.run());
// 	});

// 	afterEach(function() {
// 		return db.migrate.rollback();
// 	});

// 	context('create', function() {
// 		it('should create a row with returning values', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function(id) {
// 					expect(id)
// 						.to.be.a('number')
// 						.that.equals(1);
// 					return db('teachers')
// 						.where({ id })
// 						.first();
// 				})
// 				.then(function(result) {
// 					expect(result)
// 						.to.be.an('object')
// 						.that.includes({
// 							id: 1,
// 							name: john.name,
// 							email: john.email
// 						});
// 					expect(result['created_at'])
// 						.to.be.a('date')
// 						.that.equalDate(result['updated_at'])
// 						.and.equalTime(result['updated_at']);
// 					return bcrypt.compare(john.password, result.password);
// 				})
// 				.then(function(isMatchingPassword) {
// 					assert.isTrue(isMatchingPassword);
// 				});
// 		});

// 		it('should create another row if email is unique', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function(id) {
// 					expect(id)
// 						.to.be.a('number')
// 						.that.equals(1);
// 					return teacherDAO.create(jane);
// 				})
// 				.then(function(id) {
// 					expect(id)
// 						.to.be.a('number')
// 						.that.equals(2);
// 					return db('teachers')
// 						.where({ id })
// 						.first();
// 				})
// 				.then(function(result) {
// 					assert.notEqual(john.email, jane.email);
// 					expect(result)
// 						.to.be.an('object')
// 						.that.includes({
// 							id: 2,
// 							name: jane.name,
// 							email: jane.email
// 						});
// 					expect(result['created_at'])
// 						.to.be.a('date')
// 						.that.equalDate(result['updated_at']);
// 					return bcrypt.compare(john.password, result.password);
// 				})
// 				.then(function(isMatchingPassword) {
// 					assert.isTrue(isMatchingPassword);
// 				});
// 		});

// 		it('should NOT create a row if email is non-unique', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.create(alice);
// 				})
// 				.catch(function(error) {
// 					expect(function() {
// 						throw error;
// 					}).to.throw(
// 						Error,
// 						`The email (${
// 							john.email
// 						}) already exists. Please use a different and unique email.`
// 					);
// 				});
// 		});

// 		// it('should NOT create a row if name is invalid', function() {
// 		// 	// TODO: Validation test...
// 		// });

// 		// it('should NOT create a row if email is invalid', function() {
// 		// 	// TODO: Validation test...
// 		// });

// 		// it('should NOT create a row if password does not match standard', function() {
// 		// 	// TODO: Validation test...
// 		// });
// 	});

// 	context('getById', function() {
// 		it('should read and return the row corresponding to given id', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.create(jane);
// 				})
// 				.then(function() {
// 					return teacherDAO.getById({ id: 1 });
// 				})
// 				.then(function(result) {
// 					expect(result)
// 						.to.be.an('object')
// 						.that.includes({
// 							id: 1,
// 							name: john.name,
// 							email: john.email
// 						});
// 				});
// 		});

// 		it('should read and return "undefined" if given a row id that does not exist', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.getById({ id: 2 });
// 				})
// 				.then(function(result) {
// 					expect(result).to.be.an('undefined');
// 				});
// 		});
// 	});

// 	context('getByEmail', function() {
// 		it('should read and return the row corresponding to given email', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.create(jane);
// 				})
// 				.then(function() {
// 					return teacherDAO.getByEmail({ email: jane.email });
// 				})
// 				.then(function(result) {
// 					expect(result)
// 						.to.be.an('object')
// 						.that.includes({
// 							id: 2,
// 							name: jane.name,
// 							email: jane.email
// 						});
// 				});
// 		});

// 		it('should read and return "undefined" if given an email that does not exist', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.getByEmail({ email: bob.email });
// 				})
// 				.then(function(result) {
// 					expect(result).to.be.an('undefined');
// 				});
// 		});
// 	});

// 	context('setName', function() {
// 		it('should update name field with provided value and return id', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.setName({
// 						id: 1,
// 						name: 'Jonathan Doe'
// 					});
// 				})
// 				.then(function(id) {
// 					expect(id).to.equal(1);
// 					return teacherDAO.getById({ id: 1 });
// 				})
// 				.then(function(result) {
// 					expect(result)
// 						.to.be.an('object')
// 						.that.includes({
// 							id: 1,
// 							name: 'Jonathan Doe',
// 							email: john.email
// 						});
// 					expect(result['updated_at'])
// 						.to.be.a('date')
// 						.that.afterTime(result['created_at']);
// 				});
// 		});

// 		it('should NOT update name field if provided id does not exist', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.setName({
// 						id: 2,
// 						name: 'Jonathan Doe'
// 					});
// 				})
// 				.catch(function(error) {
// 					expect(function() {
// 						throw error;
// 					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
// 				});
// 		});

// 		// it('should NOT update name field if provided name is invalid', function() {
// 		// 	// TODO: Validation test...
// 		// });
// 	});

// 	context('setEmail', function() {
// 		it('should update email field with provided value and return id', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.setEmail({
// 						id: 1,
// 						email: 'jonathan@email.com'
// 					});
// 				})
// 				.then(function(id) {
// 					expect(id).to.equal(1);
// 					return teacherDAO.getById({ id: 1 });
// 				})
// 				.then(function(result) {
// 					expect(result)
// 						.to.be.an('object')
// 						.that.includes({
// 							id: 1,
// 							name: john.name,
// 							email: 'jonathan@email.com'
// 						});
// 					expect(result['updated_at'])
// 						.to.be.a('date')
// 						.that.afterTime(result['created_at']);
// 				});
// 		});

// 		it('should NOT update email field if provided id does not exist', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.setEmail({
// 						id: 2,
// 						email: 'jonathan@email.com'
// 					});
// 				})
// 				.catch(function(error) {
// 					expect(function() {
// 						throw error;
// 					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
// 				});
// 		});

// 		it('should NOT update email field if provided email already exists', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.create(jane);
// 				})
// 				.then(function() {
// 					return teacherDAO.setEmail({
// 						id: 2,
// 						email: john.email
// 					});
// 				})
// 				.catch(function(error) {
// 					expect(function() {
// 						throw error;
// 					}).to.throw(
// 						Error,
// 						`The email (${
// 							john.email
// 						}) already exists. Please use a different and unique email.`
// 					);
// 				});
// 		});

// 		// it('should NOT update email field if provided email is invalid', function() {
// 		// 	// TODO: Validation test...
// 		// });
// 	});

// 	context('setPassword', function() {
// 		it('should update password field with provided value and return id', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.setPassword({
// 						id: 1,
// 						password: 'I<3MOE'
// 					});
// 				})
// 				.then(function(id) {
// 					expect(id).to.equal(1);
// 					return teacherDAO.getById({ id: 1 });
// 				})
// 				.then(function(result) {
// 					expect(result)
// 						.to.be.an('object')
// 						.that.includes({
// 							id: 1,
// 							name: john.name,
// 							email: john.email
// 						});
// 					expect(result['updated_at'])
// 						.to.be.a('date')
// 						.that.afterTime(result['created_at']);
// 					return bcrypt.compare('I<3MOE', result.password);
// 				})
// 				.then(function(isMatchingPassword) {
// 					assert.isTrue(isMatchingPassword);
// 				});
// 		});

// 		it('should NOT update password field if provided id does not exist', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.setPassword({
// 						id: 2,
// 						password: 'I<3MOE'
// 					});
// 				})
// 				.catch(function(error) {
// 					expect(function() {
// 						throw error;
// 					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
// 				});
// 		});

// 		it('should NOT update password field if provided password is the same as the previous', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.setPassword({
// 						id: 1,
// 						password: john.password
// 					});
// 				})
// 				.catch(function(error) {
// 					expect(function() {
// 						throw error;
// 					}).to.throw(
// 						Error,
// 						'The new password provided is identical to the old one. Please use a different password.'
// 					);
// 				});
// 		});

// 		// it('should NOT update password field if provided password does not match standard', function() {
// 		// 	// TODO: Validation test...
// 		// });
// 	});

// 	context('deleteById', function() {
// 		it('should delete a row corresponding to provided id with returning values', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.deleteById({ id: 1 });
// 				})
// 				.then(function(result) {
// 					expect(result)
// 						.to.be.an('object')
// 						.that.includes({
// 							id: 1,
// 							name: john.name,
// 							email: john.email
// 						});
// 					return teacherDAO.getById({ id: 1 });
// 				})
// 				.then(function(result) {
// 					expect(result).to.be.an('undefined');
// 				});
// 		});

// 		it('should NOT delete a row if provided id does not exist', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.deleteById({ id: 2 });
// 				})
// 				.catch(function(error) {
// 					expect(function() {
// 						throw error;
// 					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
// 				});
// 		});
// 	});

// 	context('deleteByEmail', function() {
// 		it('should delete a row corresponding to provided email with returning values', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.deleteByEmail({ email: john.email });
// 				})
// 				.then(function(result) {
// 					expect(result)
// 						.to.be.an('object')
// 						.that.includes({
// 							id: 1,
// 							name: john.name,
// 							email: john.email
// 						});
// 					return teacherDAO.getById({ id: 1 });
// 				})
// 				.then(function(result) {
// 					expect(result).to.be.an('undefined');
// 				});
// 		});

// 		it('should NOT delete a row if provided email does not exist', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.deleteByEmail({ email: bob.email });
// 				})
// 				.catch(function(error) {
// 					expect(function() {
// 						throw error;
// 					}).to.throw(
// 						Error,
// 						`The teacher (email: ${bob.email}) does not exist.`
// 					);
// 				});
// 		});
// 	});

// 	context('validate', function() {
// 		it('should validate with email, password and return outcome', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.validate({
// 						email: john.email,
// 						password: john.password
// 					});
// 				})
// 				.then(function(isCorrectPassword) {
// 					assert.isTrue(isCorrectPassword);
// 					return teacherDAO.validate({
// 						email: john.email,
// 						password: bob.password
// 					});
// 				})
// 				.then(function(isCorrectPassword) {
// 					assert.isFalse(isCorrectPassword);
// 				});
// 		});

// 		it('should NOT validate if provided email does not exist', function() {
// 			return teacherDAO
// 				.create(john)
// 				.then(function() {
// 					return teacherDAO.validate({
// 						email: bob.email,
// 						password: john.password
// 					});
// 				})
// 				.catch(function(error) {
// 					expect(function() {
// 						throw error;
// 					}).to.throw(
// 						Error,
// 						`The teacher (email: ${bob.email}) does not exist.`
// 					);
// 				});
// 		});
// 	});
// });
