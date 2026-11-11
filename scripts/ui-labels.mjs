const keys = ['layout', 'classic', 'modern', 'overlayStyle', 'matchesTotal', 'subscribe', 'opened', 'destroyed', 'countTeam', 'teammates', 'teamChests', 'solo'];
const rows = {
  en: 'Dashboard layout|Original|New design|Overlay style|Matches recorded|Subscribe|Opened|Destroyed|Count team chests|Teammates|Team chests|Solo',
  id: 'Tata letak dasbor|Asli|Desain baru|Gaya overlay|Pertandingan tercatat|Berlangganan|Dibuka|Dihancurkan|Hitung peti tim|Rekan tim|Peti tim|Solo',
  de: 'Dashboard-Layout|Original|Neues Design|Overlay-Stil|Erfasste Spiele|Abonnieren|Geöffnet|Zerstört|Team-Truhen mitzählen|Teammates|Team-Truhen|Solo',
  es: 'Diseño del panel|Original|Nuevo diseño|Estilo del overlay|Partidas registradas|Suscribirse|Abiertos|Destruidos|Contar cofres de equipo|Compañeros|Cofres del equipo|En solitario',
  'es-419': 'Diseño del panel|Original|Nuevo diseño|Estilo del overlay|Partidas registradas|Suscribirse|Abiertos|Destruidos|Contar cofres de equipo|Compañeros|Cofres del equipo|En solitario',
  fr: 'Disposition du tableau de bord|Originale|Nouveau design|Style de l’overlay|Parties enregistrées|S’abonner|Ouverts|Détruits|Compter les coffres d’équipe|Coéquipiers|Coffres de l’équipe|Solo',
  it: 'Layout del pannello|Originale|Nuovo design|Stile overlay|Partite registrate|Iscriviti|Aperti|Distrutti|Conta i forzieri di squadra|Compagni|Forzieri di squadra|Solo',
  pl: 'Układ panelu|Oryginalny|Nowy wygląd|Styl nakładki|Zapisane mecze|Subskrybuj|Otwarte|Zniszczone|Licz skrzynie drużyny|Członkowie drużyny|Skrzynie drużyny|Solo',
  'pt-BR': 'Layout do painel|Original|Novo design|Estilo do overlay|Partidas registradas|Inscrever-se|Abertos|Destruídos|Contar baús da equipe|Companheiros|Baús da equipe|Solo',
  vi: 'Bố cục bảng điều khiển|Ban đầu|Thiết kế mới|Kiểu lớp phủ|Trận đã ghi|Đăng ký|Đã mở|Bị phá|Đếm rương của đội|Đồng đội|Rương của đội|Đơn',
  tr: 'Panel düzeni|Orijinal|Yeni tasarım|Katman stili|Kaydedilen maçlar|Abone ol|Açılan|Kırılan|Takım sandıklarını say|Takım arkadaşları|Takım sandıkları|Tekli',
  ru: 'Макет панели|Исходный|Новый дизайн|Стиль оверлея|Записано матчей|Подписаться|Открыто|Разбито|Считать сундуки команды|Тиммейты|Сундуки команды|Соло',
  ar: 'تخطيط لوحة التحكم|الأصلي|التصميم الجديد|نمط العداد|المباريات المسجلة|اشتراك|مفتوح|مكسور|حساب صناديق الفريق|أعضاء الفريق|صناديق الفريق|فردي',
  th: 'รูปแบบแดชบอร์ด|ดั้งเดิม|ดีไซน์ใหม่|รูปแบบโอเวอร์เลย์|แมตช์ที่บันทึก|ติดตาม|เปิดแล้ว|ถูกทำลาย|นับหีบของทีม|เพื่อนร่วมทีม|หีบของทีม|โซโล่',
  ja: 'ダッシュボードのレイアウト|オリジナル|新しいデザイン|オーバーレイのスタイル|記録したマッチ|チャンネル登録|開封|破壊|チームの宝箱をカウント|チームメイト|チームの宝箱|ソロ',
  'zh-Hans': '仪表盘布局|原始设计|新设计|叠加层样式|已记录对局|订阅|已开启|已破坏|统计队伍宝箱|队友|队伍宝箱|单人',
  'zh-Hant': '儀表板版面|原始設計|新設計|圖層樣式|已記錄對戰|訂閱|已開啟|已破壞|統計隊伍寶箱|隊友|隊伍寶箱|單人',
  ko: '대시보드 레이아웃|원래 디자인|새 디자인|오버레이 스타일|기록한 매치|구독|열림|파괴됨|팀 상자 포함|팀원|팀 상자|솔로'
};
export function uiLabels(code) {
  const values = rows[code]?.split('|');
  if (values?.length !== keys.length) throw new Error(`Incomplete UI labels: ${code}`);
  return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
}
