# ⚡ NBFC TRACKER

<p align="center">
  <b>100% Safe & Open Source Fortnite Replay Chest Counter · Real-Time OBS Studio Overlay · Cloud Edge Sync</b><br>
  <b>Created by <a href="https://guns.lol/nimnabro">NimnaBro</a> · All Rights Reserved</b>
</p>

<p align="center">
  <a href="https://nbfct.nimnabro.com"><img src="https://img.shields.io/badge/Website-nbfct.nimnabro.com-f5a623?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Website"></a>
  <a href="https://github.com/nimnabrox/NBFC_TRACKER"><img src="https://img.shields.io/badge/GitHub-100%25_Open_Source-2ea44f?style=for-the-badge&logo=github&logoColor=white" alt="Open Source"></a>
  <a href="https://guns.lol/nimnabro"><img src="https://img.shields.io/badge/Creator-NimnaBro-ff4444?style=for-the-badge" alt="Creator"></a>
  <img src="https://img.shields.io/badge/Anti--Cheat-100%25_Safe-brightgreen?style=for-the-badge&logo=shield" alt="Anti Cheat Safe">
  <img src="https://img.shields.io/badge/VirusTotal-Clean_0%2F70-blue?style=for-the-badge&logo=virustotal" alt="VirusTotal Clean">
</p>

---

> [!IMPORTANT]
> ### ⚠️ Required Fortnite Setting: Enable Replay Recording!
> **Fortnite does not save replays by default on some PC setups.** For NBFC TRACKER to count your chests, you **must** ensure Replays are enabled in your Fortnite settings:
> 1. Launch **Fortnite** and open **Settings** (press `Esc` → click the Gear icon).
> 2. Select the **Game** tab (the gear icon on top).
> 3. Scroll all the way down to the **Replays** section.
> 4. Turn **Record Replays** to **ON** (and **Record High Stakes / Large Team Replays** to **ON** if you play Team Rumble or special modes).
> 5. Click **Apply** to save.
> 
> *Once enabled, Fortnite will automatically save replay files after each match, and NBFC TRACKER will instantly parse and track every single chest!*

> [!NOTE]
> ### 🏆 Career Chest Milestones & Local Replays Explanation
> **Why does my chest count start lower than my total career chests?**
> Fortnite only stores recent replays locally on PC (typically up to ~100 replays). When you first launch NBFC TRACKER, it automatically counts all chests inside those saved local replay files.
> 
> **How to match your full career or season count:**
> 1. In NBFC TRACKER (Desktop App or Web Dashboard), go to **Tracker Settings** → **Custom Starting Offset**.
> 2. Enter your total milestone or career chests (e.g. `4084`).
> 3. Click **Save**!
> 
> NBFC TRACKER immediately locks in your milestone and continues counting each new chest you open on top of your career base!

---

**NBFC TRACKER** is a high-performance, ultra-low-spec Fortnite chest tracking ecosystem built for streamers, competitive players, and achievement hunters. It reads and parses local Fortnite replay files (`.replay`) in read-only mode after each match, giving you live stats, session counters, lifetime milestones, and an instant OBS Studio Browser Source overlay.

### Key Highlights
- **100% Anti-Cheat Safe**: Pure read-only `.replay` parsing. Zero memory injection, zero DLL hooking, zero game process modification.
- **100% Clean on VirusTotal**: Explicit Windows PE metadata, assembly manifests, and non-compressed single-file build eliminate heuristic packer false positives.
- **Close-to-Tray Background Tracking**: Clicking `X` minimizes the tracker to the Windows System Tray (`NotifyIcon`), keeping your stats live while you game.
- **1:2 Low-Spec UI**: Ultra-clean interface with zero emojis (vector SVGs only), low memory footprint, and high-DPI scaling.
- **Universal Cloud Edge Sync**: Synchronizes in real time with Cloudflare KV edge storage at `https://nbfct.nimnabro.com`, meaning OBS overlays work without requiring localhost port forwarding.

---

## 🚀 Quick Start

### 1. Download & Launch
1. Download or build `NBFC TRACKER.exe`.
2. Run `NBFC TRACKER.exe` or execute `run.bat`.
3. The app automatically detects your Fortnite replay folder (`%LOCALAPPDATA%\FortniteGame\Saved\Demos`).

### 2. OBS Studio Stream Setup
1. In OBS Studio, add a new **Browser Source**.
2. Set the URL to:
   ```text
   https://nbfct.nimnabro.com/overlay.html?room=nimnabro
   ```
3. Set Width to `420` and Height to `120`. Check **"Shutdown source when not visible"** if desired.
4. Done! Every time you open chests in Fortnite, your overlay updates live in real-time.

---

## ⚙️ Features & Settings

| Feature | Description |
| :--- | :--- |
| **System Tray** | Minimizes to system tray on window close. Right-click context menu provides 1-click OBS overlay copy, live dashboard launch, and quick exit. |
| **Start with Windows** | Configurable startup toggle (`--minimized`) to keep tracking silently in the background whenever your PC boots. |
| **Multi-Profile Switching** | Automatically detects all Epic accounts played on the PC and tracks stats separately per profile. |
| **Base Chest Offset** | Set a custom starting count to sync with in-game milestones or season goals. |
| **Export Data** | One-click export to CSV for match logs, chest records, and elimination statistics. |

---

## 🛡️ Security & Integrity (100% Safe)

- **Read-Only Access**: Replays are stored by Fortnite in `%LOCALAPPDATA%\FortniteGame\Saved\Demos`. The tracker only reads completed replay chunks from disk.
- **Full Source Transparency**: Every line of C# backend and HTML/JS frontend code is public and open-source in this repository.
- **No Third-Party Spyware**: Zero analytics trackers, telemetry scripts, or ad networks.

---

## 🛠️ Building from Source

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (Windows x64)

### Compile Release Binary
```cmd
build.bat
```
Or via the .NET CLI:
```cmd
dotnet publish src\ChestCounter\ChestCounter.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=false -p:DebugType=none -o .
```

---

## 💛 Support the Creator
* **Fortnite Item Shop Creator Code:** `USE CODE: NIMNABRO`
* **Official YouTube Channel:** [youtube.com/@nimna_bro_](https://www.youtube.com/@nimna_bro_?sub_confirmation=1) (Subscribe guys! 🔔)
* **Creator Profile:** [guns.lol/nimnabro](https://guns.lol/nimnabro)

---

## 👤 Author & Credits

* **Developer:** **NimnaBro**
* **Creator Profile:** [guns.lol/nimnabro](https://guns.lol/nimnabro)
* **Website:** [nbfct.nimnabro.com](https://nbfct.nimnabro.com)
* **GitHub:** [github.com/nimnabrox/NBFC_TRACKER](https://github.com/nimnabrox/NBFC_TRACKER)

*Copyright © 2026 NimnaBro. All Rights Reserved.*
