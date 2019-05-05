const app = (module.exports = require('express')());

/* ============================ */
/*     Endpoint #1: Register    */
/* ============================ */

/**
 * Route serving student registration.
 *
 * Takes a JSON body object as input:
 * {
 *    teacher: a valid teacher email
 *    students: an array of valid student emails
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
app.post('/register', (req, res) => {
	// get inputs
	// validate and sanitize inputs
	// invoke action with inputs
	// receive action outputs on resolving promise
	// build response and send
	// catch errors generically and respond with status codes and messages
	res.status(204).send();
});

// TODO: Add other register routes
