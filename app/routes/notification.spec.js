const chai = require('chai');
const sandbox = require('sinon').createSandbox();

chai.use(require('chai-http'));
chai.use(require('chai-subset'));

chai.should();

const server = require('../server');
const store = require('../store');

const {
	IdenticalObjectError,
	MalformedResponseError,
	NotFoundError,
	UniqueConstraintError,
	UnknownError
} = require('../utils/errors');

const { STUDENTS, TEACHERS } = require('../constants');

const { MATT, MAX, MAY } = STUDENTS;
const { BOB, JANE, JOHN } = TEACHERS;

const SAMPLE_NOTIFICATION = 'Test notification.';

const MALFORMED_EMAILS = [
	'john@email',
	'john.email',
	'john.email.com',
	'john',
	'john@email;com',
	'john#email.com',
	'@email.com',
	'$%^&*(@email.com'
];

const MALFORMED_INPUTS = [undefined, null, 123, {}, []];

describe('API Routes: Notification', function() {
	beforeEach(function() {
		return store.data.migrate
			.rollback()
			.then(function() {
				return store.data.migrate.latest();
			})
			.then(function() {
				return store.data.seed.run();
			});
	});

	afterEach(function() {
		sandbox.restore();
		return store.data.migrate.rollback();
	});

	context('POST /api/retrievefornotifications', function() {
		const apiPath = '/api/retrievefornotifications';

		beforeEach(function() {
			return store.teachers
				.bulkCreate([BOB, JOHN, JANE])
				.then(function() {
					return store.students.bulkCreate([MAX, MAY]);
				})
				.then(function() {
					return store.students.create(MATT);
				})
				.then(function(id) {
					return store.students.setSuspension({ id, isSuspended: true });
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MAX.email
					});
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JOHN.email,
						studentEmail: MATT.email
					});
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JANE.email,
						studentEmail: MAY.email
					});
				})
				.then(function() {
					return store.registers.createByEmail({
						teacherEmail: JANE.email,
						studentEmail: MATT.email
					});
				});
		});

		it('should retrieve all registered and non-suspended recipient emails for teacher without tags', function(done) {
			chai
				.request(server)
				.post(apiPath)
				.send({
					teacher: JOHN.email,
					notification: SAMPLE_NOTIFICATION
				})
				.end(function(_, res) {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have
						.property('recipients')
						.of.length(1)
						.that.containSubset([MAX.email]);
					done();
				});
		});

		it('should retrieve all registered and non-suspended recipient emails for teacher with qualifying tagged students', function(done) {
			chai
				.request(server)
				.post(apiPath)
				.send({
					teacher: JANE.email,
					notification: `${SAMPLE_NOTIFICATION} @${MATT.email} @${MAX.email}`
				})
				.end(function(_, res) {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have
						.property('recipients')
						.of.length(2)
						.that.containSubset([MAX.email, MAY.email]);
					done();
				});
		});

		it('should retrieve all registered and non-suspended recipient emails for teacher ignoring non-existing student tags', function(done) {
			chai
				.request(server)
				.post(apiPath)
				.send({
					teacher: JOHN.email,
					notification: `${SAMPLE_NOTIFICATION} @${BOB.email}`
				})
				.end(function(_, res) {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have
						.property('recipients')
						.of.length(1)
						.that.containSubset([MAX.email]);
					done();
				});
		});

		[...MALFORMED_INPUTS, ...MALFORMED_EMAILS].forEach(function(input) {
			it(`should validate and return status 400 when "teacher" field is malformed: ${JSON.stringify(
				input
			)}`, function(done) {
				chai
					.request(server)
					.post(apiPath)
					.send({
						teacher: input,
						notification: SAMPLE_NOTIFICATION
					})
					.end((_, res) => {
						res.should.have.status(400);
						res.body.should.be.an('object');
						res.body.should.have
							.property('message')
							.equal(
								`One or more email addresses provided are malformed or invalid. ( ${JSON.stringify(
									input
								)} )`
							);
						done();
					});
			});
		});

		MALFORMED_INPUTS.forEach(function(input) {
			it(`should validate and return status 400 when "notification" field is not a valid string: ${JSON.stringify(
				input
			)}`, function(done) {
				chai
					.request(server)
					.post(apiPath)
					.send({
						teacher: JOHN.email,
						notification: input
					})
					.end((_, res) => {
						res.should.have.status(400);
						res.body.should.be.an('object');
						res.body.should.have
							.property('message')
							.equal(
								`Expected "notification" field to be a valid string. ( ${JSON.stringify(
									input
								)} )`
							);
						done();
					});
			});
		});

		it('should return status 422 with appropriate error messages when teacher with matching email does not exist', function(done) {
			chai
				.request(server)
				.post(apiPath)
				.send({
					teacher: MAY.email,
					notification: SAMPLE_NOTIFICATION
				})
				.end((_, res) => {
					res.should.have.status(422);
					res.body.should.be.an('object');
					res.body.should.have
						.property('message')
						.equal(`The teacher (email: ${MAY.email}) does not exist.`);
					done();
				});
		});

		[
			new IdenticalObjectError('This is an identical object error.'),
			new NotFoundError('This is a not found error.'),
			new UniqueConstraintError('This is an unique constraint error.')
		].forEach(function(error) {
			it(`should return status 422 with appropriate error messages when input-related errors are thrown: [ CODE: ${
				error.code
			} ]`, function(done) {
				sandbox.stub(store.registers, 'getStudentsOfTeachers').throws(error);
				chai
					.request(server)
					.post(apiPath)
					.send({
						teacher: JOHN.email,
						notification: SAMPLE_NOTIFICATION
					})
					.end((_, res) => {
						res.should.have.status(422);
						res.body.should.be.an('object');
						res.body.should.have.property('message').equal(error.message);
						done();
					});
			});
		});

		[
			new UnknownError('This is an unknown error.'),
			new MalformedResponseError('This is a malformed response error.'),
			new Error('This is a generic error.')
		].forEach(function(error) {
			it(`should return status 500 with propagated error messages when non input-related or unknown errors are thrown: [ CODE: ${
				error.code
			} ]`, function(done) {
				sandbox.stub(store.registers, 'getStudentsOfTeachers').throws(error);
				chai
					.request(server)
					.post(apiPath)
					.send({
						teacher: JOHN.email,
						notification: SAMPLE_NOTIFICATION
					})
					.end((_, res) => {
						res.should.have.status(500);
						res.body.should.be.an('object');
						res.body.should.have.property('message').equal(error.message);
						done();
					});
			});
		});
	});
});
