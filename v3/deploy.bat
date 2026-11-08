@echo off
setlocal
cd /d "%~dp0.."
if not exist node_modules\wrangler call npm ci
if errorlevel 1 exit /b 1
call npm run check
if errorlevel 1 exit /b 1
call npm run deploy
if errorlevel 1 exit /b 1
echo Deployed v3 to https://nbfct.nimnabro.com
