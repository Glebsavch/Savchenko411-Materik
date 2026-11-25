@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "DEMO_OPTION="
if /i "%~1"=="--demo" set "DEMO_OPTION=-DemoOnly"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" %DEMO_OPTION%
set "EXITCODE=%ERRORLEVEL%"
pause
exit /b %EXITCODE%
