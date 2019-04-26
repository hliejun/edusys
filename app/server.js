import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';

import routes from './routes';

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

// TODO: Add logging middleware

// TODO: Add error handler middleware

// Mount API routes
app.use(routes);

// Start server
const MODE = process.env.APP_ENV;
const PORT = process.env.PORT;
app.listen(PORT, () => {
	console.log(`Server running in ${MODE} mode, listening on port ${PORT}...`);
});
