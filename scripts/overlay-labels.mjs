const keys=['overlayEdit','overlayShowLabel','overlayLabelText','overlayShowLast','overlayDefaultLabel','overlayEditHint'];
const rows={
en:'Edit overlay|Show a label|Label text|Show + last match|Chests opened|Changes update the preview and copied URL. The default shows only the total.',
id:'Edit overlay|Tampilkan label|Teks label|Tampilkan + pertandingan terakhir|Peti dibuka|Perubahan memperbarui pratinjau dan URL yang disalin. Tampilan bawaan hanya menunjukkan total.',
de:'Overlay bearbeiten|Beschriftung anzeigen|Beschriftung|+ letztes Spiel anzeigen|Geöffnete Truhen|Änderungen aktualisieren Vorschau und kopierte URL. Standardmäßig wird nur die Gesamtzahl angezeigt.',
es:'Editar overlay|Mostrar etiqueta|Texto de la etiqueta|Mostrar + última partida|Cofres abiertos|Los cambios actualizan la vista previa y la URL copiada. Por defecto solo se muestra el total.',
'es-419':'Editar overlay|Mostrar etiqueta|Texto de la etiqueta|Mostrar + última partida|Cofres abiertos|Los cambios actualizan la vista previa y la URL copiada. Por defecto solo se muestra el total.',
fr:'Modifier l’overlay|Afficher un libellé|Texte du libellé|Afficher + dernière partie|Coffres ouverts|Les modifications actualisent l’aperçu et l’URL copiée. Par défaut, seul le total est affiché.',
it:'Modifica overlay|Mostra etichetta|Testo etichetta|Mostra + ultima partita|Forzieri aperti|Le modifiche aggiornano l’anteprima e l’URL copiato. Per impostazione predefinita appare solo il totale.',
pl:'Edytuj nakładkę|Pokaż etykietę|Tekst etykiety|Pokaż + ostatni mecz|Otwarte skrzynie|Zmiany aktualizują podgląd i kopiowany URL. Domyślnie wyświetlana jest tylko suma.',
'pt-BR':'Editar overlay|Mostrar rótulo|Texto do rótulo|Mostrar + última partida|Baús abertos|As mudanças atualizam a prévia e a URL copiada. Por padrão, apenas o total é exibido.',
vi:'Chỉnh sửa lớp phủ|Hiện nhãn|Nội dung nhãn|Hiện + trận gần nhất|Rương đã mở|Thay đổi cập nhật bản xem trước và URL được sao chép. Mặc định chỉ hiện tổng số.',
tr:'Katmanı düzenle|Etiket göster|Etiket metni|+ son maçı göster|Açılan sandıklar|Değişiklikler önizlemeyi ve kopyalanan URL’yi günceller. Varsayılan görünüm yalnızca toplamı gösterir.',
ru:'Настроить оверлей|Показать подпись|Текст подписи|Показать + последний матч|Открыто сундуков|Изменения обновляют предпросмотр и копируемый URL. По умолчанию показано только общее число.',
ar:'تعديل العداد|إظهار عنوان|نص العنوان|إظهار + آخر مباراة|الصناديق المفتوحة|تحدّث التغييرات المعاينة والرابط المنسوخ. يظهر الإجمالي فقط افتراضيًا.',
th:'แก้ไขโอเวอร์เลย์|แสดงป้ายกำกับ|ข้อความป้ายกำกับ|แสดง + แมตช์ล่าสุด|หีบที่เปิดแล้ว|การเปลี่ยนแปลงจะอัปเดตตัวอย่างและ URL ที่คัดลอก ค่าเริ่มต้นแสดงเฉพาะยอดรวม',
ja:'オーバーレイを編集|ラベルを表示|ラベルのテキスト|＋直近マッチを表示|開けた宝箱|変更はプレビューとコピーするURLに反映されます。初期設定では合計のみ表示します。',
'zh-Hans':'编辑叠加层|显示标签|标签文字|显示 + 上一局|已开启宝箱|修改会更新预览及复制的链接。默认仅显示总数。',
'zh-Hant':'編輯圖層|顯示標籤|標籤文字|顯示 + 上一場|已開啟寶箱|修改會更新預覽及複製的連結。預設僅顯示總數。',
ko:'오버레이 편집|라벨 표시|라벨 텍스트|+ 최근 매치 표시|연 상자|변경 사항은 미리 보기와 복사할 URL에 반영됩니다. 기본값은 합계만 표시합니다.'
};
export function overlayLabels(code){const values=rows[code]?.split('|');if(values?.length!==keys.length)throw new Error('Missing overlay labels: '+code);return Object.fromEntries(keys.map((key,i)=>[key,values[i]]));}
