@echo off
REM EduMate Frontend Startup Script for Windows
REM Starts only the frontend server

echo.
echo 🚀 Starting EduMate Frontend...
echo.

REM Get the directory where this script is located
cd /d "%~dp0"

REM Check if Node modules are installed
if not exist "node_modules" (
    echo ⚠️  Node modules not found. Installing...
    call npm install
)

REM Kill any existing process on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo 🎯 Starting frontend server...
echo.
echo    Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo.

REM Start frontend
call npm run dev

