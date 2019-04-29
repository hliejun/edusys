module.exports.up = function(knex, Promise) {
	return knex.schema.createTable('notifications', function(table) {
		table.increments('id').primary();
		table
			.integer('teacher_id', 11)
			.unsigned()
			.references('id')
			.inTable('teachers')
			.notNullable()
			.onDelete('cascade');
		table.string('title').notNullable();
		table.string('content').notNullable();
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
	return knex.schema.dropTableIfExists('notifications');
};
