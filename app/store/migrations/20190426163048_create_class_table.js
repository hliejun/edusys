exports.up = function(knex, Promise) {
	return knex.schema.createTable('classes', function(table) {
		table.increments('id').primary();
		table.string('title').notNullable();
		table
			.integer('teacher_id', 11)
			.unsigned()
			.references('id')
			.inTable('teachers')
			.notNullable()
			.onDelete('cascade');
		table.timestamp('created_at').defaultTo(knex.fn.now());
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('classes');
};
