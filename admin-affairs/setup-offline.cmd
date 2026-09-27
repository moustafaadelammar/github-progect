@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo HR System - Offline First Setup
echo ==========================================
echo.
echo Installing/updating local dependencies...
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed. Check Node.js/npm and Internet access for the first setup.
  pause
  exit /b 1
)

echo.
echo Creating Windows startup task...
schtasks /Create /TN "HR System Offline" /SC ONLOGON /TR "%CD%\start-hr-system.cmd" /F >nul
if errorlevel 1 (
  echo Failed to create Windows startup task.
  pause
  exit /b 1
)

echo.
echo Starting HR System now...
call start-hr-system.cmd
echo.
echo Setup complete.
echo Open: http://localhost:5173
echo Fingerprint Gateway: http://127.0.0.1:8787
echo.
pause
