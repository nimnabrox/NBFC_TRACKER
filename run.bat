@echo off
chcp 65001 >nul
title NBFC TRACKER - Created by NimnaBro
cd /d "%~dp0"

echo =======================================================================
echo   NBFC TRACKER
echo   Created by NimnaBro · Fortnite Chest Counter & Live OBS Overlay
echo   Website: https://nbfct.nimnabro.com
echo   GitHub:  https://github.com/nimnabrox/NBFC_TRACKER
echo =======================================================================
echo.

if exist "NBFC TRACKER.exe" (
  start "" "NBFC TRACKER.exe"
) else if exist "v3\NBFC TRACKER.exe" (
  start "" "v3\NBFC TRACKER.exe"
) else (
  echo Executable not found. Running build.bat first...
  call build.bat
  start "" "NBFC TRACKER.exe"
)
