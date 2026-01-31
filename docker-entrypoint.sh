#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Run database initialization
echo "Initializing database schema..."
node dist/init-db.js

# Start the server
echo "Starting API server..."
node dist/server.js