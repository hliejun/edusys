const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const path = require('path');

const routes = require('./routes');

// TODO: Add CORS, JWT and rate-limiting

// Setup variables by environment
dotenv.config({
	path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`)
});

// Initialize Express application
const app = express();

// Setup request body-parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable Cross-Origin Resource Sharing (CORS) for all domains
app.use(cors());

// Mount API routes
app.use(routes);

// Start server
const MODE = process.env.APP_ENV;
const PORT = process.env.PORT;
app.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Server running in ${MODE} mode, listening on port ${PORT}...`);
});

// Testing compatibility
module.exports = app;
