const keys = ['layout', 'classic', 'modern', 'overlayStyle', 'matchesTotal', 'subscribe', 'opened', 'destroyed'];
const rows = {
  en: 'Dashboard layout|Original|New design|Overlay style|Matches recorded|Subscribe|Opened|Destroyed',
  id: 'Tata letak dasbor|Asli|Desain baru|Gaya overlay|Pertandingan tercatat|Berlangganan|Dibuka|Dihancurkan',
  de: 'Dashboard-Layout|Original|Neues Design|Overlay-Stil|Erfasste Spiele|Abonnieren|Geöffnet|Zerstört',
  es: 'Diseño del panel|Original|Nuevo diseño|Estilo del overlay|Partidas registradas|Suscribirse|Abiertos|Destruidos',
  'es-419': 'Diseño del panel|Original|Nuevo diseño|Estilo del overlay|Partidas registradas|Suscribirse|Abiertos|Destruidos',
  fr: 'Disposition du tableau de bord|Originale|Nouveau design|Style de l’overlay|Parties enregistrées|S’abonner|Ouverts|Détruits',
  it: 'Layout del pannello|Originale|Nuovo design|Stile overlay|Partite registrate|Iscriviti|Aperti|Distrutti',
  pl: 'Układ panelu|Oryginalny|Nowy wygląd|Styl nakładki|Zapisane mecze|Subskrybuj|Otwarte|Zniszczone',
  'pt-BR': 'Layout do painel|Original|Novo design|Estilo do overlay|Partidas registradas|Inscrever-se|Abertos|Destruídos',
  vi: 'Bố cục bảng điều khiển|Ban đầu|Thiết kế mới|Kiểu lớp phủ|Trận đã ghi|Đăng ký|Đã mở|Bị phá',
  tr: 'Panel düzeni|Orijinal|Yeni tasarım|Katman stili|Kaydedilen maçlar|Abone ol|Açılan|Kırılan',
  ru: 'Макет панели|Исходный|Новый дизайн|Стиль оверлея|Записано матчей|Подписаться|Открыто|Разбито',
  ar: 'تخطيط لوحة التحكم|الأصلي|التصميم الجديد|نمط العداد|المباريات المسجلة|اشتراك|مفتوح|مكسور',
  th: 'รูปแบบแดชบอร์ด|ดั้งเดิม|ดีไซน์ใหม่|รูปแบบโอเวอร์เลย์|แมตช์ที่บันทึก|ติดตาม|เปิดแล้ว|ถูกทำลาย',
  ja: 'ダッシュボードのレイアウト|オリジナル|新しいデザイン|オーバーレイのスタイル|記録したマッチ|チャンネル登録|開封|破壊',
  'zh-Hans': '仪表盘布局|原始设计|新设计|叠加层样式|已记录对局|订阅|已开启|已破坏',
  'zh-Hant': '儀表板版面|原始設計|新設計|圖層樣式|已記錄對戰|訂閱|已開啟|已破壞',
  ko: '대시보드 레이아웃|원래 디자인|새 디자인|오버레이 스타일|기록한 매치|구독|열림|파괴됨'
};
export function uiLabels(code) {
  const values = rows[code]?.split('|');
  if (values?.length !== keys.length) throw new Error(`Incomplete UI labels: ${code}`);
  return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
}
