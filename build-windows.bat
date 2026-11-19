@echo off
REM Builds the ArionCore installer. Requires Node.js 20+ (https://nodejs.org).
call npm install || exit /b 1
call npm run dist:win || exit /b 1
echo.
echo Done. Installer: dist\ArionCore Setup 0.3.0.exe
pause
