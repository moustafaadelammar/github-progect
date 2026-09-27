@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title HR System - Update and Start

echo ==========================================
echo       HR SYSTEM - UPDATE AND START
echo ==========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Git is not installed or not in PATH.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm is not available.
  pause
  exit /b 1
)

echo [1/7] Getting latest code from GitHub...
git fetch origin
if errorlevel 1 (
  echo [ERROR] GitHub update failed. Check Internet connection.
  pause
  exit /b 1
)

git rev-parse --verify origin/main >nul 2>&1
if errorlevel 1 (
  echo [ERROR] origin/main was not found.
  pause
  exit /b 1
)

echo [2/7] Protecting any local code changes...
git status --porcelain > "%TEMP%\hr_git_status.txt"
for %%A in ("%TEMP%\hr_git_status.txt") do if %%~zA GTR 0 (
  echo Local changes found. Saving them automatically in a backup stash...
  git stash push -u -m "HR System automatic backup before update"
  if errorlevel 1 (
    echo [ERROR] Could not protect local changes.
    del "%TEMP%\hr_git_status.txt" >nul 2>&1
    pause
    exit /b 1
  )
)
del "%TEMP%\hr_git_status.txt" >nul 2>&1

echo [3/7] Updating local project to latest main...
git reset --hard origin/main
if errorlevel 1 (
  echo [ERROR] Could not update the project.
  pause
  exit /b 1
)

git clean -fd -e node_modules -e logs
if errorlevel 1 (
  echo [WARNING] Some old untracked files could not be removed.
)

echo [4/7] Installing/updating dependencies...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  echo The current source code is updated, but dependencies need attention.
  pause
  exit /b 1
)

echo [5/7] Rebuilding the local startup launcher...
set "NODE_EXE="
for /f "delims=" %%N in ('where node 2^>nul') do (
  if not defined NODE_EXE set "NODE_EXE=%%N"
)

if not defined NODE_EXE (
  echo [ERROR] Could not resolve node.exe.
  pause
  exit /b 1
)

(
echo @echo off
echo setlocal EnableExtensions
echo cd /d "%%~dp0"
echo start "" /b "%NODE_EXE%" scripts\start-local.mjs
echo exit /b 0
) > "start-hr-system.cmd"

if errorlevel 1 (
  echo [ERROR] Could not create start-hr-system.cmd.
  pause
  exit /b 1
)

echo [6/7] Creating/updating Windows startup task...
schtasks /Delete /TN "HR System Offline" /F >nul 2>&1
schtasks /Create /TN "HR System Offline" /SC ONLOGON /TR "\"%CD%\start-hr-system.cmd\"" /F
if errorlevel 1 (
  echo [ERROR] Could not create the Windows startup task.
  echo Try running this file once as Administrator.
  pause
  exit /b 1
)

echo [7/7] Starting services...
call "%CD%\start-hr-system.cmd"

echo.
echo Waiting for services...
timeout /t 6 /nobreak >nul

powershell -NoProfile -Command "$c=Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue; if($c){exit 0}else{exit 1}"
if errorlevel 1 (
  echo [WARNING] HR System is not listening on port 5173.
  echo Check logs\vite.log
) else (
  echo [OK] HR System: http://localhost:5173
)

powershell -NoProfile -Command "$c=Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue; if($c){exit 0}else{exit 1}"
if errorlevel 1 (
  echo [WARNING] Fingerprint Gateway is not listening on port 8787.
  echo Check logs\fingerprint-gateway.log
) else (
  echo [OK] Fingerprint Gateway: http://127.0.0.1:8787
)

echo.
echo ==========================================
echo UPDATE + START COMPLETE
echo ==========================================
echo.
echo Future Windows logins will start the system automatically.
echo GitHub remains the source of code updates.
echo Local HR data is kept in the browser/local storage.
echo.
pause
