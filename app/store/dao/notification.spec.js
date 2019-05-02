const chai = require('chai');
const knex = require('knex');

const config = require('../../../knexfile');

const notificationDAO = require('./notification');

const teacherDAO = require('./teacher');

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

const recitation = {
	title: 'Recitation on Monday',
	content:
		'Please be reminded that recitation is on Monday. Please be punctual. @exchangestudent@gmail.com'
};

const quiz = {
	title: 'Quiz this Saturday',
	content:
		'I hate to break it to you class but there is a quiz this coming Saturday. Sorry to eat into your weekend. @exchangestudent@gmail.com'
};

// TODO: Shift commented validation tests to actions

describe('Data Access Object: Notification', function() {
	beforeEach(function() {
		return db.migrate
			.rollback()
			.then(() => db.migrate.latest())
			.then(() => db.seed.run());
	});

	afterEach(function() {
		return db.migrate.rollback();
	});

	context('createBySenderId', function() {
		it('should create a notification, returning values', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('notifications')
						.where({ id })
						.first();
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: recitation.title,
							content: recitation.content
						});
					expect(result['created_at'])
						.to.be.a('date')
						.that.equalDate(result['updated_at'])
						.and.equalTime(result['updated_at']);
				});
		});

		it('should create another row even if parameters are repeated', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('notifications')
						.where({ id })
						.first();
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: recitation.title,
							content: recitation.content
						});
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return db('notifications')
						.where({ id })
						.first();
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 1,
							title: recitation.title,
							content: recitation.content
						});
				});
		});

		it('should NOT create a row if teacher of corresponding teacher_id does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 2,
						...recitation
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
				});
		});

		// it('should NOT create a row if title is invalid', function() {
		// 	// TODO: Validation test...
		// });

		// it('should NOT create a row if content is invalid', function() {
		// 	// TODO: Validation test...
		// });
	});

	context('createBySenderEmail', function() {
		it('should create a row with returning values', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderEmail({
						email: john.email,
						...recitation
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('notifications')
						.where({ id })
						.first();
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: recitation.title,
							content: recitation.content
						});
					expect(result['created_at'])
						.to.be.a('date')
						.that.equalDate(result['updated_at'])
						.and.equalTime(result['updated_at']);
				});
		});

		it('should create another row even if parameters are repeated', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderEmail({
						email: john.email,
						...recitation
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return db('notifications')
						.where({ id })
						.first();
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: recitation.title,
							content: recitation.content
						});
					return notificationDAO.createBySenderEmail({
						email: john.email,
						...recitation
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return db('notifications')
						.where({ id })
						.first();
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 1,
							title: recitation.title,
							content: recitation.content
						});
				});
		});

		it('should NOT create a row if teacher of corresponding email does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderEmail({
						email: jane.email,
						...recitation
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${jane.email}) does not exist.`
					);
				});
		});

		// it('should NOT create a row if title is invalid', function() {
		// 	// TODO: Validation test...
		// });

		// it('should NOT create a row if content is invalid', function() {
		// 	// TODO: Validation test...
		// });
	});

	context('getById', function() {
		it('should read and return the row corresponding to given id', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: recitation.title,
							content: recitation.content
						});
				});
		});

		it('should read and return "undefined" if given a row id that does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.getById({ id: 2 });
				})
				.then(function(result) {
					expect(result).to.be.an('undefined');
				});
		});
	});

	context('setSenderById', function() {
		it('should update teacher_id field with provided value and return id', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function(id) {
					return notificationDAO.setSenderById({ id, teacherId: 2 });
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 2,
							title: recitation.title,
							content: recitation.content
						});
					expect(result['updated_at'])
						.to.be.a('date')
						.that.afterTime(result['created_at']);
				});
		});

		it('should NOT update teacher_id field if provided notification id does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.setSenderById({ id: 2, teacherId: 2 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The notification (id: 2) does not exist.');
				});
		});

		it('should NOT update teacher_id field if provided teacher id does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.setSenderById({ id: 1, teacherId: 2 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
				});
		});
	});

	context('setSenderByEmail', function() {
		it('should update teacher_id field with referenced value by email and return id', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function(id) {
					return notificationDAO.setSenderByEmail({ id, email: jane.email });
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 2,
							title: recitation.title,
							content: recitation.content
						});
					expect(result['updated_at'])
						.to.be.a('date')
						.that.afterTime(result['created_at']);
				});
		});

		it('should NOT update teacher_id field if provided notification id does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.setSenderByEmail({ id: 2, email: jane.email });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The notification (id: 2) does not exist.');
				});
		});

		it('should NOT update teacher_id field if provided teacher email does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.setSenderByEmail({ id: 1, email: jane.email });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${jane.email}) does not exist.`
					);
				});
		});
	});

	context('setTitle', function() {
		it('should update title field with value and return id', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function(id) {
					return notificationDAO.setTitle({
						id,
						title: quiz.title
					});
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: quiz.title,
							content: recitation.content
						});
					expect(result['updated_at'])
						.to.be.a('date')
						.that.afterTime(result['created_at']);
				});
		});

		it('should NOT update title field if provided notification id does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.setTitle({
						id: 2,
						title: quiz.title
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The notification (id: 2) does not exist.');
				});
		});

		// it('should NOT update title field if provided title is invalid', function() {
		// 	// TODO: Validation test...
		// });
	});

	context('setContent', function() {
		it('should update content field with value and return id', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function(id) {
					return notificationDAO.setContent({
						id,
						content: quiz.content
					});
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: recitation.title,
							content: quiz.content
						});
					expect(result['updated_at'])
						.to.be.a('date')
						.that.afterTime(result['created_at']);
				});
		});

		it('should NOT update content field if provided notification id does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.setContent({
						id: 2,
						content: quiz.content
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The notification (id: 2) does not exist.');
				});
		});

		// it('should NOT update content field if provided content is invalid', function() {
		// 	// TODO: Validation test...
		// });
	});

	context('deleteById', function() {
		it('should delete a row corresponding to provided id with returning values', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function(id) {
					return notificationDAO.deleteById({ id });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: recitation.title,
							content: recitation.content
						});
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(result) {
					expect(result).to.be.an('undefined');
				});
		});
		it('should NOT delete a row if provided id does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.deleteById({ id: 2 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The notification (id: 2) does not exist.');
				});
		});
	});

	context('deleteBySenderId', function() {
		it('should delete matching rows corresponding to provided sender (teacher_id) with returning values', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 2,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...quiz
					});
				})
				.then(function() {
					return notificationDAO.deleteBySenderId({ teacherId: 1 });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(2);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: recitation.title,
							content: recitation.content
						});
					expect(result[1])
						.to.be.an('object')
						.that.includes({
							id: 3,
							teacher_id: 1,
							title: quiz.title,
							content: quiz.content
						});
					return db('notifications')
						.whereIn('id', [1, 2, 3])
						.select();
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(1);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 2,
							title: recitation.title,
							content: recitation.content
						});
				});
		});

		it('should NOT delete any rows if sender (teacher_id) does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...quiz
					});
				})
				.then(function() {
					return notificationDAO.deleteBySenderId({ teacherId: 2 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
				});
		});

		it('should NOT delete any rows, returning empty array if notifications created by sender (teacher_id) do not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 2,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 2,
						...quiz
					});
				})
				.then(function() {
					return notificationDAO.deleteBySenderId({ teacherId: 1 });
				})
				.then(function(notifications) {
					expect(notifications)
						.to.be.an('array')
						.of.length(0);
				});
		});
	});

	context('deleteBySenderEmail', function() {
		it('should delete matching rows corresponding to provided sender (email) with returning values', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 2,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...quiz
					});
				})
				.then(function() {
					return notificationDAO.deleteBySenderEmail({ email: john.email });
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(2);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: recitation.title,
							content: recitation.content
						});
					expect(result[1])
						.to.be.an('object')
						.that.includes({
							id: 3,
							teacher_id: 1,
							title: quiz.title,
							content: quiz.content
						});
					return db('notifications')
						.whereIn('id', [1, 2, 3])
						.select();
				})
				.then(function(result) {
					expect(result)
						.to.be.an('array')
						.of.length(1);
					expect(result[0])
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 2,
							title: recitation.title,
							content: recitation.content
						});
				});
		});

		it('should NOT delete any rows if sender (email) does not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...quiz
					});
				})
				.then(function() {
					return notificationDAO.deleteBySenderEmail({ email: jane.email });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${jane.email}) does not exist.`
					);
				});
		});

		it('should NOT delete any rows, returning empty array if notifications created by sender (email) do not exist', function() {
			return teacherDAO
				.create(john)
				.then(function() {
					return teacherDAO.create(jane);
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 2,
						...recitation
					});
				})
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 2,
						...quiz
					});
				})
				.then(function() {
					return notificationDAO.deleteBySenderEmail({ email: john.email });
				})
				.then(function(notifications) {
					expect(notifications)
						.to.be.an('array')
						.of.length(0);
				});
		});
	});
});
