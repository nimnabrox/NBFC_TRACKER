@echo off
chcp 65001 >nul
title NimnaBro's Fortnite Live Replay Auto-Watcher
echo.
echo =======================================================================
echo  ⚡ NimnaBro's Fortnite Live Replay Auto-Sync
echo  Created by NimnaBro
echo =======================================================================
echo.
echo [1/2] Syncing all existing Fortnite replays to: C:\FortniteReplays ...
if not exist "C:\FortniteReplays" mkdir "C:\FortniteReplays"
robocopy "%LOCALAPPDATA%\FortniteGame\Saved\Demos" "C:\FortniteReplays" *.replay /R:1 /W:1 /COPY:DAT /NP /NFL /NDL

echo.
echo [2/2] Live Auto-Watcher is now ACTIVE!
echo  - New matches will automatically sync to C:\FortniteReplays in real-time.
echo  - On your Web Dashboard (https://nbfct.nimnabro.com):
echo    Click "Allow Replays Folder Access" and select:
echo    This PC -^> Local Disk (C:) -^> FortniteReplays
echo    Chrome will open it with 100%% ZERO system file warnings!
echo.
echo Keep this window open in the background while playing Fortnite...
echo.

robocopy "%LOCALAPPDATA%\FortniteGame\Saved\Demos" "C:\FortniteReplays" *.replay /MON:1 /R:1 /W:1 /COPY:DAT /NP
