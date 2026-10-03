@echo off
setlocal EnableExtensions EnableDelayedExpansion
title HR System - One Click Update and Start

set "REPO_URL=https://github.com/moustafaadelammar/github-progect.git"
set "ROOT=C:\HR-System"
set "REPO=%ROOT%\github-progect"
set "APP=%REPO%\admin-affairs"
set "OFFLINE=0"
if /I "%~1"=="offline" set "OFFLINE=1"

echo.
echo ================================================
echo        HR SYSTEM - UPDATE / VALIDATE / START
echo ================================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Git is not installed or not in PATH.
  echo Install Git for Windows, then run this file again.
  pause
  exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm.cmd was not found.
  pause
  exit /b 1
)

if not exist "%ROOT%" mkdir "%ROOT%"

if not exist "%REPO%\.git" (
  if "%OFFLINE%"=="1" (
    echo [ERROR] Offline mode requested, but the local project does not exist.
    echo First run this file once online so the project and dependencies are installed.
    pause
    exit /b 1
  )
  echo [1/7] Downloading the complete project from GitHub...
  if exist "%REPO%" rmdir /s /q "%REPO%"
  git clone "%REPO_URL%" "%REPO%"
  if errorlevel 1 (
    echo [ERROR] Git clone failed.
    pause
    exit /b 1
  )
) else if "%OFFLINE%"=="0" (
  echo [1/7] Pulling the latest version from GitHub...
  cd /d "%REPO%"
  git fetch origin
  if errorlevel 1 (
    echo [WARNING] GitHub could not be reached. Continuing with the local copy.
  ) else (
    git reset --hard origin/main
    if errorlevel 1 (
      echo [ERROR] Could not reset the local copy to origin/main.
      pause
      exit /b 1
    )
    git clean -fd -e node_modules -e logs
  )
) else (
  echo [1/7] OFFLINE mode - using the existing local project.
)

if not exist "%APP%\package.json" (
  echo [ERROR] admin-affairs package.json was not found.
  pause
  exit /b 1
)

cd /d "%APP%"

echo [2/7] Installing / verifying dependencies...
call npm.cmd install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo [3/7] Running TypeScript + Vite production build check...
call npm.cmd run build
if errorlevel 1 (
  echo.
  echo [ERROR] BUILD FAILED - the HR System will NOT be started.
  echo Fix the build error shown above first.
  pause
  exit /b 1
)

echo [4/7] Preparing local logs...
if not exist "%APP%\logs" mkdir "%APP%\logs"

echo [5/7] Starting fingerprint gateway and HR System...
call npm.cmd run start:local
if errorlevel 1 (
  echo.
  echo [ERROR] Local services did not start correctly.
  echo Check these files:
  echo   %APP%\logs\fingerprint-gateway.log
  echo   %APP%\logs\vite.log
  pause
  exit /b 1
)

echo [6/7] Verifying local ports...
powershell -NoProfile -Command "$x=Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue; if($x){exit 0}else{exit 1}"
if errorlevel 1 (
  echo [ERROR] HR System is not listening on port 5173.
  echo.
  echo ---- Vite log ----
  type "%APP%\logs\vite.log" 2>nul
  echo ------------------
  pause
  exit /b 1
)
powershell -NoProfile -Command "$x=Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue; if($x){exit 0}else{exit 1}"
if errorlevel 1 echo [WARNING] Fingerprint Gateway is not listening on 8787.


echo [7/7] Opening HR System...
start "" http://localhost:5173/

echo.
echo ================================================
echo              HR SYSTEM IS READY
echo ================================================
echo URL: http://localhost:5173/
if "%OFFLINE%"=="1" echo MODE: OFFLINE
echo Project: %APP%
echo.
echo To stop the system later, close the Node processes or restart Windows.
echo ================================================
echo.
pause
exit /b 0
