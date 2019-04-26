exports.up = function(knex, Promise) {
	return knex.schema.createTable('registers', function(table) {
		table.increments('id').primary();
		table
			.integer('teacher_id', 11)
			.unsigned()
			.references('id')
			.inTable('teachers')
			.notNullable()
			.onDelete('cascade');
		table
			.integer('student_id', 11)
			.unsigned()
			.references('id')
			.inTable('students')
			.notNullable()
			.onDelete('cascade');
		table
			.integer('class_id', 11)
			.unsigned()
			.references('id')
			.inTable('classes')
			.notNullable()
			.onDelete('cascade');
		table.timestamp('created_at').defaultTo(knex.fn.now());
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('registers');
};
