# NBFC TRACKER - 한국어

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

매치, 목표, 그리고 다음 보물까지. 한곳에서 확인하세요.

[대시보드](https://nbfct.nimnabro.com/dashboard)  /  [Windows용 다운로드](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## 더 많은 발견을 할 준비가 되었나요?

1. **리플레이 켜기.** Fortnite: 설정 → 게임 → 리플레이 → 리플레이 녹화 → 켜기.
2. **연동 앱 열기.** Windows에서 NBFC TRACKER를 실행하세요. 저장된 리플레이를 읽고 프로필별로 집계합니다.
3. **방송에 추가하기.** 오버레이 URL을 OBS 브라우저 소스에 붙여 넣고 연동 앱을 켜 두세요.

## 설정

- **상자 시작 수:** 이 프로필의 현재 누적 수를 설정하세요. 새 상자는 자동으로 더해집니다. 비우면 리플레이 합계를 사용합니다.
- **리플레이 폴더:** Windows 연동 앱이 필요합니다. 리플레이 위치를 바꾸지 않았다면 기본 폴더를 유지하세요.
- **앱 확대/축소:** 50%–150%.
- **언어:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## 방송 오버레이

OBS 브라우저 소스로 카운터를 추가하세요. 크기: 420 × 120.

여기에서 설정을 저장하면 같은 URL로 OBS가 자동 업데이트됩니다. 연동 앱과 OBS를 같은 PC에서 실행하세요.

~~~text
https://nbfct.nimnabro.com/overlay
~~~

로컬 리플레이를 읽습니다. 게임 메모리에 접근하지 않습니다. Epic Games와 무관합니다.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)
