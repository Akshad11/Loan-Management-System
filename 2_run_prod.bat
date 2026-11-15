@echo off
setlocal EnableDelayedExpansion

title LMS - Production Server
echo ===============================================================================
echo     FinTech Enterprise Loan Management System (LMS)
echo     STEP 2: Build & Run in Production Mode
echo ===============================================================================
echo.

cd /d "%~dp0frontend"
if not exist "package.json" (
    echo [ERROR] Could not locate frontend directory.
    echo Please make sure this script is run from the project root.
    pause
    exit /b 1
)

echo [1/2] Creating optimized Next.js production build...
echo [INFO] Running 'npm run build' (this compiles TypeScript and optimizes pages)...
call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] Production build failed. Please resolve the errors above.
    pause
    exit /b 1
)

echo.
echo [2/2] Starting Next.js Production Server...
echo ===============================================================================
echo   App URL:        http://localhost:3000
echo   Health Check:   http://localhost:3000/api/health
echo   Admin Login:    admin@fintechlms.in / LmsAdmin@2026
echo ===============================================================================
echo [INFO] Press Ctrl+C at any time to stop the server.
echo.

call npm start
