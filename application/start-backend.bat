@echo off
REM EduMate Backend Startup Script for Windows
REM Starts only the backend server

echo.
echo 🚀 Starting EduMate Backend...
echo.

REM Get the directory where this script is located
cd /d "%~dp0"

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Please create it from env.example
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo ⚠️  Virtual environment not found. Creating...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if Python dependencies are installed
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo ⚠️  Python dependencies not found. Installing...
    pip install -r requirements.txt
)

REM Kill any existing process on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo 🎯 Starting backend server...
echo.
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop
echo.

REM Start backend
python start_backend.py

