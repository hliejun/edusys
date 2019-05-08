const DEFAULT_STUDENT_NAME = 'student';
const DEFAULT_TEACHER_NAME = 'teacher';
const DEFAULT_TEACHER_PASSWORD = 'password';

const PRECISION_TIMESTAMP = 6;

// NOTE: actual production should use at least 12
const SALT_ROUNDS = process.env.NODE_ENV === 'development' ? 0 : 1;

const TABLE = {
	CLASS: 'classes',
	NOTIFICATION: 'notifications',
	REGISTER: 'registers',
	STUDENT: 'students',
	TEACHER: 'teachers'
};

module.exports = {
	DEFAULT_STUDENT_NAME,
	DEFAULT_TEACHER_NAME,
	DEFAULT_TEACHER_PASSWORD,
	PRECISION_TIMESTAMP,
	SALT_ROUNDS,
	TABLE
};
