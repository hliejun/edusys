const app = (module.exports = require('express')());

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
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
app.post('/retrievefornotifications', (req, res) => {
	// get inputs
	// validate and sanitize inputs
	// invoke action with inputs
	// receive action outputs on resolving promise
	// build response and send
	// catch errors generically and respond with status codes and messages
	res.status(200).send();
});

// FIXME: Add other notification routes
