module.exports.up = function(knex, Promise) {
	return knex.schema.createTable('classes', function(table) {
		table.increments('id').primary();
		table.string('title').notNullable();
		// TODO: Consider removing singular teacher_id, or change to moderator_id
		table
			.integer('teacher_id', 11)
			.unsigned()
			.references('id')
			.inTable('teachers')
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
	return knex.schema.dropTableIfExists('classes');
};
