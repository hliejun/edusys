const { db } = require('./knex');

const classes = require('./dao/class');
const notifications = require('./dao/notification');
const registers = require('./dao/register');
const students = require('./dao/student');
const teachers = require('./dao/teacher');

module.exports = {
	classes,
	data: db,
	notifications,
	registers,
	students,
	teachers
};
