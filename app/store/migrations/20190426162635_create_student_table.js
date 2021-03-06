module.exports.up = function(knex, Promise) {
	return knex.schema.createTable('students', function(table) {
		table.increments('id').primary();
		table.string('name').notNullable();
		table
			.string('email')
			.unique()
			.notNullable();
		table
			.boolean('is_suspended')
			.notNullable()
			.defaultTo(false);
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
	return knex.schema.dropTableIfExists('students');
};
