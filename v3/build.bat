@echo off
setlocal
cd /d "%~dp0.."
echo Building NBFC TRACKER v3 package...
node scripts\version.mjs
if errorlevel 1 exit /b 1
node scripts\sync-web.mjs
if errorlevel 1 exit /b 1
dotnet publish src\ChestCounter\ChestCounter.csproj -c Release -r win-x64 --self-contained true -m:1 -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=false -p:DebugType=none -o dist\release
if errorlevel 1 exit /b 1
powershell -NoProfile -File scripts\install-local-build.ps1
if errorlevel 1 exit /b 1
echo Built: v3\NBFC TRACKER.exe
