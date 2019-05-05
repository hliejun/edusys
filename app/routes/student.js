const app = (module.exports = require('express')());

/* =================================== */
/*    Endpoint #2: Common Students     */
/* =================================== */

/**
 * Route serving common students query.
 *
 * Takes an url parameter as an input:
 *   teacher: an array of valid teacher emails
 *
 * Finds students who are registered to all teacher emails
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
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
app.get('/commonstudents', (req, res) => {
	// get inputs
	// validate and sanitize inputs
	// invoke action with inputs
	// receive action outputs on resolving promise
	// build response and send
	// catch errors generically and respond with status codes and messages
	res.status(200).send();
});

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
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
app.post('/suspend', (req, res) => {
	// get inputs
	// validate and sanitize inputs
	// invoke action with inputs
	// receive action outputs on resolving promise
	// build response and send
	// catch errors generically and respond with status codes and messages
	res.status(204).send();
});

// FIXME: Add other student routes
