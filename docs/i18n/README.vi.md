# NBFC TRACKER - Tiếng Việt

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

Trận đấu, cột mốc và kho báu tiếp theo. Tất cả ở một nơi.

[Tổng quan](https://nbfct.nimnabro.com)  /  [Tải cho Windows](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## Sẵn sàng khám phá thêm?

1. **Bật bản phát lại.** Trong Fortnite: Cài đặt → Trò chơi → Phát lại → Ghi bản phát lại → Bật.
2. **Mở ứng dụng đồng hành.** Chạy NBFC TRACKER trên Windows. Ứng dụng đọc bản phát lại và tách riêng hồ sơ.
3. **Đưa lên buổi phát trực tiếp.** Dán URL lớp phủ vào Nguồn trình duyệt OBS. Giữ ứng dụng đồng hành chạy.

## Cài đặt

- **Số rương ban đầu:** Đặt cột mốc hiện tại cho hồ sơ này. Rương mới được cộng tự động. Xóa để dùng tổng từ bản phát lại.
- **Thư mục bản phát lại:** Cần ứng dụng Windows. Giữ thư mục mặc định nếu bản phát lại không nằm nơi khác.
- **Phòng đám mây:** Nhập phòng từ URL lớp phủ của ứng dụng để xem trên thiết bị khác. Liên kết phòng là công khai.
- **Ngôn ngữ:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## Lớp phủ phát trực tiếp

Thêm bộ đếm làm Nguồn trình duyệt trong OBS. Kích thước: 420 × 120.

~~~text
https://nbfct.nimnabro.com/overlay.html?room=YOUR_ROOM&lang=vi
~~~

Đọc bản phát lại cục bộ. Không truy cập bộ nhớ trò chơi. Không liên kết với Epic Games.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)
