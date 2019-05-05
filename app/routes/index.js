const app = (module.exports = require('express')());

// Split routes by entities
app.use('/api', require('./student'));
app.use('/api', require('./notification'));
app.use('/api', require('./register'));
// app.use('/api', require('./teacher'));
// app.use('/api', require('./class'));

// Unsupported routes handling
app.all('*', (req, res) => {
	res.status(404).send({
		message: 'Endpoint not found. This service route is unsupported.'
	});
});
