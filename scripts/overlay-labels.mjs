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
const stableHints={
en:'Save settings here. OBS updates automatically using the same URL. Keep the companion and OBS on the same PC.',
id:'Simpan pengaturan di sini. OBS diperbarui otomatis dengan URL yang sama. Jalankan aplikasi pendamping dan OBS di PC yang sama.',
de:'Hier Einstellungen speichern. OBS übernimmt Änderungen automatisch über dieselbe URL. Begleit-App und OBS müssen auf demselben PC laufen.',
es:'Guarda los ajustes aquí. OBS se actualiza automáticamente con la misma URL. Ejecuta la aplicación y OBS en el mismo PC.',
'es-419':'Guarda los ajustes aquí. OBS se actualiza automáticamente con la misma URL. Ejecuta la aplicación y OBS en la misma PC.',
fr:'Enregistrez les réglages ici. OBS se met à jour automatiquement avec la même URL. Lancez l’application et OBS sur le même PC.',
it:'Salva qui le impostazioni. OBS si aggiorna automaticamente con lo stesso URL. Esegui l’app e OBS sullo stesso PC.',
pl:'Zapisz ustawienia tutaj. OBS aktualizuje się automatycznie pod tym samym adresem URL. Uruchom aplikację i OBS na tym samym komputerze.',
'pt-BR':'Salve as configurações aqui. O OBS atualiza automaticamente com a mesma URL. Execute o aplicativo e o OBS no mesmo PC.',
vi:'Lưu cài đặt tại đây. OBS tự cập nhật bằng cùng một URL. Chạy ứng dụng đồng hành và OBS trên cùng máy tính.',
tr:'Ayarları burada kaydedin. OBS aynı URL üzerinden otomatik güncellenir. Uygulamayı ve OBS’yi aynı bilgisayarda çalıştırın.',
ru:'Сохраните настройки здесь. OBS обновится автоматически по той же ссылке. Запускайте приложение и OBS на одном ПК.',
ar:'احفظ الإعدادات هنا. يتحدث OBS تلقائيًا باستخدام الرابط نفسه. شغّل التطبيق المرافق وOBS على الكمبيوتر نفسه.',
th:'บันทึกการตั้งค่าที่นี่ OBS จะอัปเดตอัตโนมัติด้วย URL เดิม ให้เปิดแอปคู่หูและ OBS บนพีซีเครื่องเดียวกัน',
ja:'ここで設定を保存すると、同じURLのままOBSに自動反映されます。連携アプリとOBSは同じPCで実行してください。',
'zh-Hans':'在此保存设置，OBS 会通过同一链接自动更新。请在同一台电脑上运行配套应用和 OBS。',
'zh-Hant':'在此儲存設定，OBS 會透過同一連結自動更新。請在同一台電腦上執行配套應用程式和 OBS。',
ko:'여기에서 설정을 저장하면 같은 URL로 OBS가 자동 업데이트됩니다. 연동 앱과 OBS를 같은 PC에서 실행하세요.'
};
export function overlayLabels(code){const values=rows[code]?.split('|');if(values?.length!==keys.length||!stableHints[code])throw new Error('Missing overlay labels: '+code);return {...Object.fromEntries(keys.map((key,i)=>[key,values[i]])),overlayEditHint:stableHints[code]};}
