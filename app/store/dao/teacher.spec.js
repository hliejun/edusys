const bcrypt = require('bcrypt');
const chai = require('chai');
const knex = require('knex');

const config = require('../../../knexfile');
const teacherDAO = require('./teacher');

const { TEACHERS } = require('../../constants');

const { ALICE, BOB, JOHN, JANE } = TEACHERS;

chai.use(require('chai-datetime'));
chai.use(require('chai-subset'));

const assert = chai.assert;
const expect = chai.expect;

const db = knex(config);

describe('Data Access Object: Teacher', function() {
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
		it('should create a teacher, returning attributes', function() {
			return teacherDAO
				.create(JOHN)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('teachers')
						.where({ id })
						.first();
				})
				.then(function(teacher) {
					expect(teacher)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: JOHN.name,
							email: JOHN.email
						});
					expect(teacher['created_at'])
						.to.be.a('date')
						.that.equalDate(teacher['updated_at'])
						.and.equalTime(teacher['updated_at']);
					return bcrypt.compare(JOHN.password, teacher.password);
				})
				.then(function(isMatchingPassword) {
					assert.isTrue(isMatchingPassword);
				});
		});

		it('should create another teacher if email is unique', function() {
			return teacherDAO
				.create(JOHN)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return teacherDAO.create(JANE);
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return db('teachers')
						.where({ id })
						.first();
				})
				.then(function(teacher) {
					assert.notEqual(JOHN.email, JANE.email);
					expect(teacher)
						.to.be.an('object')
						.that.includes({
							id: 2,
							name: JANE.name,
							email: JANE.email
						});
					expect(teacher['created_at'])
						.to.be.a('date')
						.that.equalDate(teacher['updated_at']);
					return bcrypt.compare(JOHN.password, teacher.password);
				})
				.then(function(isMatchingPassword) {
					assert.isTrue(isMatchingPassword);
				});
		});

		it('should NOT create a teacher if email is identical', function() {
			return teacherDAO
				.create(JOHN)
				.then(function() {
					return teacherDAO.create(ALICE);
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The email (${
							JOHN.email
						}) already exists. Please use a different and unique email.`
					);
				});
		});
	});

	context('createIfNotExists', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should create teacher if not exists, returning id', function() {
			return teacherDAO
				.createIfNotExists(JANE)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return teacherDAO.getById({ id });
				})
				.then(function(teacher) {
					expect(teacher)
						.to.be.an('object')
						.that.includes({
							name: JANE.name,
							email: JANE.email
						});
					return bcrypt.compare(JANE.password, teacher.password);
				})
				.then(function(isMatchingPassword) {
					assert.isTrue(isMatchingPassword);
				});
		});

		it('should create teacher with email username and default password if none is provided, returning id', function() {
			return teacherDAO
				.createIfNotExists({ email: JANE.email })
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return teacherDAO.getById({ id });
				})
				.then(function(teacher) {
					expect(teacher)
						.to.be.an('object')
						.that.includes({
							name: 'jane',
							email: JANE.email
						});
					return bcrypt.compare('password', teacher.password);
				})
				.then(function(isMatchingPassword) {
					assert.isTrue(isMatchingPassword);
				});
		});

		it('should NOT create if teacher exists, returning id', function() {
			return teacherDAO
				.createIfNotExists(JOHN)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return teacherDAO.getById({ id: 2 });
				})
				.then(function(teacher) {
					expect(teacher).to.be.an('undefined');
				});
		});

		it('should create teacher in a transaction, returning id', function() {
			const teachers = [{ email: JANE.email }, { email: BOB.email }];
			return db
				.transaction(function(transaction) {
					return Promise.all(
						teachers.map(function(teacher) {
							return teacherDAO.createIfNotExists(teacher, transaction);
						})
					);
				})
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(2)
						.that.contains.members([2, 3]);
					return teacherDAO.getByIds(ids);
				})
				.then(function(teachers) {
					expect(teachers).to.containSubset([
						{
							name: 'jane',
							email: JANE.email
						},
						{
							name: 'bob',
							email: BOB.email
						}
					]);
				});
		});

		it('should create only one instance if duplicate emails are used in transaction, returning same ids', function() {
			const teachers = [
				{ email: JANE.email },
				{ email: BOB.email },
				{ email: JANE.email }
			];
			return db
				.transaction(function(transaction) {
					return Promise.all(
						teachers.map(function(teacher) {
							return teacherDAO.createIfNotExists(teacher, transaction);
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
					return teacherDAO.getByIds(uniqueIds);
				})
				.then(function(teachers) {
					expect(teachers).to.containSubset([
						{
							name: 'jane',
							email: JANE.email
						},
						{
							name: 'bob',
							email: BOB.email
						}
					]);
				});
		});

		it('should NOT create teacher in a transaction if teacher exists, returning id', function() {
			const teachers = [
				{ email: JOHN.email },
				{ email: JANE.email },
				{ email: BOB.email }
			];
			return db
				.transaction(function(transaction) {
					return Promise.all(
						teachers.map(function(teacher) {
							return teacherDAO.createIfNotExists(teacher, transaction);
						})
					);
				})
				.then(function(ids) {
					expect(ids)
						.to.be.an('array')
						.of.length(3)
						.that.contains.members([1, 2, 3]);
					return teacherDAO.getByIds(ids);
				})
				.then(function(teachers) {
					expect(teachers).to.containSubset([
						{
							id: 1,
							name: JOHN.name,
							email: JOHN.email
						},
						{
							name: 'jane',
							email: JANE.email
						},
						{
							name: 'bob',
							email: BOB.email
						}
					]);
				});
		});

		it('should NOT create teacher in a transaction if an error is thrown', function() {
			const errorMessage =
				'Simulating an error thrown within transaction boundary';
			const teachers = [{ email: JANE.email }, { email: BOB.email }];
			return db
				.transaction(function(transaction) {
					return Promise.all([
						...teachers.map(function(teacher) {
							return teacherDAO.createIfNotExists(teacher, transaction);
						})
					]).then(function() {
						return Promise.reject(new Error(errorMessage));
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, errorMessage);
					return teacherDAO.getByIds([2, 3]);
				})
				.then(function(teachers) {
					expect(teachers)
						.to.be.an('array')
						.of.length(0);
				});
		});
	});

	context('bulkCreate', function() {
		beforeEach(function() {
			return teacherDAO.create(JANE);
		});

		it('should create teachers, returning an array of attributes', function() {
			return teacherDAO
				.bulkCreate([BOB, JOHN])
				.then(function(teacherIds) {
					expect(teacherIds)
						.to.be.an('array')
						.of.length(2);
					expect(teacherIds).to.have.members([2, 3]);
					return teacherDAO.getByIds(teacherIds);
				})
				.then(function(teachers) {
					expect(teachers)
						.to.be.an('array')
						.of.length(2);
					teachers.forEach(function(teacher, index) {
						switch (teacher.email) {
						case BOB.email:
							expect(teacher)
								.to.be.an('object')
								.that.includes({
									id: index + 2,
									name: BOB.name,
									email: BOB.email
								});
							break;
						case JOHN.email:
							expect(teacher)
								.to.be.an('object')
								.that.includes({
									id: index + 2,
									name: JOHN.name,
									email: JOHN.email
								});
							break;
						default:
							assert.fail('Unexpected teacher email after bulk creation.');
						}
					});
				});
		});

		it('should NOT create any teacher if one or more has email identical to an existing teacher', function() {
			return teacherDAO
				.bulkCreate([BOB, JOHN, JANE])
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The email (${
							JANE.email
						}) already exists. Please use a different and unique email.`
					);
					return teacherDAO.getByIds([2, 3, 4]);
				})
				.then(function(teachers) {
					expect(teachers)
						.to.be.an('array')
						.of.length(0);
				});
		});

		it('should NOT create any teacher if two or more has email identical to each other', function() {
			return teacherDAO
				.bulkCreate([ALICE, BOB, JOHN])
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The email (${
							JOHN.email
						}) already exists. Please use a different and unique email.`
					);
					return teacherDAO.getByIds([2, 3, 4]);
				})
				.then(function(teachers) {
					expect(teachers)
						.to.be.an('array')
						.of.length(0);
				});
		});
	});

	context('getById', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should read teacher with matching id, returning attributes', function() {
			return teacherDAO.getById({ id: 1 }).then(function(teacher) {
				expect(teacher)
					.to.be.an('object')
					.that.includes({
						id: 1,
						name: JOHN.name,
						email: JOHN.email
					});
			});
		});

		it('should return "undefined" if teacher with matching id does not exist', function() {
			return teacherDAO.getById({ id: 2 }).then(function(result) {
				expect(result).to.be.an('undefined');
			});
		});
	});

	context('getByIds', function() {
		beforeEach(function() {
			return teacherDAO.bulkCreate([JOHN, JANE]);
		});

		it('should read teacher with matching ids, returning array of attributes', function() {
			return teacherDAO.getByIds([1, 2, 3]).then(function(teachers) {
				expect(teachers)
					.to.be.an('array')
					.of.length(2);
				teachers.forEach(function(teacher, index) {
					switch (teacher.email) {
					case JANE.email:
						expect(teacher)
							.to.be.an('object')
							.that.includes({
								id: index + 1,
								name: JANE.name,
								email: JANE.email
							});
						break;
					case JOHN.email:
						expect(teacher)
							.to.be.an('object')
							.that.includes({
								id: index + 1,
								name: JOHN.name,
								email: JOHN.email
							});
						break;
					default:
						assert.fail('Unexpected teacher email when getting from ids.');
					}
				});
			});
		});

		it('should return an empty array if teacher with matching id does not exist', function() {
			return teacherDAO.getByIds([4, 5]).then(function(teachers) {
				expect(teachers)
					.to.be.an('array')
					.of.length(0);
			});
		});
	});

	context('getByEmail', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should read teacher with matching email, returning attributes', function() {
			return teacherDAO
				.create(JANE)
				.then(function() {
					return teacherDAO.getByEmail({ email: JANE.email });
				})
				.then(function(teacher) {
					expect(teacher)
						.to.be.an('object')
						.that.includes({
							id: 2,
							name: JANE.name,
							email: JANE.email
						});
				});
		});

		it('should return "undefined" if teacher with matching email does not exist', function() {
			return teacherDAO
				.getByEmail({ email: BOB.email })
				.then(function(teacher) {
					expect(teacher).to.be.an('undefined');
				});
		});
	});

	context('getByEmails', function() {
		beforeEach(function() {
			return teacherDAO.bulkCreate([JOHN, JANE]);
		});

		it('should read teacher with matching emails, returning array of attributes', function() {
			return teacherDAO
				.getByEmails([JANE.email, JOHN.email, BOB.email])
				.then(function(teachers) {
					expect(teachers)
						.to.be.an('array')
						.of.length(2);
					teachers.forEach(function(teacher) {
						switch (teacher.email) {
						case JANE.email:
							expect(teacher)
								.to.be.an('object')
								.that.includes({
									name: JANE.name,
									email: JANE.email
								});
							break;
						case JOHN.email:
							expect(teacher)
								.to.be.an('object')
								.that.includes({
									name: JOHN.name,
									email: JOHN.email
								});
							break;
						default:
							assert.fail('Unexpected teacher email when getting from ids.');
						}
					});
				});
		});

		it('should return an empty array if teacher with matching email does not exist', function() {
			return teacherDAO.getByEmails([BOB.email]).then(function(teachers) {
				expect(teachers)
					.to.be.an('array')
					.of.length(0);
			});
		});
	});

	context('setName', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should update name of teacher, returning id', function() {
			const name = 'Jonathan';
			return teacherDAO
				.setName({ id: 1, name })
				.then(function(id) {
					expect(id).to.equal(1);
					return teacherDAO.getById({ id: 1 });
				})
				.then(function(teacher) {
					expect(teacher)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name,
							email: JOHN.email
						});
					expect(teacher['updated_at'])
						.to.be.a('date')
						.that.afterTime(teacher['created_at']);
				});
		});

		it('should NOT update if teacher does not exist', function() {
			return teacherDAO
				.setName({
					id: 2,
					name: 'Jonathan'
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
				});
		});
	});

	context('setEmail', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should update email of teacher, returning id', function() {
			const email = 'jonathan@email.com';
			return teacherDAO
				.setEmail({ id: 1, email })
				.then(function(id) {
					expect(id).to.equal(1);
					return teacherDAO.getById({ id: 1 });
				})
				.then(function(teacher) {
					expect(teacher)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: JOHN.name,
							email
						});
					expect(teacher['updated_at'])
						.to.be.a('date')
						.that.afterTime(teacher['created_at']);
				});
		});

		it('should NOT update if teacher does not exist', function() {
			return teacherDAO
				.setEmail({
					id: 2,
					email: 'jonathan@email.com'
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
				});
		});

		it('should NOT update if email is already in use', function() {
			return teacherDAO
				.create(JANE)
				.then(function() {
					return teacherDAO.setEmail({
						id: 2,
						email: JOHN.email
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The email (${
							JOHN.email
						}) already exists. Please use a different and unique email.`
					);
				});
		});
	});

	context('setPassword', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should update password of teacher, returning id', function() {
			const password = 'I<3MOE';
			return teacherDAO
				.setPassword({ id: 1, password })
				.then(function(id) {
					expect(id).to.equal(1);
					return teacherDAO.getById({ id: 1 });
				})
				.then(function(teacher) {
					expect(teacher)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: JOHN.name,
							email: JOHN.email
						});
					expect(teacher['updated_at'])
						.to.be.a('date')
						.that.afterTime(teacher['created_at']);
					return bcrypt.compare(password, teacher.password);
				})
				.then(function(isMatchingPassword) {
					assert.isTrue(isMatchingPassword);
				});
		});

		it('should NOT update if teacher does not exist', function() {
			return teacherDAO
				.setPassword({
					id: 2,
					password: 'I<3MOE'
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
				});
		});

		it('should NOT update if password is unchanged', function() {
			return teacherDAO
				.setPassword({
					id: 1,
					password: JOHN.password
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						'The new password provided is identical to the old one. Please use a different password.'
					);
				});
		});
	});

	context('deleteById', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should delete teacher with matching id, returning attributes', function() {
			return teacherDAO
				.deleteById({ id: 1 })
				.then(function(teacher) {
					expect(teacher)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: JOHN.name,
							email: JOHN.email
						});
					return teacherDAO.getById({ id: 1 });
				})
				.then(function(teacher) {
					expect(teacher).to.be.an('undefined');
				});
		});

		it('should NOT delete if teacher does not exist', function() {
			return teacherDAO.deleteById({ id: 2 }).catch(function(error) {
				expect(function() {
					throw error;
				}).to.throw(Error, 'The teacher (id: 2) does not exist.');
			});
		});
	});

	context('deleteByEmail', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should delete teacher with matching email, returning attributes', function() {
			return teacherDAO
				.deleteByEmail({ email: JOHN.email })
				.then(function(teacher) {
					expect(teacher)
						.to.be.an('object')
						.that.includes({
							id: 1,
							name: JOHN.name,
							email: JOHN.email
						});
					return teacherDAO.getById({ id: 1 });
				})
				.then(function(teacher) {
					expect(teacher).to.be.an('undefined');
				});
		});

		it('should NOT delete if teacher does not exist', function() {
			return teacherDAO
				.deleteByEmail({ email: BOB.email })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${BOB.email}) does not exist.`
					);
				});
		});
	});

	// FIXME: Add test for bulk delete

	context('validate', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should validate email with password, returning validation outcome', function() {
			return teacherDAO
				.validate(JOHN)
				.then(function(isCorrectPassword) {
					assert.isTrue(isCorrectPassword);
					return teacherDAO.validate({
						email: JOHN.email,
						password: BOB.password
					});
				})
				.then(function(isCorrectPassword) {
					assert.isFalse(isCorrectPassword);
				});
		});

		it('should NOT validate if teacher does not exist', function() {
			return teacherDAO
				.validate({
					email: BOB.email,
					password: JOHN.password
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${BOB.email}) does not exist.`
					);
				});
		});
	});
});
