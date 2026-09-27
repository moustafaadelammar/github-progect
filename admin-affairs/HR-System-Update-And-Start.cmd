@echo off
setlocal EnableExtensions
title HR System - One Click Update and Start

set "REPO_URL=https://github.com/moustafaadelammar/github-progect.git"
set "ROOT=C:\HR-System"
set "REPO=%ROOT%\github-progect"
set "APP=%REPO%\admin-affairs"

echo ==========================================
echo      HR SYSTEM - UPDATE AND START
echo ==========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Git is not installed.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm is not available.
  pause
  exit /b 1
)

echo [1/8] Preparing project folder...
if not exist "%ROOT%" mkdir "%ROOT%"

if not exist "%REPO%\.git" (
  echo No local Git copy found.
  echo Cloning the project from GitHub...
  if exist "%REPO%" rmdir /s /q "%REPO%"
  git clone "%REPO_URL%" "%REPO%"
  if errorlevel 1 (
    echo [ERROR] Could not clone the project.
    pause
    exit /b 1
  )
) else (
  echo [OK] Existing Git repository found.
)

cd /d "%REPO%"

echo [2/8] Getting latest code...
git fetch origin
if errorlevel 1 (
  echo [ERROR] Could not get the latest GitHub version.
  pause
  exit /b 1
)

echo [3/8] Saving local code changes...
git status --porcelain > "%TEMP%\hr_git_status.txt"
for %%A in ("%TEMP%\hr_git_status.txt") do if %%~zA GTR 0 (
  git stash push -u -m "HR System automatic backup before update" >nul
)
del "%TEMP%\hr_git_status.txt" >nul 2>&1

echo [4/8] Updating to latest main...
git reset --hard origin/main
if errorlevel 1 (
  echo [ERROR] Could not update the project.
  pause
  exit /b 1
)

git clean -fd -e node_modules -e logs >nul 2>&1

cd /d "%APP%"

echo [5/8] Installing dependencies...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

if not exist "logs" mkdir logs

echo [6/8] Creating Windows startup launcher...
set "NODE_EXE="
for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"

if not defined NODE_EXE (
  echo [ERROR] node.exe could not be found.
  pause
  exit /b 1
)

(
echo @echo off
echo setlocal EnableExtensions
echo cd /d "%%~dp0"
echo start "" /b "%NODE_EXE%" scripts\start-local.mjs
echo exit /b 0
) > "%APP%\start-hr-system.cmd"

echo [7/8] Creating Windows automatic startup...
schtasks /Delete /TN "HR System Offline" /F >nul 2>&1
schtasks /Create /TN "HR System Offline" /SC ONLOGON /TR "\"%APP%\start-hr-system.cmd\"" /F >nul
if errorlevel 1 (
  echo [WARNING] Startup task could not be created.
  echo Run this file once as Administrator.
)

echo Starting HR System...
call "%APP%\start-hr-system.cmd"

echo [8/8] Checking services...
timeout /t 6 /nobreak >nul

powershell -NoProfile -Command "$x=Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue; if($x){exit 0}else{exit 1}"
if errorlevel 1 (
  echo [WARNING] HR System is not listening on 5173.
  echo Check: %APP%\logs\vite.log
) else (
  echo [OK] HR System: http://localhost:5173
)

powershell -NoProfile -Command "$x=Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue; if($x){exit 0}else{exit 1}"
if errorlevel 1 (
  echo [WARNING] Fingerprint Gateway is not listening on 8787.
  echo Check: %APP%\logs\fingerprint-gateway.log
) else (
  echo [OK] Fingerprint Gateway: http://127.0.0.1:8787
)

echo.
echo Opening HR System...
start "" http://localhost:5173

echo.
echo ==========================================
echo          HR SYSTEM IS READY
echo ==========================================
echo.
timeout /t 3 /nobreak >nul
exit /b 0
