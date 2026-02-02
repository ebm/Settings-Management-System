@echo off
REM UI Test Runner Script with Fresh Database (Windows)

echo ================================================
echo Running UI Tests with Fresh Database
echo ================================================
echo.

REM Step 1: Install dependencies if needed
echo Checking dependencies...
cd /d %~dp0..
if not exist node_modules\@playwright (
    echo Installing Playwright...
    npm install
    npx playwright install chromium
    echo.
)
cd /d %~dp0

REM Step 2: Clean up old test containers
echo Cleaning up old test containers...
docker compose --profile testing down -v >nul 2>&1
docker rm -f postgres-test api-test ui-test >nul 2>&1
echo Cleanup complete
echo.

REM Step 3: Rebuild API and UI (CRITICAL - picks up code changes)
echo Rebuilding API and UI with latest code...
docker compose --profile testing build api-test ui-test
echo Rebuild complete
echo.

REM Step 4: Start test database
echo Starting test database...
docker compose --profile testing up -d postgres-test
echo Waiting for test database to be ready...
timeout /t 10 /nobreak >nul
echo.

REM Step 5: Start test API
echo Starting test API...
docker compose --profile testing up -d api-test
echo Waiting for test API to be ready...
timeout /t 5 /nobreak >nul
echo.

REM Step 6: Start test UI
echo Starting test UI...
docker compose --profile testing up -d ui-test
echo Waiting for UI to be ready...
timeout /t 5 /nobreak >nul
echo.

REM Step 7: Run UI tests
echo Running UI tests...
echo ================================================
cd /d %~dp0..
npm run test:ui

REM Step 8: Cleanup
echo.
echo ================================================
echo Cleaning up test environment...
docker compose --profile testing down -v

echo.
echo UI tests complete!
echo ================================================
pause
