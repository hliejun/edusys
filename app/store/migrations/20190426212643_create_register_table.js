module.exports.up = function(knex, Promise) {
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
		table
			.dateTime('created_at', { precision: 6 })
			.notNullable()
			.defaultTo(knex.fn.now(6));
		table
			.dateTime('updated_at', { precision: 6 })
			.notNullable()
			.defaultTo(knex.fn.now(6));
	});
};

module.exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('registers');
};
