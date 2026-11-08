# NBFC TRACKER - 简体中文

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

你的对局、你的目标、你的下一份宝藏。尽在一处。

[仪表盘](https://nbfct.nimnabro.com)  /  [下载 Windows 版](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## 准备发现更多了吗？

1. **启用回放.** 在 Fortnite 中：设置 → 游戏 → 回放 → 录制回放 → 开启。
2. **打开伴侣应用.** 在 Windows 上运行 NBFC TRACKER。它会读取已保存的回放，并分别统计各个档案。
3. **添加到直播.** 将叠加层链接粘贴到 OBS 浏览器源中，并保持伴侣应用运行。

## 设置

- **宝箱起始数量:** 设置此档案的当前累计数量。新宝箱将自动累加。清空后使用回放总数。
- **回放文件夹:** 需要 Windows 伴侣应用。除非回放保存在其他位置，否则请保留默认文件夹。
- **云端房间:** 输入伴侣应用叠加层链接中的房间名称，即可在其他设备查看。房间链接是公开的。
- **语言:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## 直播叠加层

将计数器添加为 OBS 浏览器源。尺寸：420 × 120。

~~~text
https://nbfct.nimnabro.com/overlay.html?room=YOUR_ROOM&lang=zh-Hans
~~~

读取本地回放文件。不访问游戏内存。与 Epic Games 无关联。

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)
