@echo off
REM Test Runner Script with Fresh Database (Windows)

echo ================================================
echo Running Tests with Fresh Database
echo ================================================
echo.

REM Step 1: Clean up old test containers
echo Cleaning up old test containers...
docker compose --profile testing down -v >nul 2>&1
docker rm -f postgres-test api-test test >nul 2>&1
echo Cleanup complete
echo.

REM Step 2: Rebuild API (CRITICAL - picks up code changes)
echo Rebuilding API with latest code...
docker compose --profile testing build api-test
echo API rebuild complete
echo.

REM Step 3: Start test database
echo Starting test database...
docker compose --profile testing up -d postgres-test
echo Waiting for test database to be ready...
timeout /t 10 /nobreak >nul
echo.

REM Step 4: Start test API
echo Starting test API...
docker compose --profile testing up -d api-test
echo Waiting for test API to be ready...
timeout /t 10 /nobreak >nul
echo.

REM Step 5: Rebuild tests (in case test code changed)
echo Rebuilding test container...
docker compose --profile testing build --no-cache test
echo.

REM Step 6: Run tests
echo Running tests...
echo ================================================
docker compose --profile testing run --rm test

REM Step 7: Cleanup
echo.
echo ================================================
echo Cleaning up test environment...
docker compose --profile testing down -v

echo.
echo Tests complete!
echo ================================================
pause