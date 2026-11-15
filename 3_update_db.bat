@echo off
setlocal EnableDelayedExpansion

title LMS - Database & SQL Update
echo ===============================================================================
echo     FinTech Enterprise Loan Management System (LMS)
echo     STEP 3: Update Database Schema (SQL Update)
echo ===============================================================================
echo.

cd /d "%~dp0frontend"
if not exist "package.json" (
    echo [ERROR] Could not locate frontend directory.
    echo Please make sure this script is run from the project root.
    pause
    exit /b 1
)

echo [1/2] Regenerating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] Prisma generate failed.
    pause
    exit /b 1
)

echo.
echo [2/2] Updating SQL Database Schema (Pushing Schema Changes)...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo [ERROR] Database schema update failed. Please check connection in frontend/.env.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo   SUCCESS! Database schema has been updated successfully in PostgreSQL.
echo ===============================================================================
echo.
echo Optional actions:
echo   [1] Open Prisma Studio (Visual Web DB Explorer on http://localhost:5555)
echo   [2] Re-seed Database (Refresh roles, users, and master data)
echo   [3] Exit
echo.
set /p choice="Enter choice [1-3] (or press Enter to exit): "

if "%choice%"=="1" (
    echo [INFO] Starting Prisma Studio at http://localhost:5555...
    call npx prisma studio
    goto end
)

if "%choice%"=="2" (
    echo [INFO] Running database seed...
    call npm run prisma:seed
    pause
    goto end
)

:end
echo Exiting...
