# ⚡ NimnaBro's Fortnite Chest Tracker (Web Edition)
> **Created by NimnaBro**  
> 100% Web-Based Fortnite Chest Tracker & Transparent OBS Studio Overlay. Runs directly in the browser with **NO application or executable needed** on the user's PC! Can be hosted for free on **Cloudflare Pages** with unlimited traffic.

---

## 🌟 Key Advantages of Web Edition

- **Zero Installation Required:** Users just visit your website URL in Chrome, Edge, or Opera.
- **HTML5 File System Access API:** Users grant access to `%LOCALAPPDATA%\FortniteGame\Saved\Demos` directly in their browser. The web app watches for new replays automatically!
- **100% Client-Side Parsing:** Replay reading happens locally in the browser with TypedArrays. Safe, private, and 100% anti-cheat safe.
- **Cloudflare Pages / Workers Ready (No Limits):** Unlimited bandwidth and zero server costs.
- **OBS Studio Browser Source Compatible:** Includes `overlay.html` with transparent background, golden skull chest icon, bold glowing numbers, and zero outer dark shadows.
- **Multi-Method Live OBS Sync:** Synchronizes between the Dashboard and OBS via Cloudflare Functions (`/api/sync`), WebRTC Peer-to-Peer, and LocalStorage/BroadcastChannel!
- **Google AdSense Ready:** Includes pre-styled AdSense banner slots (Top Leaderboard & Bottom Banner) ready for monetization.
- **Interactive Account Switcher:** Detects all accounts on the PC (e.g. `nimnabro` vs `nimnabroX`) with 1-click profile switching.
- **Custom Starting Chest Count:** Saves custom starting count (e.g. 4000) permanently in `localStorage`.

---

## 🚀 How to Deploy on Cloudflare Pages (100% Free, No Limits)

### Method A: Direct Upload (Easiest - 1 Minute)
1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages** → **Upload assets**.
2. Give your project a name (e.g. `nimnabro-chest-tracker`).
3. Drag & drop the `web-chest-tracker` folder into the upload box.
4. Click **Deploy site**!
5. Cloudflare will give you a live HTTPS link (e.g. `https://nimnabro-chest-tracker.pages.dev`).

### Method B: Via Git / GitHub
1. Push this folder to a GitHub repository.
2. In Cloudflare Pages, connect your GitHub repository.
3. Build output directory: `web-chest-tracker` (or leave root if in its own repo).
4. Click **Save and Deploy**. Any future updates deploy automatically!

---

## 🎮 How Users Use the Web App

1. Visit your deployed website (or open `index.html` locally).
2. Click **"📁 Connect Fortnite Replay Folder"**.
3. Select your Fortnite demos folder:
   ```
   %LOCALAPPDATA%\FortniteGame\Saved\Demos
   ```
4. Click **Allow view files** when the browser prompts.
5. As you play Fortnite, new matches and chests update live on screen automatically!

---

## 📺 OBS Studio Browser Source Setup

1. In OBS Studio, add a **Browser Source**.
2. Set URL to:
   ```
   https://your-site.pages.dev/overlay.html?room=nimnabro
   ```
3. Set Dimensions:
   - **Width:** `340`
   - **Height:** `110`
4. The background is **100% transparent** with crisp amber borders and zero dark blur!
5. When playing, the web dashboard automatically broadcasts live chest counts to OBS in real time!

---

## 💰 How to Add Google AdSense (Monetization)

In `web-chest-tracker/index.html`:

1. **Add your AdSense script tag** in `<head>`:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```
2. **Uncomment the ad slots** in `index.html`:
   - Top Leaderboard slot: `id="adTopSlot"`
   - Bottom Banner slot: `id="adBottomSlot"`
3. Replace `ca-pub-XXXXXXXXXXXXXXXX` with your publisher ID and set your `data-ad-slot` IDs.
4. Ads will automatically show on the dashboard for everyone who uses your tracker!

---
*Created with ❤️ by NimnaBro.*
