@echo off
chcp 65001 >nul
title Building NBFC TRACKER v3 - Created by NimnaBro
cd /d "%~dp0\.."

echo =======================================================================
echo   Building NBFC TRACKER v3
echo   Created by NimnaBro
echo =======================================================================
echo.

dotnet publish src\ChestCounter\ChestCounter.csproj -c Release -r win-x64 --self-contained true ^
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true ^
  -p:EnableCompressionInSingleFile=false -p:DebugType=none -o "%~dp0"

if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

copy /y "%~dp0NBFC TRACKER.exe" "%~dp0..\NBFC TRACKER.exe" >nul

echo.
echo Build Succeeded!
echo   Executable: %~dp0NBFC TRACKER.exe
pause
