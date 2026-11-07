@echo off
chcp 65001 >nul
title NimnaBro's Fortnite Replays Browser Linker
echo.
echo =====================================================================
echo  ⚡ NimnaBro's Fortnite Replay Linker for Web Browsers (Chrome / Edge)
echo  Created by NimnaBro
echo =====================================================================
echo.
echo Google Chrome and Edge block direct web access to AppData folders.
echo This 1-click script safely creates a browser-friendly shortcut link in:
echo   "%USERPROFILE%\Documents\FortniteReplays"
echo pointing to:
echo   "%LOCALAPPDATA%\FortniteGame\Saved\Demos"
echo.

set "TARGET=%LOCALAPPDATA%\FortniteGame\Saved\Demos"
set "LINK=%USERPROFILE%\Documents\FortniteReplays"

if not exist "%TARGET%" (
    echo [Notice] Fortnite replay folder not found at %TARGET% yet.
    echo Creating target directory...
    mkdir "%TARGET%" 2>nul
)

if exist "%LINK%" (
    echo [OK] Link already exists at "%LINK%".
) else (
    echo Creating directory link...
    mklink /J "%LINK%" "%TARGET%"
    if errorlevel 1 (
        echo [Error] Failed to create link. Please run as Administrator if needed.
        pause
        exit /b 1
    )
    echo [Success] Link created successfully!
)

echo.
echo =====================================================================
echo  Now open: https://nbfct.pages.dev (or https://nbfct.nimnabro.com)
echo  Click "Connect Replay Folder" and choose:
echo  Documents -^> FortniteReplays
echo  Chrome will open it with 100%% ZERO system file warnings!
echo =====================================================================
echo.
pause
