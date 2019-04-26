exports.up = function(knex, Promise) {
	return knex.schema.createTable('teachers', function(table) {
		table.increments('id').primary();
		table.string('name').notNullable();
		table.string('email').notNullable();
		// TODO: encrypt/salt password using bcrypt in ORM...
		table.string('password').notNullable();
		table.timestamp('created_at').defaultTo(knex.fn.now());
		table.timestamp('updated_at').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('teachers');
};
