const keys = ['layout', 'classic', 'modern', 'overlayStyle', 'matchesTotal', 'subscribe'];
const rows = {
  en: 'Dashboard layout|Original|New design|Overlay style|Matches recorded|Subscribe',
  id: 'Tata letak dasbor|Asli|Desain baru|Gaya overlay|Pertandingan tercatat|Berlangganan',
  de: 'Dashboard-Layout|Original|Neues Design|Overlay-Stil|Erfasste Spiele|Abonnieren',
  es: 'Diseño del panel|Original|Nuevo diseño|Estilo del overlay|Partidas registradas|Suscribirse',
  'es-419': 'Diseño del panel|Original|Nuevo diseño|Estilo del overlay|Partidas registradas|Suscribirse',
  fr: 'Disposition du tableau de bord|Originale|Nouveau design|Style de l’overlay|Parties enregistrées|S’abonner',
  it: 'Layout del pannello|Originale|Nuovo design|Stile overlay|Partite registrate|Iscriviti',
  pl: 'Układ panelu|Oryginalny|Nowy wygląd|Styl nakładki|Zapisane mecze|Subskrybuj',
  'pt-BR': 'Layout do painel|Original|Novo design|Estilo do overlay|Partidas registradas|Inscrever-se',
  vi: 'Bố cục bảng điều khiển|Ban đầu|Thiết kế mới|Kiểu lớp phủ|Trận đã ghi|Đăng ký',
  tr: 'Panel düzeni|Orijinal|Yeni tasarım|Katman stili|Kaydedilen maçlar|Abone ol',
  ru: 'Макет панели|Исходный|Новый дизайн|Стиль оверлея|Записано матчей|Подписаться',
  ar: 'تخطيط لوحة التحكم|الأصلي|التصميم الجديد|نمط العداد|المباريات المسجلة|اشتراك',
  th: 'รูปแบบแดชบอร์ด|ดั้งเดิม|ดีไซน์ใหม่|รูปแบบโอเวอร์เลย์|แมตช์ที่บันทึก|ติดตาม',
  ja: 'ダッシュボードのレイアウト|オリジナル|新しいデザイン|オーバーレイのスタイル|記録したマッチ|チャンネル登録',
  'zh-Hans': '仪表盘布局|原始设计|新设计|叠加层样式|已记录对局|订阅',
  'zh-Hant': '儀表板版面|原始設計|新設計|圖層樣式|已記錄對戰|訂閱',
  ko: '대시보드 레이아웃|원래 디자인|새 디자인|오버레이 스타일|기록한 매치|구독'
};
export function uiLabels(code) {
  const values = rows[code]?.split('|');
  if (values?.length !== keys.length) throw new Error(`Incomplete UI labels: ${code}`);
  return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
}
