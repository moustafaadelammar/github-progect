@echo off
setlocal
cd /d "%~dp0"
start "" /b node scripts\start-local.mjs
exit /b 0
