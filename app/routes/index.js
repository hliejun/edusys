const { ERROR_MSG } = require('../constants');

const app = (module.exports = require('express')());

// Split routes by entities
app.use('/api', require('./student'));
app.use('/api', require('./notification'));
app.use('/api', require('./register'));

// Unsupported routes handling
app.all('*', (req, res) => {
	res.status(404).json({
		message: ERROR_MSG.UNSUPPORTED_ROUTES
	});
});
