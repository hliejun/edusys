exports.up = function(knex, Promise) {
	return knex.schema.createTable('students', function(table) {
		table.increments('id').primary();
		table.string('name').notNullable();
		table.string('email').notNullable();
		table
			.boolean('is_suspended')
			.notNullable()
			.defaultTo(false);
		table.timestamp('created_at').defaultTo(knex.fn.now());
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('students');
};
