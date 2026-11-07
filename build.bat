@echo off
chcp 65001 >nul
title Building NBFC TRACKER - Created by NimnaBro
cd /d "%~dp0"

echo ========================================================
echo   Building NBFC TRACKER (100% VirusTotal Clean Executable)
echo   Created by NimnaBro - https://guns.lol/nimnabro
echo ========================================================
echo.

dotnet publish src\ChestCounter\ChestCounter.csproj -c Release -r win-x64 --self-contained true ^
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true ^
  -p:EnableCompressionInSingleFile=false -p:DebugType=none -o .
if errorlevel 1 (
  echo.
  echo The build failed. See the message above.
  pause
  exit /b 1
)

echo.
echo Syncing executable to v3 package...
if exist "NBFC TRACKER.exe" copy /y "NBFC TRACKER.exe" "v3\NBFC TRACKER.exe" >nul

echo.
echo ========================================================
echo Build complete! Executable is ready:
echo   - %~dp0NBFC TRACKER.exe
echo   - %~dp0v3\NBFC TRACKER.exe
echo ========================================================
pause
