const express = require('express');
const { check, validationResult } = require('express-validator/check');

const { getNotificationRecipients } = require('../actions');
const { ERROR_MSG, ERROR_TYPES } = require('../constants');

const app = (module.exports = express());
app.use(express.json());

/* ========================================== */
/*    Endpoint #4: Notification Recipients    */
/* ========================================== */

/**
 * Route serving notification recipients query.
 *
 * Takes a JSON body object as input:
 * {
 *   teacher: a valid teacher email
 *   notification: a notification text containing student tag(s)
 *   that starts with '@', followed by a valid student email
 * }
 *
 * Finds students who are eligible recipients of the notification.
 *
 * Responds with HTTP 200 and a JSON body object on success:
 * {
 *   recipients: an array of valid student emails found in the query
 * }
 *
 * @name post/api/retrievefornotifications
 * @function
 * @memberof module:routes/notification
 * @inner
 * @param {string} path - Express path.
 * @param {array} validators - Express input validation.
 * @param {callback} middleware - Express middleware.
 */
app.post(
	'/retrievefornotifications',
	[
		check('teacher')
			.exists()
			.isEmail()
			.withMessage('invalid email'),
		check('notification')
			.exists()
			.isString()
			.withMessage('invalid notification')
	],
	(req, res) => {
		const { teacher, notification } = req.body;
		const validationErrors = validationResult(req);
		// Validation error handling
		if (!validationErrors.isEmpty()) {
			const errors = validationErrors.array();
			const hasInvalidEmail =
				errors.filter(error => error.msg === 'invalid email').length > 0;
			const messageStart = hasInvalidEmail
				? ERROR_MSG.MALFORMED_EMAILS
				: ERROR_MSG.MALFORMED_NOTIFICATION;
			const messageEnd = hasInvalidEmail ? teacher : notification;
			return res.status(400).json({
				message: messageStart + ` ( ${JSON.stringify(messageEnd)} )`
			});
		}
		// Check notification recipients
		getNotificationRecipients(teacher, notification)
			.then(studentEmails => {
				res.status(200).json({ recipients: studentEmails });
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

// FIXME: Add other notification routes
