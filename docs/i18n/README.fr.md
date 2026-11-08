# NBFC TRACKER - Français

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

Vos parties, vos objectifs et votre prochain trésor. Tout au même endroit.

[Tableau de bord](https://nbfct.nimnabro.com)  /  [Télécharger pour Windows](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## Prêt à découvrir la suite ?

1. **Activer les replays.** Dans Fortnite : Paramètres → Jeu → Replays → Enregistrer les replays → Oui.
2. **Ouvrir le compagnon.** Lancez NBFC TRACKER sur Windows. Il lit vos replays et sépare les profils.
3. **Ajoutez-le à votre stream.** Collez l’URL de l’overlay dans une source navigateur OBS. Laissez le compagnon ouvert.

## Paramètres

- **Nombre de coffres de départ:** Définissez votre total actuel pour ce profil. Les nouveaux coffres s’ajoutent automatiquement. Effacez pour utiliser les replays.
- **Dossier des replays:** Compagnon Windows requis. Gardez le dossier par défaut sauf si vos replays sont ailleurs.
- **Salon cloud:** Saisissez le salon de l’URL de l’overlay du compagnon pour le consulter sur un autre appareil. Les liens sont publics.
- **Langue:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## Overlay de stream

Ajoutez le compteur comme source navigateur OBS. Taille : 420 × 120.

~~~text
https://nbfct.nimnabro.com/overlay?room=YOUR_ROOM&lang=fr
~~~

Lit les replays locaux. Aucun accès à la mémoire du jeu. Sans affiliation avec Epic Games.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)
