@echo off
setlocal EnableDelayedExpansion

REM -----------------------------------------------------------------------------
REM FinTech Enterprise Loan Management System (LMS) - Docker Launcher
REM -----------------------------------------------------------------------------

if /i "%~1"=="start" goto action_start
if /i "%~1"=="stop" goto action_stop
if /i "%~1"=="restart" goto action_restart
if /i "%~1"=="logs" goto action_logs
if /i "%~1"=="seed" goto action_seed
if /i "%~1"=="reset" goto action_reset
if /i "%~1"=="status" goto action_status

:menu
cls
echo ===============================================================================
echo     FinTech Enterprise Loan Management System (LMS) -- Docker Manager
echo ===============================================================================
echo.
echo   [1] Start LMS Stack (Build and Run Next.js + PostgreSQL)
echo   [2] Stop LMS Stack (Gracefully halt all containers)
echo   [3] Restart LMS Stack
echo   [4] Stream Real-time Container Logs
echo   [5] Check Stack Status
echo   [6] Re-seed Database (Reset initial admin and master data)
echo   [7] Open Web Portal in Default Browser (http://localhost:3000)
echo   [8] Full Factory Clean Reset (Wipes database volumes and rebuilds)
echo   [0] Exit
echo.
echo ===============================================================================
set /p choice="Enter option [0-8]: "

if "%choice%"=="1" goto action_start
if "%choice%"=="2" goto action_stop
if "%choice%"=="3" goto action_restart
if "%choice%"=="4" goto action_logs
if "%choice%"=="5" goto action_status
if "%choice%"=="6" goto action_seed
if "%choice%"=="7" goto action_open_browser
if "%choice%"=="8" goto action_reset
if "%choice%"=="0" goto action_exit

echo Invalid option selected.
timeout /t 2 >nul
goto menu

:check_docker
echo [INFO] Checking Docker engine availability...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker executable was not found on your system PATH.
    echo Please install Docker Desktop for Windows:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Docker engine is currently not running.
    if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        echo [INFO] Attempting to launch Docker Desktop automatically...
        start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
        echo [INFO] Waiting for Docker daemon to initialize...
        
        set count=0
        :wait_docker_loop
        timeout /t 3 >nul
        docker info >nul 2>&1
        if !errorlevel! equ 0 (
            echo [OK] Docker daemon is now online!
            goto docker_ready
        )
        set /a count+=1
        if !count! leq 25 (
            echo Waiting for Docker... (!count!/25)
            goto wait_docker_loop
        )
    )
    echo [ERROR] Docker Desktop could not be reached. Please launch Docker Desktop manually,
    echo wait until the engine starts, and then run this script again.
    echo.
    pause
    exit /b 1
)

:docker_ready
echo [OK] Docker daemon is active and responsive.
exit /b 0

:action_start
cls
echo ===============================================================================
echo   Starting FinTech Enterprise Loan Management System (LMS)...
echo ===============================================================================
call :check_docker
if %errorlevel% neq 0 goto menu

echo.
echo [INFO] Building images and starting containers in detached mode...
docker compose up --build -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start containers. Check Docker output above.
    pause
    goto menu
)

echo.
echo [INFO] Waiting for Next.js application to become responsive at http://localhost:3000 ...
set attempt=0
:poll_web
timeout /t 3 >nul
set /a attempt+=1
curl -s -m 2 http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 goto web_ready
if !attempt! leq 20 (
    echo Initializing services... (!attempt!/20)
    goto poll_web
)

:web_ready
echo.
echo ===============================================================================
echo   Loan Management System (LMS) is UP and RUNNING!
echo ===============================================================================
echo.
echo   - Web Application:       http://localhost:3000
echo   - Health Check:          http://localhost:3000/api/health
echo   - PostgreSQL Database:   localhost:5432 (database: loan_ms_db)
echo.
echo   - Default Administrator Credentials:
echo     * Email / Username:    admin@fintechlms.in  (or: admin)
echo     * Master Password:     LmsAdmin@2026
echo.
echo ===============================================================================
echo.
set /p opennow="Do you want to launch the portal in your browser now? (Y/N): "
if /i "%opennow%"=="Y" start http://localhost:3000
if /i "%opennow%"=="y" start http://localhost:3000

echo.
pause
goto menu

:action_stop
cls
echo ===============================================================================
echo   Stopping Loan Management System containers...
echo ===============================================================================
docker compose down
echo.
echo [OK] All LMS containers have stopped gracefully.
pause
goto menu

:action_restart
cls
echo ===============================================================================
echo   Restarting Loan Management System containers...
echo ===============================================================================
docker compose restart
echo.
echo [OK] Containers restarted.
pause
goto menu

:action_logs
cls
echo ===============================================================================
echo   Streaming Real-time Container Logs (Press Ctrl+C to exit)
echo ===============================================================================
docker compose logs -f
pause
goto menu

:action_status
cls
echo ===============================================================================
echo   Container Status
echo ===============================================================================
docker compose ps
echo.
exit /b 0

:action_seed
cls
echo ===============================================================================
echo   Re-seeding Initial Master Data and Administrator Account
echo ===============================================================================
echo.
echo [NOTICE] This will refresh roles, products, branches, and the master admin.
set /p confirm="Are you sure you want to proceed? (Y/N): "
if /i not "%confirm%"=="Y" goto menu

echo.
echo [INFO] Running seed script inside Next.js container...
docker exec -it loan_ms_app npx tsx prisma/seed.ts
if %errorlevel% neq 0 (
    echo [INFO] Container not currently running. Running one-off seed runner...
    docker compose run --rm -e FORCE_SEED=true web npx tsx prisma/seed.ts
)
echo.
echo [OK] Database seeding finished.
pause
goto menu

:action_open_browser
start http://localhost:3000
goto menu

:action_reset
cls
echo ===============================================================================
echo   FACTORY RESET: Remove Containers, Volumes, and Rebuild
echo ===============================================================================
echo.
echo [CAUTION] This will delete the PostgreSQL data volume and all stored data!
set /p confirmreset="Type 'RESET' to confirm complete factory wipe: "
if not "%confirmreset%"=="RESET" (
    echo Aborted.
    pause
    goto menu
)

echo.
echo [INFO] Tearing down containers and deleting persistent volumes...
docker compose down -v
echo [INFO] Rebuilding images from scratch...
docker compose up --build -d
echo.
echo [OK] Factory reset complete. Stack is bootstrapping fresh.
pause
goto menu

:action_exit
exit /b 0
