const chai = require('chai');

chai.use(require('chai-datetime'));
chai.use(require('chai-subset'));

const expect = chai.expect;

const { db } = require('../knex');
const notificationDAO = require('./notification');
const teacherDAO = require('./teacher');

const { NOTIFICATIONS, TEACHERS } = require('../../constants');

const { BOB, JANE, JOHN } = TEACHERS;
const { QUIZ, RECITATION } = NOTIFICATIONS;

// TODO: Refactor and regroup beforeEach
// TODO: Use bulk create of DAO if order is unimportant
// TODO: Shorten switch-case for bulk create cases

describe('Data Access Object: Notification', function() {
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

	context('createBySenderId', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should create notification, returning values', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return notificationDAO.getById({ id });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: RECITATION.title,
							content: RECITATION.content
						});
					expect(notification['created_at'])
						.to.be.a('date')
						.that.equalDate(notification['updated_at'])
						.and.equalTime(notification['updated_at']);
				});
		});

		it('should create another notification regardless of unicity of attributes', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return notificationDAO.getById({ id });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: RECITATION.title,
							content: RECITATION.content
						});
					return notificationDAO.createBySenderId({
						teacherId: 1,
						...RECITATION
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return notificationDAO.getById({ id });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 1,
							title: RECITATION.title,
							content: RECITATION.content
						});
				});
		});

		it('should NOT create notification if teacher with matching id does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 2, ...RECITATION })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 2) does not exist.');
				});
		});
	});

	context('createBySenderEmail', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should create notification, returning attributes', function() {
			return notificationDAO
				.createBySenderEmail({ email: JOHN.email, ...RECITATION })
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return notificationDAO.getById({ id });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: RECITATION.title,
							content: RECITATION.content
						});
					expect(notification['created_at'])
						.to.be.a('date')
						.that.equalDate(notification['updated_at'])
						.and.equalTime(notification['updated_at']);
				});
		});

		it('should create another notification regardless of unicity of attributes', function() {
			return notificationDAO
				.createBySenderEmail({ email: JOHN.email, ...RECITATION })
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(1);
					return notificationDAO.getById({ id });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: RECITATION.title,
							content: RECITATION.content
						});
					return notificationDAO.createBySenderEmail({
						email: JOHN.email,
						...RECITATION
					});
				})
				.then(function(id) {
					expect(id)
						.to.be.a('number')
						.that.equals(2);
					return notificationDAO.getById({ id });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 1,
							title: RECITATION.title,
							content: RECITATION.content
						});
				});
		});

		it('should NOT create notification if teacher with matching email does not exist', function() {
			return notificationDAO
				.createBySenderEmail({ email: JANE.email, ...RECITATION })
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(
						Error,
						`The teacher (email: ${JANE.email}) does not exist.`
					);
				});
		});
	});

	context('getById', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should read notification with matching id, returning attributes', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: RECITATION.title,
							content: RECITATION.content
						});
				});
		});

		it('should return "undefined" if notification with matching id does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.getById({ id: 2 });
				})
				.then(function(notification) {
					expect(notification).to.be.an('undefined');
				});
		});
	});

	// FIXME: Test get by ids

	context('setSenderById', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN).then(function() {
				return teacherDAO.create(JANE);
			});
		});

		it('should update teacher id of notification, returning id', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function(id) {
					return notificationDAO.setSenderById({ id, teacherId: 2 });
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 2,
							title: RECITATION.title,
							content: RECITATION.content
						});
					expect(notification['updated_at'])
						.to.be.a('date')
						.that.afterTime(notification['created_at']);
				});
		});

		it('should NOT update if notification with matching id does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.setSenderById({ id: 2, teacherId: 2 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The notification (id: 2) does not exist.');
				});
		});

		it('should NOT update if teacher with matching id does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.setSenderById({ id: 1, teacherId: 3 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 3) does not exist.');
				});
		});
	});

	context('setSenderByEmail', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN).then(function() {
				return teacherDAO.create(JANE);
			});
		});

		it('should update teacher id of notification with matching email, returning id', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function(id) {
					return notificationDAO.setSenderByEmail({ id, email: JANE.email });
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 2,
							title: RECITATION.title,
							content: RECITATION.content
						});
					expect(notification['updated_at'])
						.to.be.a('date')
						.that.afterTime(notification['created_at']);
				});
		});

		it('should NOT update if notification with matching id does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.setSenderByEmail({ id: 2, email: JANE.email });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The notification (id: 2) does not exist.');
				});
		});

		it('should NOT update if teacher with matching email does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.setSenderByEmail({ id: 1, email: BOB.email });
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

	context('setTitle', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should update title of notification, returning id', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function(id) {
					return notificationDAO.setTitle({ id, title: QUIZ.title });
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: QUIZ.title,
							content: RECITATION.content
						});
					expect(notification['updated_at'])
						.to.be.a('date')
						.that.afterTime(notification['created_at']);
				});
		});

		it('should NOT update if notification with matching id does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.setTitle({
						id: 2,
						title: QUIZ.title
					});
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The notification (id: 2) does not exist.');
				});
		});
	});

	context('setContent', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should update content of notification, returning id', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function(id) {
					return notificationDAO.setContent({ id, content: QUIZ.content });
				})
				.then(function(id) {
					expect(id).to.equal(1);
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: RECITATION.title,
							content: QUIZ.content
						});
					expect(notification['updated_at'])
						.to.be.a('date')
						.that.afterTime(notification['created_at']);
				});
		});

		it('should NOT update if notification with matching id does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.setContent({ id: 2, content: QUIZ.content });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The notification (id: 2) does not exist.');
				});
		});
	});

	context('deleteById', function() {
		beforeEach(function() {
			return teacherDAO.create(JOHN);
		});

		it('should delete notification with matching id, returning attributes', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function(id) {
					return notificationDAO.deleteById({ id });
				})
				.then(function(notification) {
					expect(notification)
						.to.be.an('object')
						.that.includes({
							id: 1,
							teacher_id: 1,
							title: RECITATION.title,
							content: RECITATION.content
						});
					return notificationDAO.getById({ id: 1 });
				})
				.then(function(notification) {
					expect(notification).to.be.an('undefined');
				});
		});

		it('should NOT delete if notification with matching id does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
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
		beforeEach(function() {
			return teacherDAO.create(JOHN).then(function() {
				return teacherDAO.create(JANE);
			});
		});

		it('should delete all notifications with matching teacher id, returning array of attributes', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 2,
						...RECITATION
					});
				})
				.then(function() {
					return notificationDAO.createBySenderId({ teacherId: 1, ...QUIZ });
				})
				.then(function() {
					return notificationDAO.deleteBySenderId({ teacherId: 1 });
				})
				.then(function(notifications) {
					expect(notifications)
						.to.be.an('array')
						.of.length(2);
					expect(notifications).to.containSubset([
						{
							id: 1,
							teacher_id: 1,
							title: RECITATION.title,
							content: RECITATION.content
						},
						{
							id: 3,
							teacher_id: 1,
							title: QUIZ.title,
							content: QUIZ.content
						}
					]);
					return db('notifications')
						.whereIn('id', [1, 2, 3])
						.select();
				})
				.then(function(notifications) {
					expect(notifications)
						.to.be.an('array')
						.of.length(1);
					expect(notifications[0])
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 2,
							title: RECITATION.title,
							content: RECITATION.content
						});
				});
		});

		it('should NOT delete if teacher with matching id does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.createBySenderId({ teacherId: 1, ...QUIZ });
				})
				.then(function() {
					return notificationDAO.deleteBySenderId({ teacherId: 3 });
				})
				.catch(function(error) {
					expect(function() {
						throw error;
					}).to.throw(Error, 'The teacher (id: 3) does not exist.');
				});
		});

		it('should NOT delete, returning empty array if notifications with matching teacher id do not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 2, ...RECITATION })
				.then(function() {
					return notificationDAO.createBySenderId({ teacherId: 2, ...QUIZ });
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
		beforeEach(function() {
			return teacherDAO.create(JOHN).then(function() {
				return teacherDAO.create(JANE);
			});
		});

		it('should delete all notifications with matching teacher, returning attributes', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.createBySenderId({
						teacherId: 2,
						...RECITATION
					});
				})
				.then(function() {
					return notificationDAO.createBySenderId({ teacherId: 1, ...QUIZ });
				})
				.then(function() {
					return notificationDAO.deleteBySenderEmail({ email: JOHN.email });
				})
				.then(function(notifications) {
					expect(notifications)
						.to.be.an('array')
						.of.length(2);
					expect(notifications).to.containSubset([
						{
							id: 1,
							teacher_id: 1,
							title: RECITATION.title,
							content: RECITATION.content
						},
						{
							id: 3,
							teacher_id: 1,
							title: QUIZ.title,
							content: QUIZ.content
						}
					]);
					return db('notifications')
						.whereIn('id', [1, 2, 3])
						.select();
				})
				.then(function(notifications) {
					expect(notifications)
						.to.be.an('array')
						.of.length(1);
					expect(notifications[0])
						.to.be.an('object')
						.that.includes({
							id: 2,
							teacher_id: 2,
							title: RECITATION.title,
							content: RECITATION.content
						});
				});
		});

		it('should NOT delete if teacher with matching email does not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 1, ...RECITATION })
				.then(function() {
					return notificationDAO.createBySenderId({ teacherId: 1, ...QUIZ });
				})
				.then(function() {
					return notificationDAO.deleteBySenderEmail({ email: BOB.email });
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

		it('should NOT delete, returning empty array if notifications with matching teacher do not exist', function() {
			return notificationDAO
				.createBySenderId({ teacherId: 2, ...RECITATION })
				.then(function() {
					return notificationDAO.createBySenderId({ teacherId: 2, ...QUIZ });
				})
				.then(function() {
					return notificationDAO.deleteBySenderEmail({ email: JOHN.email });
				})
				.then(function(notifications) {
					expect(notifications)
						.to.be.an('array')
						.of.length(0);
				});
		});
	});
});
