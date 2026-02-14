@echo off
REM EduMate Startup Script for Windows
REM This script starts both the backend and frontend servers

setlocal enabledelayedexpansion

echo.
echo 🚀 Starting EduMate...
echo.

REM Get the directory where this script is located
cd /d "%~dp0"

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from env.example...
    if exist env.example (
        copy env.example .env >nul
        echo ⚠️  Please edit .env and add your API keys before continuing.
        echo    Required: DATABASE_URL, GROQ_API_KEY
        echo.
        pause
    ) else (
        echo ❌ env.example not found. Please create .env manually.
        exit /b 1
    )
)

REM Check if virtual environment exists
if not exist "venv" (
    echo ⚠️  Virtual environment not found. Creating...
    python -m venv venv
    echo ✅ Virtual environment created
    echo.
)

REM Activate virtual environment
echo 📦 Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if Python dependencies are installed
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo ⚠️  Python dependencies not found. Installing...
    pip install -r requirements.txt
    echo ✅ Python dependencies installed
    echo.
)

REM Check if Node modules are installed
if not exist "node_modules" (
    echo ⚠️  Node modules not found. Installing...
    call npm install
    echo ✅ Node modules installed
    echo.
)

REM Kill any existing processes on ports 8000 and 3000
echo 🧹 Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo ✅ Cleanup complete
echo.

REM Start both servers using concurrently
echo 🎯 Starting backend and frontend servers...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:3000
echo    API Docs: http://localhost:8000/docs
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Use npm script to start both servers
call npm run dev:full

