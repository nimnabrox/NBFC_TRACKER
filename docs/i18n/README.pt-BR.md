# NBFC TRACKER - Português (Brasil)

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

Suas partidas, suas metas e seu próximo tesouro. Tudo em um só lugar.

[Painel](https://nbfct.nimnabro.com)  /  [Baixar para Windows](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## Pronto para descobrir mais?

1. **Ative as replays.** No Fortnite: Configurações → Jogo → Replays → Gravar replays → Sim.
2. **Abra o aplicativo.** Execute NBFC TRACKER no Windows. Ele lê suas replays e mantém os perfis separados.
3. **Leve para sua transmissão.** Cole a URL do overlay em uma fonte de navegador do OBS. Mantenha o aplicativo aberto.

## Configurações

- **Quantidade inicial de baús:** Defina sua meta atual para este perfil. Novos baús são somados automaticamente. Limpe para usar os totais das replays.
- **Pasta de replays:** Requer o aplicativo Windows. Mantenha a pasta padrão se as replays não estiverem em outro local.
- **Sala na nuvem:** Digite a sala da URL do overlay do aplicativo para acessá-la em outro dispositivo. Os links são públicos.
- **Idioma:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## Overlay de transmissão

Adicione o contador como fonte de navegador do OBS. Tamanho: 420 × 120.

~~~text
https://nbfct.nimnabro.com/overlay?room=YOUR_ROOM&lang=pt-BR
~~~

Lê replays locais. Não acessa a memória do jogo. Sem afiliação com a Epic Games.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)
