# NBFC TRACKER - 繁體中文

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

你的對戰、你的目標、你的下一份寶藏。盡在一處。

[儀表板](https://nbfct.nimnabro.com)  /  [下載 Windows 版](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## 準備發現更多了嗎？

1. **啟用重播.** 在 Fortnite 中：設定 → 遊戲 → 重播 → 錄製重播 → 開啟。
2. **開啟搭配應用程式.** 在 Windows 上執行 NBFC TRACKER。它會讀取已儲存的重播，並分別統計各個檔案。
3. **加入直播.** 將圖層連結貼到 OBS 瀏覽器來源中，並保持搭配應用程式執行。

## 設定

- **寶箱起始數量:** 設定此檔案的目前累計數量。新寶箱會自動累加。清空後使用重播總數。
- **重播資料夾:** 需要 Windows 搭配應用程式。除非重播儲存在其他位置，否則請保留預設資料夾。
- **雲端房間:** 輸入搭配應用程式圖層連結中的房間名稱，即可在其他裝置查看。房間連結是公開的。
- **語言:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## 直播覆蓋圖層

將計數器新增為 OBS 瀏覽器來源。尺寸：420 × 120。

~~~text
https://nbfct.nimnabro.com/overlay?room=YOUR_ROOM&lang=zh-Hant
~~~

讀取本機重播檔案。不存取遊戲記憶體。與 Epic Games 無關聯。

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)
