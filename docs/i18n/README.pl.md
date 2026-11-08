# NBFC TRACKER - Polski

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

Twoje mecze, osiągnięcia i następny skarb. Wszystko w jednym miejscu.

[Panel](https://nbfct.nimnabro.com/dashboard)  /  [Pobierz na Windows](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## Gotów na więcej odkryć?

1. **Włącz powtórki.** W Fortnite: Ustawienia → Gra → Powtórki → Nagrywaj powtórki → Wł.
2. **Otwórz aplikację.** Uruchom NBFC TRACKER w Windows. Odczytuje powtórki i rozdziela profile.
3. **Dodaj do transmisji.** Wklej URL nakładki do źródła przeglądarki OBS. Pozostaw aplikację uruchomioną.

## Ustawienia

- **Początkowa liczba skrzyń:** Ustaw bieżący wynik tego profilu. Nowe skrzynie będą dodawane automatycznie. Wyczyść, aby używać sumy z powtórek.
- **Folder powtórek:** Wymagana aplikacja Windows. Zachowaj domyślny folder, chyba że powtórki zapisujesz gdzie indziej.
- **Powiększenie aplikacji:** 50%–150%.
- **Język:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## Nakładka transmisji

Dodaj licznik jako źródło przeglądarki w OBS. Rozmiar: 420 × 120.

Zapisz ustawienia tutaj. OBS aktualizuje się automatycznie pod tym samym adresem URL. Uruchom aplikację i OBS na tym samym komputerze.

~~~text
https://nbfct.nimnabro.com/overlay
~~~

Odczytuje lokalne powtórki. Bez dostępu do pamięci gry. Brak powiązań z Epic Games.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)
