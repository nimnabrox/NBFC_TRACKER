@echo off
chcp 65001 >nul
title Deploying NimnaBro's Fortnite Chest Tracker v3 to Cloudflare
cd /d "%~dp0\web-cloud"

echo =======================================================================
echo   Deploying v3 to https://nbfct.nimnabro.com
echo   Created by NimnaBro
echo =======================================================================
echo.

call npx wrangler deploy

echo.
echo Deploy finished!
pause
