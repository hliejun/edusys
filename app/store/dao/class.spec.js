const chai = require('chai');
const knex = require('knex');

const config = require('../../../knexfile');
const classDAO = require('./class');

const { CLASSES } = require('../../constants');

const { COMPUTING, MATH } = CLASSES;

chai.use(require('chai-datetime'));

const assert = chai.assert;
const expect = chai.expect;

const db = knex(config);

describe('Data Access Object: Class', function() {
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
		it('should create a class, returning attributes', function() {
			return classDAO
				.create(COMPUTING)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('classes')
						.where({ id })
						.first();
				})
				.then(function(classroom) {
					expect(classroom)
						.to.be.an('object')
						.that.includes({
							id: 1,
							title: COMPUTING.title
						});
					expect(classroom['created_at'])
						.to.be.a('date')
						.that.equalDate(classroom['updated_at'])
						.and.equalTime(classroom['updated_at']);
				});
		});

		it('should create another class if title is unique', function() {
			return classDAO
				.create(COMPUTING)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return classDAO.create(MATH);
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return db('classes')
						.where({ id })
						.first();
				})
				.then(function(classroom) {
					assert.notEqual(COMPUTING.title, MATH.title);
					expect(classroom)
						.to.be.an('object')
						.that.includes({
							id: 2,
							title: MATH.title
						});
					expect(classroom['created_at'])
						.to.be.a('date')
						.that.equalDate(classroom['updated_at']);
				});
		});

		it('should NOT create a class if title is identical', function() {
			return classDAO
				.create(COMPUTING)
				.then(function() {
					return classDAO.create(COMPUTING);
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The class title (${
							COMPUTING.title
						}) already exists. Please use a different and unique class title.`
					);
				});
		});
	});

	// TODO: Test non-strict transactable create

	context('getById', function() {
		beforeEach(function() {
			return classDAO.create(COMPUTING);
		});

		it('should read class with matching id, returning attributes', function() {
			return classDAO.getById({ id: 1 }).then(function(result) {
				expect(classroom)
					.to.be.an('object')
					.that.includes({
						id: 1,
						title: COMPUTING.title
					});
			});
		});

		it('should return "undefined" if class with matching id does not exist', function() {
			return classDAO.getById({ id: 2 }).then(function(classroom) {
				expect(classroom).to.be.an('undefined');
			});
		});
	});

	context('getByTitle', function() {
		beforeEach(function() {
			return classDAO.create(COMPUTING);
		});

		it('should read class with matching title, returning attributes', function() {
			return classDAO
				.create(MATH)
				.then(function() {
					return classDAO.getByTitle({ title: MATH.title });
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

		it('should return "undefined" if class with matching title does not exist', function() {
			return classDAO
				.getByTitle({ title: MATH.title })
				.then(function(classroom) {
					expect(classroom).to.be.an('undefined');
				});
		});
	});

	// FIXME: Add bulk read test

	context('setTitle', function() {
		beforeEach(function() {
			return classDAO.create(COMPUTING);
		});

		it('should update title of class, returning id', function() {
			const title = 'CS2011S: Programming Methodology';
			return classDAO
				.setTitle({ id: 1, title })
				.then(function(id) {
					expect(id).to.equal(1);
					return classDAO.getById({ id: 1 });
				})
				.then(function(classroom) {
					expect(classroom)
						.to.be.an('object')
						.that.includes({ id: 1, title });
					expect(classroom['updated_at'])
						.to.be.a('date')
						.that.afterTime(classroom['created_at']);
				});
		});

		it('should NOT update if class does not exist', function() {
			return classDAO
				.setTitle({
					id: 2,
					title: 'CS2011S: Programming Methodology'
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The class (id: 2) does not exist.');
				});
		});

		it('should NOT update if title is already in use', function() {
			return classDAO
				.create(MATH)
				.then(function() {
					return classDAO.setTitle({
						id: 2,
						title: COMPUTING.title
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The class title (${
							COMPUTING.title
						}) already exists. Please use a different and unique class title.`
					);
				});
		});
	});

	context('deleteById', function() {
		beforeEach(function() {
			return classDAO.create(COMPUTING);
		});

		it('should delete class with matching id, returning attributes', function() {
			return classDAO
				.deleteById({ id: 1 })
				.then(function(classroom) {
					expect(classroom)
						.to.be.an('object')
						.that.includes({
							id: 1,
							title: COMPUTING.title
						});
					return classDAO.getById({ id: 1 });
				})
				.then(function(classroom) {
					expect(classroom).to.be.an('undefined');
				});
		});

		it('should NOT delete if class does not exist', function() {
			return classDAO.deleteById({ id: 2 }).catch(function(error) {
				expect(function() {
					throw error;
				}).to.throw(Error, 'The class (id: 2) does not exist.');
			});
		});
	});

	context('deleteByTitle', function() {
		beforeEach(function() {
			return classDAO.create(COMPUTING);
		});

		it('should delete class with matching title, returning attributes', function() {
			return classDAO
				.deleteByTitle({ title: COMPUTING.title })
				.then(function(classroom) {
					expect(classroom)
						.to.be.an('object')
						.that.includes({
							id: 1,
							title: COMPUTING.title
						});
					return classDAO.getById({ id: 1 });
				})
				.then(function(classroom) {
					expect(classroom).to.be.an('undefined');
				});
		});

		it('should NOT delete if class does not exist', function() {
			return classDAO
				.deleteByTitle({ title: MATH.title })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The class (title: ${MATH.title}) does not exist.`
					);
				});
		});
	});
});
