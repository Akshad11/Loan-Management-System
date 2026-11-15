@echo off
setlocal EnableDelayedExpansion

title LMS - Database Setup & Seed
echo ===============================================================================
echo     FinTech Enterprise Loan Management System (LMS)
echo     STEP 1: Database Setup, Schema Push & Initial Seeding
echo ===============================================================================
echo.

cd /d "%~dp0frontend"
if not exist "package.json" (
    echo [ERROR] Could not locate frontend directory.
    echo Please make sure this script is run from the project root.
    pause
    exit /b 1
)

echo [1/4] Verifying node_modules...
if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies (this may take a minute)...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed.
)

echo.
echo [2/4] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] Prisma generate failed. Check frontend/.env configuration.
    pause
    exit /b 1
)

echo.
echo [3/4] Pushing Schema & Creating SQL Tables...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo [ERROR] Prisma db push failed. Please verify PostgreSQL connection in frontend/.env.
    pause
    exit /b 1
)

echo.
echo [4/4] Seeding Master Data (Roles, Users, Branches, Loan Products)...
call npm run prisma:seed
if errorlevel 1 (
    echo [ERROR] Database seeding failed.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo   SUCCESS! Database initialized, schema synced, and master data seeded.
echo ===============================================================================
echo.
echo   Master Administrator Login:
echo   - Email:    admin@fintechlms.in
echo   - Password: LmsAdmin@2026
echo.
echo You can now run '2_run_prod.bat' to start the application in production mode!
echo ===============================================================================
echo.
pause
