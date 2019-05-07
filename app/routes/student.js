const express = require('express');
const {
	check,
	oneOf,
	query,
	validationResult
} = require('express-validator/check');

const validator = require('../utils/validator');
const { findCommonStudents, suspendStudent } = require('../actions');
const { ERROR_MSG, ERROR_TYPES } = require('../constants');

const app = (module.exports = express());
app.use(express.json());

/* =================================== */
/*    Endpoint #2: Common Students     */
/* =================================== */

/**
 * Route serving common students query.
 *
 * Takes an url query parameter as an input:
 *   teacher: a valid teacher email or an array of valid teacher emails
 *
 * Finds students who are registered to the teacher email or all teacher emails
 * in the array.
 *
 * Responds with HTTP 200 and a JSON body object on success:
 * {
 *   students: an array of valid student emails found in the query
 * }
 *
 * @name get/api/commonstudents
 * @function
 * @memberof module:routes/student
 * @inner
 * @param {string} path - Express path.
 * @param {callback} validators - Express input validation.
 * @param {callback} middleware - Express middleware.
 */
app.get(
	'/commonstudents',
	oneOf([
		[
			query('teacher')
				.exists()
				.isString()
				.withMessage('invalid type'),
			query('teacher')
				.isEmail()
				.withMessage('invalid email')
		],
		[
			query('teacher')
				.exists()
				.custom(validator.isNonEmptyArray)
				.withMessage('invalid type'),
			query('teacher[*]')
				.isEmail()
				.withMessage('invalid email')
		]
	]),
	(req, res) => {
		const validationErrors = validationResult(req);
		// Validation error handling
		if (!validationErrors.isEmpty()) {
			return res.status(400).json({
				message:
					ERROR_MSG.MALFORMED_TEACHER +
					` ( ${JSON.stringify(req.query.teacher)} )`
			});
		}
		// Data sanitisation
		const teachers = [].concat(req.query.teacher);
		const uniqueTeachers = [...new Set(teachers)];
		// Find common students
		findCommonStudents(uniqueTeachers)
			.then(studentEmails => {
				res.status(200).json({ students: studentEmails });
			})
			.catch(error => {
				let statusCode;
				switch (error.code) {
				case ERROR_TYPES.ER_IDEN_OBJECT:
				case ERROR_TYPES.ER_NOT_FOUND:
				case ERROR_TYPES.ER_UNIQ_CONSTRAINT:
					statusCode = 422;
					break;
				default:
					statusCode = 500;
				}
				res.status(statusCode).json({ message: error.message });
			});
	}
);

/* =================================== */
/*    Endpoint #3: Suspend Students    */
/* =================================== */

/**
 * Route serving student suspension.
 *
 * Takes a JSON body object as input:
 * {
 *   student: a valid student email
 * }
 *
 * Suspends the student with the email by setting the suspension flag.
 *
 *
 * Responds with HTTP 204 on success.
 *
 * @name post/api/suspend
 * @function
 * @memberof module:routes/student
 * @inner
 * @param {string} path - Express path.
 * @param {array} validators - Express input validation.
 * @param {callback} middleware - Express middleware.
 */
app.post(
	'/suspend',
	[
		check('student')
			.exists()
			.isEmail()
	],
	(req, res) => {
		const validationErrors = validationResult(req);
		// Validation error handling
		if (!validationErrors.isEmpty()) {
			return res.status(400).json({
				message:
					ERROR_MSG.MALFORMED_EMAILS +
					` ( ${JSON.stringify(req.body.student)} )`
			});
		}
		// Suspend student
		suspendStudent(req.body.student)
			.then(() => {
				res.status(204).send();
			})
			.catch(error => {
				let statusCode;
				switch (error.code) {
				case ERROR_TYPES.ER_IDEN_OBJECT:
				case ERROR_TYPES.ER_NOT_FOUND:
				case ERROR_TYPES.ER_UNIQ_CONSTRAINT:
					statusCode = 422;
					break;
				default:
					statusCode = 500;
				}
				res.status(statusCode).json({ message: error.message });
			});
	}
);

// FIXME: Add other student routes
