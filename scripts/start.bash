# Migrate database
NODE_ENV=production knex migrate:latest

# Start server
NODE_ENV=production node dist/server.js
