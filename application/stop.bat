@echo off
REM EduMate Stop Script for Windows
REM Stops all running EduMate processes

echo.
echo 🛑 Stopping EduMate servers...
echo.

REM Stop backend (port 8000)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo    Stopping backend (port 8000)...
    taskkill /F /PID %%a >nul 2>&1
    echo    ✅ Backend stopped
    goto :backend_done
)
echo    ℹ️  No process running on port 8000
:backend_done

REM Stop frontend (port 3000)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo    Stopping frontend (port 3000)...
    taskkill /F /PID %%a >nul 2>&1
    echo    ✅ Frontend stopped
    goto :frontend_done
)
echo    ℹ️  No process running on port 3000
:frontend_done

echo.
echo ✅ All servers stopped
echo.

