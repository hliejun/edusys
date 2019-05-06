const express = require('express');
const { check, validationResult } = require('express-validator/check');

const validator = require('../utils/validator');
const { registerStudents } = require('../actions');
const { ERROR_MSG, ERROR_TYPES } = require('../constants');

const app = (module.exports = express());
app.use(express.json());

/* ============================ */
/*     Endpoint #1: Register    */
/* ============================ */

/**
 * Route serving student registration.
 *
 * Takes a JSON body object as input:
 * {
 *   teacher: a valid teacher email
 *   students: an array of valid student emails
 * }
 *
 * Registers all students to the teacher, creating
 * any teacher or students if not already in the system.
 *
 * Responds with HTTP 204 on success.
 *
 * @name post/api/register
 * @function
 * @memberof module:routes/register
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
app.post(
	'/register',
	[
		check('students')
			.custom(validator.isNonEmptyArray)
			.withMessage('invalid array'),
		check('teacher')
			.isEmail()
			.withMessage('invalid email'),
		check('students[*]')
			.isEmail()
			.withMessage('invalid email')
	],
	(req, res) => {
		const validationErrors = validationResult(req);
		// Validation error handling
		if (!validationErrors.isEmpty()) {
			// Handle invalid students array
			const errorDetails = validationErrors.array();
			if (errorDetails[0].msg === 'invalid array') {
				return res.status(422).json({
					message:
						ERROR_MSG.MALFORMED_STUDENTS_ARRAY + ` ( ${req.body.students} )`
				});
			}
			// Handle invalid emails
			const invalidEmails = errorDetails.map(error =>
				error.value === undefined ? 'undefined' : String(error.value)
			);
			return res.status(422).json({
				message: ERROR_MSG.MALFORMED_EMAILS + ` ( ${invalidEmails.toString()} )`
			});
		}
		// Registration
		const { teacher, students } = req.body;
		registerStudents(teacher, students)
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

// FIXME: Add other register routes
