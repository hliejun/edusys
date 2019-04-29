const chai = require('chai');
const knex = require('knex');

const config = require('../../../knexfile');

const classDAO = require('./class');

chai.use(require('chai-datetime'));

const assert = chai.assert;
const expect = chai.expect;

const db = knex(config);

const computing = {
	title: 'CS1101S: Programming Methodology'
};

const math = {
	title: 'MA1101R: Linear Algebra'
};

describe('Data Access Object: Class', function() {
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
			return classDAO
				.create(computing)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('classes')
						.where({ id })
						.first();
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							title: computing.title
						});
					expect(result['created_at'])
						.to.be.a('date')
						.that.equalDate(result['updated_at'])
						.and.equalTime(result['updated_at']);
				});
		});

		it('should create another row if title is unique', function() {
			return classDAO
				.create(computing)
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return classDAO.create(math);
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return db('classes')
						.where({ id })
						.first();
				})
				.then(function(result) {
					assert.notEqual(computing.title, math.title);
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 2,
							title: math.title
						});
					expect(result['created_at'])
						.to.be.a('date')
						.that.equalDate(result['updated_at']);
				});
		});

		it('should NOT create a row if title is non-unique', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.create(computing);
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The class title (${
							computing.title
						}) already exists. Please use a different and unique class title.`
					);
				});
		});

		it('should NOT create a row if title is invalid', function() {
			// TODO: Validation test...
		});
	});

	context('getById', function() {
		it('should read and return the row corresponding to given id', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.create(math);
				})
				.then(function() {
					return classDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							title: computing.title
						});
				});
		});

		it('should read and return "undefined" if given a row id that does not exist', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.getById({ id: 2 });
				})
				.then(function(result) {
					expect(result).to.be.an('undefined');
				});
		});
	});

	context('getByTitle', function() {
		it('should read and return the row corresponding to given title', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.create(math);
				})
				.then(function() {
					return classDAO.getByTitle({ title: math.title });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 2,
							title: math.title
						});
				});
		});

		it('should read and return "undefined" if given a title that does not exist', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.getByTitle({ title: math.title });
				})
				.then(function(result) {
					expect(result).to.be.an('undefined');
				});
		});
	});

	context('setTitle', function() {
		it('should update title field with provided value and return id', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.setTitle({
						id: 1,
						title: 'CS2011S: Programming Methodology'
					});
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return classDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							title: 'CS2011S: Programming Methodology'
						});
					expect(result['updated_at'])
						.to.be.a('date')
						.that.afterTime(result['created_at']);
				});
		});

		it('should NOT update title field if provided id does not exist', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.setTitle({
						id: 2,
						title: 'CS2011S: Programming Methodology'
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The class with the given id: 2 does not exist.');
				});
		});

		it('should NOT update title field if provided title already exists', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.create(math);
				})
				.then(function() {
					return classDAO.setTitle({
						id: 2,
						title: computing.title
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The class title (${
							computing.title
						}) already exists. Please use a different and unique class title.`
					);
				});
		});

		it('should NOT update title field if provided title is invalid', function() {
			// TODO: Validation test...
		});
	});

	context('deleteById', function() {
		it('should delete a row corresponding to provided id with returning values', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.deleteById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							title: computing.title
						});
					return classDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result).to.be.an('undefined');
				});
		});

		it('should NOT delete a row if provided id does not exist', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.deleteById({ id: 2 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The class with the given id: 2 does not exist.');
				});
		});
	});

	context('deleteByTitle', function() {
		it('should delete a row corresponding to provided title with returning values', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.deleteByTitle({ title: computing.title });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							title: computing.title
						});
					return classDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result).to.be.an('undefined');
				});
		});

		it('should NOT delete a row if provided title does not exist', function() {
			return classDAO
				.create(computing)
				.then(function() {
					return classDAO.deleteByTitle({ title: math.title });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The class with the given title: ${math.title} does not exist.`
					);
				});
		});
	});
});
