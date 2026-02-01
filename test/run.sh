#!/bin/bash
# Test Runner Script with Fresh Database (Mac/Linux)

echo "================================================"
echo "Running Tests with Fresh Database"
echo "================================================"
echo

# Step 1: Clean up old test containers
echo "Cleaning up old test containers..."
docker compose --profile testing down -v 2>/dev/null
docker rm -f postgres-test api-test test 2>/dev/null
echo "Cleanup complete"
echo

# Step 2: Rebuild API (CRITICAL - picks up code changes)
echo "Rebuilding API with latest code..."
docker compose --profile testing build api-test
echo "API rebuild complete"
echo

# Step 3: Start test database
echo "Starting test database..."
docker compose --profile testing up -d postgres-test
echo "Waiting for test database to be ready..."
sleep 10
echo

# Step 4: Start test API
echo "Starting test API..."
docker compose --profile testing up -d api-test
echo "Waiting for test API to be ready..."
sleep 10
echo

# Step 5: Rebuild tests (in case test code changed)
echo "Rebuilding test container..."
docker compose --profile testing build --no-cache test
echo

# Step 6: Run tests
echo "Running tests..."
echo "================================================"
docker compose --profile testing run --rm test

# Step 7: Cleanup
echo
echo "================================================"
echo "Cleaning up test environment..."
docker compose --profile testing down -v

echo
echo "Tests complete!"
echo "================================================"
