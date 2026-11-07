@echo off
chcp 65001 >nul
title NBFC TRACKER v3 - Created by NimnaBro
cd /d "%~dp0"

echo =======================================================================
echo   NBFC TRACKER v3
echo   Created by NimnaBro · Fortnite Chest Counter & Live OBS Overlay
echo =======================================================================
echo.
echo Starting standalone companion engine and modern 1:2 dashboard...
echo Local Dashboard: http://localhost:5088
echo Cloud Dashboard: https://nbfct.nimnabro.com
echo OBS Overlay:     https://nbfct.nimnabro.com/overlay.html?room=nimnabro
echo.

start "" "NBFC TRACKER.exe"
