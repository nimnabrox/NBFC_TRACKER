@echo off
cd /d "%~dp0"
if not exist "NBFC TRACKER.exe" (
  call build.bat
  if errorlevel 1 exit /b 1
)
start "" "NBFC TRACKER.exe"
