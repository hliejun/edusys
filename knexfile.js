const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
	path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
});

const connectionConfig = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME,
	port: process.env.DB_PORT
};

const dataConfig = {
	typeCast: function(field, next) {
		if (field.type === 'TINY' && field.length === 1) {
			return field.string() === '1';
		}
		return next();
	}
};

if (process.env.DB_CONNECTION && process.env.NODE_ENV !== 'development') {
	connectionConfig.socketPath = `/cloudsql/${process.env.DB_CONNECTION}`;
}

const config = {
	client: process.env.DB_CLIENT,
	connection: {
		...connectionConfig,
		...dataConfig
	},
	migrations: {
		directory: path.resolve(__dirname, 'app/store/migrations')
	},
	seeds: {
		directory: path.resolve(__dirname, 'app/store/seeds')
	}
};

module.exports = config;
