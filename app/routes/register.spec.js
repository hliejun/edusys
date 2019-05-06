const chai = require('chai');
const sandbox = require('sinon').createSandbox();

chai.use(require('chai-http'));
chai.use(require('chai-subset'));

const expect = chai.expect;
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

const { MAX, MAY } = STUDENTS;
const { JOHN } = TEACHERS;

const MALFORMED_STRINGS = [undefined, null, '', 123];

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

const MALFORMED_ARRAYS = [
	undefined,
	null,
	'',
	123,
	'max@email.com',
	{ 1: 'max@email.com', 2: 'may@email.com' },
	{}
];

describe('API Routes: Register', function() {
	const apiPath = '/api/register';
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

	context(`POST ${apiPath}`, function() {
		it('should validate and return status 204 when accepting valid teacher email and 1 valid student email as parameters', function(done) {
			chai
				.request(server)
				.post(apiPath)
				.send({
					teacher: JOHN.email,
					students: [MAX.email]
				})
				.end(function(_, res) {
					res.should.have.status(204);
					expect(res.body).to.deep.equal({});
					done();
				});
		});

		it('should validate and return status 204 when accepting valid teacher email and multiple valid student emails as parameters', function(done) {
			chai
				.request(server)
				.post(apiPath)
				.send({
					teacher: JOHN.email,
					students: [MAX.email, MAY.email]
				})
				.end(function(_, res) {
					res.should.have.status(204);
					expect(res.body).to.deep.equal({});
					done();
				});
		});

		[...MALFORMED_STRINGS, ...MALFORMED_EMAILS].forEach(function(input) {
			it(`should validate and return status 422 when teacher email is malformed: ${
				!input ? input : String(input)
			}`, function(done) {
				chai
					.request(server)
					.post(apiPath)
					.send({
						teacher: input,
						students: [MAX.email, MAY.email]
					})
					.end((_, res) => {
						res.should.have.status(422);
						res.body.should.be.an('object');
						res.body.should.have
							.property('message')
							.equal(
								`One or more email addresses provided are malformed or invalid. ( ${input} )`
							);
						done();
					});
			});
		});

		MALFORMED_ARRAYS.forEach(function(input) {
			it(`should validate and return status 422 when "students" field is not an array or is empty array: ${
				!input ? input : String(input)
			}`, function(done) {
				chai
					.request(server)
					.post(apiPath)
					.send({
						teacher: JOHN.email,
						students: input
					})
					.end((_, res) => {
						res.should.have.status(422);
						res.body.should.be.an('object');
						res.body.should.have
							.property('message')
							.equal(
								`Expected "students" field to be a non-empty array of emails. ( ${input} )`
							);
						done();
					});
			});
		});

		it('should validate and return status 422 when student email(s) are malformed', function(done) {
			chai
				.request(server)
				.post(apiPath)
				.send({
					teacher: JOHN.email,
					students: [...MALFORMED_EMAILS, MAX.email, MAY.email]
				})
				.end((_, res) => {
					res.should.have.status(422);
					res.body.should.be.an('object');
					res.body.should.have
						.property('message')
						.equal(
							`One or more email addresses provided are malformed or invalid. ( ${MALFORMED_EMAILS} )`
						);
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
				sandbox.stub(store.registers, 'createIfNotExists').throws(error);
				chai
					.request(server)
					.post(apiPath)
					.send({
						teacher: JOHN.email,
						students: [MAX.email, MAY.email]
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
				sandbox.stub(store.registers, 'createIfNotExists').throws(error);
				chai
					.request(server)
					.post(apiPath)
					.send({
						teacher: JOHN.email,
						students: [MAX.email, MAY.email]
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
