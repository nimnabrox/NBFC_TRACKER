# NBFC TRACKER - 日本語

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

マッチも、目標も、次の宝探しも。すべてをひとつに。

[ダッシュボード](https://nbfct.nimnabro.com/dashboard)  /  [Windows版をダウンロード](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## 次の発見の準備はできましたか？

1. **リプレイを有効にする.** Fortnite：設定 → ゲーム → リプレイ → リプレイを録画 → オン。
2. **連携アプリを開く.** WindowsでNBFC TRACKERを起動。保存済みリプレイを読み取り、プロフィール別に集計します。
3. **配信に追加する.** オーバーレイURLをOBSのブラウザソースに貼り付け、連携アプリを起動したままにしてください。

## 設定

- **宝箱の開始カウント:** このプロフィールの現在の累計を設定。新しい宝箱は自動加算されます。空にするとリプレイの合計を使用します。
- **リプレイフォルダー:** Windows連携アプリが必要です。保存先を変更していなければ既定のままにしてください。
- **アプリの表示倍率:** 50%–150%.
- **言語:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## 配信オーバーレイ

OBSのブラウザソースにカウンターを追加。サイズ：420 × 120。

ここで設定を保存すると、同じURLのままOBSに自動反映されます。連携アプリとOBSは同じPCで実行してください。

~~~text
https://nbfct.nimnabro.com/overlay
~~~

ローカルのリプレイを読み取ります。ゲームメモリへのアクセスはありません。Epic Gamesとは無関係です。

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)
