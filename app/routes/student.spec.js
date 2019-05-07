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

const MALFORMED_TEACHER = [undefined, null, 123, {}, []];

describe('API Routes: Student', function() {
	const apiPath = '/api/commonstudents';
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

	context(`GET ${apiPath}`, function() {
		beforeEach(function() {
			return store.teachers
				.bulkCreate([BOB, JOHN, JANE])
				.then(function() {
					return store.students.bulkCreate([MAX, MAY, MATT]);
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

		it('should validate and return status 200 with array of student emails when accepting 1 valid teacher email as parameter', function(done) {
			chai
				.request(server)
				.get(apiPath)
				.query({
					teacher: JOHN.email
				})
				.end(function(_, res) {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have
						.property('students')
						.of.length(2)
						.that.containSubset([MAX.email, MATT.email]);
					done();
				});
		});

		it('should validate and return status 200 with array of student emails when accepting array of teacher emails as parameter', function(done) {
			chai
				.request(server)
				.get(apiPath)
				.query({
					teacher: [JOHN.email, JANE.email]
				})
				.end(function(_, res) {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have
						.property('students')
						.of.length(1)
						.that.containSubset([MATT.email]);
					done();
				});
		});

		MALFORMED_TEACHER.forEach(function(input) {
			it(`should validate and return status 400 when "teacher" field is malformed: ${JSON.stringify(
				input
			)}`, function(done) {
				chai
					.request(server)
					.get(apiPath)
					.query({
						teacher: input
					})
					.end((_, res) => {
						const description = JSON.stringify(input);
						res.should.have.status(400);
						res.body.should.be.an('object');
						res.body.should.have
							.property('message')
							.equal(
								`Expected "teacher" field to be an email or an array of emails. ( ${
									description === '[]' || description === '{}'
										? 'undefined'
										: typeof input === 'number'
											? JSON.stringify(String(input))
											: input === null
												? JSON.stringify('')
												: description
								} )`
							);
						done();
					});
			});
		});

		[MALFORMED_EMAILS, ...MALFORMED_EMAILS].forEach(function(input) {
			it(`should validate and return status 400 when "teacher" field is not a valid email or array of valid emails: ${JSON.stringify(
				input
			)}`, function(done) {
				chai
					.request(server)
					.get(apiPath)
					.query({
						teacher: input
					})
					.end((_, res) => {
						res.should.have.status(400);
						res.body.should.be.an('object');
						res.body.should.have
							.property('message')
							.equal(
								`Expected "teacher" field to be an email or an array of emails. ( ${JSON.stringify(
									input
								)} )`
							);
						done();
					});
			});
		});

		it('should return status 422 with appropriate error messages when 1 or more teacher(s) with matching email does not exist', function(done) {
			chai
				.request(server)
				.get(apiPath)
				.query({
					teacher: [JOHN.email, MAY.email]
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
				sandbox.stub(store.students, 'getByIds').throws(error);
				chai
					.request(server)
					.get(apiPath)
					.query({
						teacher: JOHN.email
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
				sandbox.stub(store.students, 'getByIds').throws(error);
				chai
					.request(server)
					.get(apiPath)
					.query({
						teacher: JOHN.email
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
