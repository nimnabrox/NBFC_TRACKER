# NBFC TRACKER - Русский

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

Твои матчи, достижения и следующий клад. Всё в одном месте.

[Обзор](https://nbfct.nimnabro.com)  /  [Скачать для Windows](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## Готов к новым находкам?

1. **Включи повторы.** В Fortnite: Настройки → Игра → Повторы → Записывать повторы → Вкл.
2. **Открой приложение.** Запусти NBFC TRACKER в Windows. Оно читает повторы и разделяет профили.
3. **Добавь на трансляцию.** Вставь URL оверлея в источник «Браузер» OBS. Не закрывай приложение.

## Настройки

- **Начальное число сундуков:** Укажи текущий итог для профиля. Новые сундуки добавляются автоматически. Очисти, чтобы использовать сумму из повторов.
- **Папка повторов:** Нужно приложение Windows. Оставь папку по умолчанию, если повторы не хранятся в другом месте.
- **Облачная комната:** Введи комнату из URL оверлея приложения для просмотра на другом устройстве. Ссылки общедоступны.
- **Язык:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## Оверлей трансляции

Добавь счётчик как источник «Браузер» в OBS. Размер: 420 × 120.

~~~text
https://nbfct.nimnabro.com/overlay?room=YOUR_ROOM&lang=ru
~~~

Читает локальные повторы. Без доступа к памяти игры. Не связано с Epic Games.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)
