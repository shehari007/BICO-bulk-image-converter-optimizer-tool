import type { TranslatedDictionary } from './contract'

/**
 * Turkish.
 *
 * Typed against the English key set, so a key added there fails to compile here
 * until it is translated. Format names, codec names and the product name are
 * deliberately left in English, because that is how the field writes them.
 */
export const tr: TranslatedDictionary = {
  /* ================================================================ */
  /* Common                                                            */
  /* ================================================================ */

  'app.name': 'BICO',
  'app.tagline': 'Toplu Görsel Dönüştürücü ve Optimize Edici',

  'action.ok': 'Tamam',
  'action.cancel': 'İptal',
  'action.close': 'Kapat',
  'action.save': 'Kaydet',
  'action.delete': 'Sil',
  'action.remove': 'Kaldır',
  'action.apply': 'Uygula',
  'action.reset': 'Sıfırla',
  'action.copy': 'Kopyala',
  'action.copied': 'Kopyalandı',
  'action.open': 'Aç',
  'action.browse': 'Gözat',
  'action.import': 'İçe aktar',
  'action.export': 'Dışa aktar',
  'action.duplicate': 'Çoğalt',
  'action.retry': 'Yeniden dene',
  'action.clear': 'Temizle',
  'action.showInFolder': 'Dosya yöneticisinde göster',
  'action.learnMore': 'Daha fazla bilgi',

  'state.on': 'Açık',
  'state.off': 'Kapalı',
  'state.automatic': 'Otomatik',
  'state.none': 'Yok',
  'state.unknown': 'Bilinmiyor',
  'state.loading': 'Yükleniyor',
  'state.unavailable': 'Kullanılamıyor',

  'unit.byte': 'B',
  'unit.kb': 'KB',
  'unit.mb': 'MB',
  'unit.gb': 'GB',
  'unit.tb': 'TB',
  'unit.pixels': 'px',
  'unit.dpi': 'DPI',
  'unit.perSecond': 'saniyede',
  'unit.mbPerSecond': 'MB/sn',
  'unit.imagesPerSecond': 'görsel/sn',
  'unit.milliseconds': 'ms',
  'unit.seconds': 'sn',
  'unit.percent': 'yüzde',

  'time.hoursMinutes': '{hours}sa {minutes}dk',
  'time.minutesSeconds': '{minutes}dk {seconds}sn',
  'time.seconds': '{seconds}sn',
  'time.milliseconds': '{ms}ms',

  'backend.gpu': 'GPU',
  'backend.cpu': 'CPU',

  'status.queued': 'Kuyrukta',
  'status.running': 'Çalışıyor',
  'status.done': 'Bitti',
  'status.failed': 'Başarısız',
  'status.skipped': 'Atlandı',
  'status.cancelled': 'İptal edildi',

  /* ================================================================ */
  /* Welcome                                                           */
  /* ================================================================ */

  'welcome.version': 'Sürüm {version}',
  'welcome.intro':
    'BICO, görselleri bu makinede toplu olarak dönüştürür ve optimize eder. Hiçbir şey karşıya yüklenmez, siz istemedikçe orijinallere dokunulmaz.',
  'welcome.whatsNew': '{version} sürümündeki yenilikler',
  'welcome.dontShowAgain': 'Bunu bir daha gösterme',
  'welcome.start': 'Başla',
  'welcome.facts.aria': 'Algılanan donanım',

  'welcome.fact.processor': 'İşlemci',
  'welcome.fact.processorValue': '{cpu}, {threads} iş parçacığı',
  'welcome.fact.workers': 'Çalışan iş parçacıkları',
  'welcome.fact.workersValue': '{count} tane çalışıyor',
  'welcome.fact.graphics': 'Grafik',
  'welcome.fact.graphicsNone': 'Kullanılabilir bağdaştırıcı yok, dönüştürmeler işlemcide çalışır',

  'welcome.highlight.threads.title': 'Hiçbir şey donmaz',
  'welcome.highlight.threads.body':
    'Kodlama, işlemcinize göre boyutlandırılmış yerel çalışan iş parçacığı havuzunda yürütülür.',
  'welcome.highlight.gpu.title': 'GPU hızlandırma',
  'welcome.highlight.gpu.body':
    'Yeniden boyutlandırma, filtreler ve renk işleri grafik bağdaştırıcınızda hesaplama gölgelendiricisi olarak çalışır; gerektiğinde işlemciye düşer.',
  'welcome.highlight.formats.title': 'Dokuz çıktı biçimi',
  'welcome.highlight.formats.body':
    "JPEG ve PNG'den AVIF, JPEG XL ve JPEG 2000'e kadar her biçim kendi kodlayıcı denetimleriyle gelir.",
  'welcome.highlight.preview.title': 'Çalıştırmadan önce görün',
  'welcome.highlight.preview.body':
    'Geçerli ayarlarınızla canlı bir önce ve sonra karşılaştırması, öngörülen çıktı boyutuyla birlikte.',
  'welcome.highlight.languages.title': 'Üç dil',
  'welcome.highlight.languages.body':
    'Baştan sona İngilizce, Türkçe ve Arapça; Arapça için düzen aynalanır.',
  'welcome.highlight.themes.title': 'Sekiz tema',
  'welcome.highlight.themes.body':
    'Vurgu rengi değişiklikleri değil, eksiksiz paletler; her biri seçmeden önce canlı önizlenir.',

  /* ================================================================ */
  /* Toolbar                                                           */
  /* ================================================================ */

  'toolbar.logoAlt': 'BICO uygulama simgesi',
  'toolbar.version': 'v{version}',
  'toolbar.sidebar.hide': 'Ayarlar panelini gizle',
  'toolbar.sidebar.show': 'Ayarlar panelini göster',

  'toolbar.actions.aria': 'Ana işlemler',

  'toolbar.addImages': 'Görsel Ekle',
  'toolbar.addImages.tooltip': 'Kuyruğa eklemek için tek tek görsel seçin',
  'toolbar.addFolder': 'Klasör Ekle',
  'toolbar.addFolder.tooltip': 'Bir klasör seçin ve içindeki tüm görselleri ekleyin',

  'toolbar.start': 'Dönüştürmeyi Başlat',
  'toolbar.start.tooltip': 'Kuyruktaki her şeyi geçerli ayarlarla dönüştürün',
  'toolbar.pause': 'Duraklat',
  'toolbar.pause.tooltip': 'İşlenmekte olanlar bitince yeni görsel almayı durdurun',
  'toolbar.resume': 'Sürdür',
  'toolbar.resume.tooltip': 'Çalıştırmanın duraklatıldığı yerden devam edin',
  'toolbar.cancel': 'İptal',
  'toolbar.cancel.tooltip': 'Çalıştırmayı durdurun. Yazılmış dosyalar korunur',

  'toolbar.more': 'Diğer araçlar',

  'toolbar.settings': 'Ayarlar',
  'toolbar.settings.tooltip': 'Hazır ayarlar, klasör izleme, geçmiş, görünüm ve tanılama',

  'toolbar.panel.preview': 'Canlı önizleme',
  'toolbar.panel.stats': 'İstatistikler',
  'toolbar.panel.presets': 'Hazır ayarlar',
  'toolbar.panel.watch': 'Klasör izleme',
  'toolbar.panel.history': 'Çalıştırma geçmişi',
  'toolbar.panel.preferences': 'Tercihler ve tanılama',
  'toolbar.panel.diagnostics': 'Tanılama',
  'toolbar.panel.about': 'BICO hakkında',

  'toolbar.theme.dark': 'Koyu tema',
  'toolbar.theme.light': 'Açık tema',
  'toolbar.theme.system': 'Tema sistemi izliyor',
  'toolbar.theme.change': 'Temayı değiştir',
  'toolbar.theme.cycle': 'Görünüm: {theme}',
  'toolbar.theme.tooltip': '{theme}. Değiştirmek için tıklayın.',

  'toolbar.confirm.title': 'Dönüştürmeyi başlat',
  'toolbar.confirm.one': 'Bir görsel {format} biçimine dönüştürülecek.',
  'toolbar.confirm.many': '{count} görsel {format} biçimine dönüştürülecek.',
  'toolbar.confirm.oneOriginal': 'Bir görsel, kendi biçimi korunarak dönüştürülecek.',
  'toolbar.confirm.manyOriginal':
    '{count} görsel, her biri kendi biçimini koruyarak dönüştürülecek.',
  'toolbar.confirm.ok': 'Başlat',
  'toolbar.confirm.cancel': 'Şimdi değil',

  'toolbar.progress.aria': 'Dönüştürme ilerlemesi, yüzde {percent} tamamlandı',

  /* ================================================================ */
  /* Stat strip                                                        */
  /* ================================================================ */

  'stats.queued.one': 'Kuyruktaki görsel',
  'stats.queued.many': 'Kuyruktaki görsel',
  'stats.sourceSize': 'Kaynak boyutu',
  'stats.targetFormat.original': 'Orijinal',
  'stats.targetFormat.originalTagline': 'Her dosya kendi biçimini korur',
  'stats.targetFormat.originalHint': 'Hiçbir kapsayıcı değişikliği uygulanmaz.',
  'stats.throughput.value': '{rate} MB/sn',
  'stats.throughput.label': '{duration} kaldı',
  'stats.estimate.label': 'Tahmini çıktı',
  'stats.estimate.pending': 'Tahmin ediliyor',
  'stats.estimate.smaller': '%{percent} daha küçük',
  'stats.estimate.larger': '%{percent} daha büyük',

  /* ================================================================ */
  /* Status bar                                                        */
  /* ================================================================ */

  'statusbar.gpu.probing': 'Grafik desteği denetleniyor',
  'statusbar.gpu.probingDetail': 'BICO kullanılabilir bağdaştırıcıları hâlâ yokluyor.',
  'statusbar.gpu.unavailable': 'GPU kullanılamıyor, {reason}',
  'statusbar.gpu.unavailableReason': 'uyumlu bağdaştırıcı bulunamadı',
  'statusbar.gpu.unavailableDetail': 'Her görsel CPU hattında işlenecek.',
  'statusbar.gpu.idle': 'GPU boşta, {reason}',
  'statusbar.gpu.idleReason': 'hızlandırma ayarlardan kapatılmış',
  'statusbar.gpu.idleDetail':
    'Kullanmak için performans ayarlarındaki işleme arka ucunu değiştirin.',
  'statusbar.gpu.active': '{device} üzerinde GPU hızlandırma',
  'statusbar.gpu.genericAdapter': 'grafik bağdaştırıcısı',
  'statusbar.gpu.activeDetail':
    "{processed} görsel GPU hatlarında tamamlandı, {fallbacks} tanesi CPU'ya düştü.",
  'statusbar.gpu.openDiagnostics': 'Tanılama panelini aç',

  'statusbar.workers.one': 'Tek çalışan iş parçacığı',
  'statusbar.workers.many': '{count} çalışan iş parçacığı',
  'statusbar.workers.detail': 'Dönüştürme havuzunun kullanabileceği CPU çalışan iş parçacıkları.',
  'statusbar.working': 'Çalışıyor: {devices}',
  'statusbar.working.detail': 'Şu anda görsel işleyen tüm hatlar.',

  'statusbar.output.folder': 'Klasör',
  'statusbar.output.archive': 'Arşiv',
  'statusbar.output.inPlace': 'Yerinde, her dosya kaynağının yanına yeniden yazılır',
  'statusbar.output.inPlaceDetail':
    'Her kaynak dosya dönüştürülmüş sürümüyle değiştirilir. Hiçbir şey başka bir yere kopyalanmaz.',
  'statusbar.output.label': '{label}:',
  'statusbar.output.revealHint': '{path}. Dosya yöneticisinde göstermek için tıklayın.',
  'statusbar.output.noArchive': 'Henüz arşiv seçilmedi',
  'statusbar.output.noFolder': 'Henüz çıktı klasörü seçilmedi',
  'statusbar.output.noneDetail': 'Çalıştırmaya başlamadan önce çıktı bölümünden bir hedef seçin.',

  'statusbar.rate.throughput': '{rate} MB/sn',
  'statusbar.rate.throughputDetail': 'Tüm hatlarda saniyede okunan kaynak megabayt.',
  'statusbar.rate.images': '{rate} görsel/sn',
  'statusbar.rate.imagesDetail': 'Tüm hatlarda saniyede tamamlanan görsel.',

  /* ================================================================ */
  /* Command palette                                                   */
  /* ================================================================ */

  'palette.search.placeholder': 'Komut, panel ve hazır ayar ara',
  'palette.search.aria': 'Komut ara',
  'palette.list.aria': 'Komutlar',
  'palette.empty': 'Bu aramayla eşleşen komut yok.',
  'palette.empty.hint': 'Daha kısa bir sözcük ya da hazır ayar adının bir bölümünü deneyin.',
  'palette.hint.move': 'Gezinmek için yukarı ve aşağı',
  'palette.hint.run': 'Çalıştırmak için Enter',
  'palette.hint.close': 'Kapatmak için Escape',

  'palette.section.files': 'Dosyalar',
  'palette.section.conversion': 'Dönüştürme',
  'palette.section.panels': 'Paneller',
  'palette.section.appearance': 'Görünüm',
  'palette.section.presets': 'Hazır ayarlar',
  'palette.section.help': 'Yardım',

  'palette.command.addFiles': 'Görsel ekle',
  'palette.command.addFiles.keywords': 'içe aktar aç resim fotoğraf gözat',
  'palette.command.addFolder': 'Görsel klasörü ekle',
  'palette.command.addFolder.keywords': 'içe aktar dizin klasör özyinelemeli ağaç',
  'palette.command.outputFolder': 'Çıktı klasörünü seç',
  'palette.command.outputFolder.keywords': 'hedef kaydet nereye dizin klasör',
  'palette.command.outputZip': 'Çıktıyı ZIP arşivine yaz',
  'palette.command.outputZip.keywords': 'zip arşiv sıkıştır paket toparla',
  'palette.command.removeSelected': 'Seçili görseli kaldır',
  'palette.command.removeSelected.keywords': 'sil çıkar at satır',
  'palette.command.clearQueue': 'Kuyruğu temizle',
  'palette.command.clearQueue.keywords': 'boşalt sıfırla hepsini kaldır baştan',
  'palette.command.start': 'Dönüştürmeyi başlat',
  'palette.command.start.keywords': 'çalıştır başla işle toplu',
  'palette.command.pause': 'Çalıştırmayı duraklat veya sürdür',
  'palette.command.pause.keywords': 'beklet devam et askıya al',
  'palette.command.cancel': 'Çalıştırmayı iptal et',
  'palette.command.cancel.keywords': 'durdur vazgeç sonlandır',
  'palette.command.panelPreview': 'Canlı önizlemeyi aç',
  'palette.command.panelPreview.keywords': 'karşılaştır önce sonra kalite denetimi',
  'palette.command.panelPresets': 'Hazır ayarları yönet',
  'palette.command.panelPresets.keywords': 'kitaplık kayıtlı profil tarif',
  'palette.command.panelWatch': 'İzlenen klasörü yapılandır',
  'palette.command.panelWatch.keywords': 'sıcak klasör otomatik izleme bırak',
  'palette.command.panelHistory': 'Çalıştırma geçmişini aç',
  'palette.command.panelHistory.keywords': 'geçmiş önceki günlük sonuçlar',
  'palette.command.panelDiagnostics': 'Tanılamayı aç',
  'palette.command.panelDiagnostics.keywords': 'sistem gpu günlük destek sorun giderme',
  'palette.command.panelAbout': 'BICO hakkında',
  'palette.command.panelAbout.keywords': 'sürüm emeği geçenler lisans',
  'palette.command.themeDark': 'Koyu temayı kullan',
  'palette.command.themeDark.keywords': 'gece renk şeması',
  'palette.command.themeLight': 'Açık temayı kullan',
  'palette.command.themeLight.keywords': 'gündüz aydınlık renk şeması',
  'palette.command.themeSystem': 'Sistem temasını izle',
  'palette.command.themeSystem.keywords': 'otomatik işletim sistemi renk şeması',
  'palette.command.viewTable': 'Kuyruğu tablo olarak göster',
  'palette.command.viewTable.keywords': 'liste satır sütun ayrıntı',
  'palette.command.viewGrid': 'Kuyruğu ızgara olarak göster',
  'palette.command.viewGrid.keywords': 'küçük resim kart döşeme galeri',
  'palette.command.toggleSidebar': 'Ayarlar kenar çubuğunu aç veya kapat',
  'palette.command.toggleSidebar.keywords': 'gizle göster panel daralt',
  'palette.command.help': 'BICO proje sayfasını aç',
  'palette.command.help.keywords': 'belgeler github readme destek sorunlar',
  'palette.command.applyPreset': 'Hazır ayarı uygula: {name}',

  /* ================================================================ */
  /* Run summary                                                       */
  /* ================================================================ */

  'summary.title': 'Çalıştırma özeti',
  'summary.result.cancelled': 'Çalıştırma iptal edildi',
  'summary.result.partial': 'Bazı hatalarla tamamlandı',
  'summary.result.success': 'Tüm görseller dönüştürüldü',
  'summary.format.original': 'kendi özgün biçimleri',
  'summary.subtitle.cancelled': '{total} görselin {processed} tanesinden sonra durduruldu.',
  'summary.subtitle.partial':
    '{total} görselin {processed} tanesi {format} olarak yazıldı, {failed} tanesi başarısız.',
  'summary.subtitle.success': '{processed} görsel {duration} içinde {format} olarak yazıldı.',

  'summary.tile.converted': 'Dönüştürülen',
  'summary.tile.failed': 'Başarısız',
  'summary.tile.skipped': 'Atlanan',
  'summary.tile.totalTime': 'Toplam süre',
  'summary.tile.averagePerImage': 'Görsel başına ortalama',
  'summary.tile.sizeBefore': 'Önceki boyut',
  'summary.tile.sizeAfter': 'Sonraki boyut',
  'summary.tile.saved': 'Tasarruf',
  'summary.tile.savedPercent': 'Tasarruf yüzdesi',
  'summary.tile.savedPercentValue': '%{percent}',

  'summary.lanes.title': 'İşin yapıldığı yer',
  'summary.lanes.empty': 'Hiçbir görsel tamamlanmadı, bölüştürülecek bir şey yok.',
  'summary.lanes.aria': '{gpu} görsel GPU hatlarında, {cpu} görsel CPU çalışanlarında',
  'summary.lanes.gpu': 'GPU {count} görsel, %{percent}',
  'summary.lanes.cpu': 'CPU {count} görsel, %{percent}',

  'summary.output.title': 'Çıktı',
  'summary.output.unknown': 'Bu çalıştırma için çıktı konumu kaydedilmedi.',
  'summary.output.openReport': 'CSV raporunu aç',

  'summary.errors.one': 'Bir görsel dönüştürülemedi',
  'summary.errors.many': '{count} görsel dönüştürülemedi',
  'summary.errors.copy': 'Tüm hataları kopyala',
  'summary.errors.copied': 'Tüm hatalar panoya kopyalandı.',

  /* ================================================================ */
  /* Queue                                                             */
  /* ================================================================ */

  'queue.count.one': 'Bir görsel',
  'queue.count.many': '{count} görsel',
  'queue.count.filtered': '{total} görselden {shown} tanesi',

  'queue.view.table': 'Tablo görünümü',
  'queue.view.grid': 'Izgara görünümü',

  'queue.search.placeholder': 'Dosya adına göre filtrele',
  'queue.filter.aria': 'Kuyruğu duruma göre filtrele',
  'queue.filter.all': 'Tüm görseller',
  'queue.filter.pending': 'Bekleyen',
  'queue.filter.done': 'Bitti',
  'queue.filter.failed': 'Başarısız',
  'queue.filter.skipped': 'Atlandı',

  'queue.clear': 'Temizle',
  'queue.clear.title': 'Kuyruğu temizle',
  'queue.clear.description': 'Tüm görseller listeden çıkar. Diskte hiçbir şey silinmez.',
  'queue.clear.confirm': 'Temizle',
  'queue.clear.keep': 'Kalsın',

  'queue.column.thumbnail': 'Önizleme',
  'queue.column.file': 'Dosya',
  'queue.column.dimensions': 'Boyutlar',
  'queue.column.source': 'Kaynak',
  'queue.column.output': 'Çıktı',
  'queue.column.status': 'Durum',
  'queue.column.backend': 'Arka uç',
  'queue.column.actions': 'İşlemler',

  'queue.dimensions.value': '{width} x {height}',
  'queue.dimensions.reading': 'Okunuyor',
  'queue.dimensions.readingHint': 'BICO bu dosyanın başlığını hâlâ okuyor.',

  'queue.output.pending': 'Bekliyor',
  'queue.output.none': 'Yok',
  'queue.output.smaller': '-%{percent}',
  'queue.output.larger': '+%{percent}',

  'queue.backend.gpuHint': 'Grafik bağdaştırıcısı',
  'queue.backend.cpuHint': 'Çalışan iş parçacığı',

  'queue.row.remove': 'Kuyruktan kaldır',
  'queue.row.removeNamed': '{name} dosyasını kaldır',
  'queue.row.thumbnailAlt': '{name} küçük resmi',

  'queue.empty.filtered': 'Bu filtreyle eşleşen görsel yok.',
  'queue.empty.filteredHint': 'Arama alanını temizleyin ya da başka bir durum seçin.',
  'queue.grid.limited':
    'İlk {count} görsel gösteriliyor. Kuyruğun tamamı için tablo görünümüne geçin.',

  'dropzone.title': 'Başlamak için görselleri buraya bırakın',
  'dropzone.body':
    'Dosya ya da klasör sürükleyin. Klasörler en alta kadar taranır, orijinallere dokunulmaz.',
  'dropzone.formats': 'Okunabilen biçimler: {list}',
  'dropzone.feature.recursive': 'Alt klasörler dâhil',
  'dropzone.feature.nondestructive': 'Orijinallere dokunulmaz',
  'dropzone.feature.formats': '{count} girdi biçimi',

  /* ================================================================ */
  /* Shared value formats and anchor names                             */
  /* ================================================================ */

  'settings.value.px': '{value} px',
  'settings.value.percent': '%{value}',
  'settings.value.percentWord': 'yüzde {value}',
  'settings.value.degrees': '{value} derece',
  'settings.value.deg': '{value} der',
  'settings.value.megabytes': '{value} MB',
  'settings.value.range': '{min} - {max}',

  'settings.axis.x': 'X',
  'settings.axis.y': 'Y',
  'settings.axis.width': 'G',
  'settings.axis.height': 'Y',

  'settings.position.center': 'Orta',
  'settings.position.north': 'Üst',
  'settings.position.northeast': 'Sağ üst',
  'settings.position.east': 'Sağ',
  'settings.position.southeast': 'Sağ alt',
  'settings.position.south': 'Alt',
  'settings.position.southwest': 'Sol alt',
  'settings.position.west': 'Sol',
  'settings.position.northwest': 'Sol üst',
  'settings.position.entropy': 'En yoğun alan',
  'settings.position.attention': 'Ana özne',

  /* ================================================================ */
  /* Sidebar sections and their header badges                          */
  /* ================================================================ */

  'settings.section.format': 'Çıktı biçimi',
  'settings.section.resize': 'Yeniden boyutlandırma',
  'settings.section.transform': 'Dönüşüm',
  'settings.section.adjust': 'Ayarlamalar',
  'settings.section.watermark': 'Filigran',
  'settings.section.metadata': 'Meta veri',
  'settings.section.output': 'Çıktı',
  'settings.section.variants': 'Varyantlar',
  'settings.section.smart': 'Akıllı',
  'settings.section.performance': 'Performans',

  'settings.summary.more': '{first} +{count}',

  'settings.summary.format.original': 'Orijinal',
  'settings.summary.format.lossless': '{format} kayıpsız',
  'settings.summary.format.quality': '{format} {quality}',

  'settings.summary.resize.exact': '{width} x {height}',
  'settings.summary.resize.exactUnset': 'Tam boyut',
  'settings.summary.resize.width': '{value} genişlik',
  'settings.summary.resize.widthUnset': 'Sabit genişlik',
  'settings.summary.resize.height': '{value} yükseklik',
  'settings.summary.resize.heightUnset': 'Sabit yükseklik',
  'settings.summary.resize.longest': '{value} uzun kenar',
  'settings.summary.resize.longestUnset': 'En uzun kenar',
  'settings.summary.resize.shortest': '{value} kısa kenar',
  'settings.summary.resize.shortestUnset': 'En kısa kenar',
  'settings.summary.resize.percentage': '%{value}',
  'settings.summary.resize.megapixels': '{value} MP',

  'settings.summary.transform.rotated': '{angle} döndürüldü',
  'settings.summary.transform.flippedBoth': 'İki yönde çevrildi',
  'settings.summary.transform.mirrored': 'Aynalandı',
  'settings.summary.transform.flipped': 'Çevrildi',
  'settings.summary.transform.cropped': 'Kırpıldı',
  'settings.summary.transform.border': '{value} px kenarlık',
  'settings.summary.transform.exifIgnored': 'EXIF yok sayıldı',

  'settings.summary.adjust.activeOne': '1 etkin',
  'settings.summary.adjust.active': '{count} etkin',

  'settings.summary.watermark.text': 'Metin',
  'settings.summary.watermark.image': 'Görsel',

  'settings.summary.metadata.keepAll': 'Tümü korunur',
  'settings.summary.metadata.keepProfile': 'Profil korunur',
  'settings.summary.metadata.keepCopyright': 'Telif korunur',
  'settings.summary.metadata.density': '{value} DPI',
  'settings.summary.metadata.customProfile': 'Özel profil',
  'settings.summary.metadata.attributed': 'Künye eklendi',

  'settings.summary.output.zip': 'ZIP içine',
  'settings.summary.output.inPlace': 'Yerinde',
  'settings.summary.output.mirror': 'Yansıtılmış ağaç',
  'settings.summary.output.byFormat': 'Biçime göre ayrı',
  'settings.summary.output.byDate': 'Tarihe göre ayrı',
  'settings.summary.output.customNames': 'Özel adlar',
  'settings.summary.output.overwrites': 'Üzerine yazar',
  'settings.summary.output.skipsExisting': 'Var olanı atlar',
  'settings.summary.output.caseChanged': 'Harf durumu değişir',
  'settings.summary.output.skipsGrowth': 'Büyümeyi atlar',
  'settings.summary.output.report': 'CSV raporu',

  'settings.summary.variants.enabledOne': '1 etkin',
  'settings.summary.variants.enabled': '{count} etkin',

  'settings.summary.smart.under': '{value} KB altı',
  'settings.summary.smart.about': 'Yaklaşık {value} KB',
  'settings.summary.smart.autoFormat': 'Otomatik biçim',
  'settings.summary.smart.autoPalette': 'Otomatik palet',

  'settings.summary.performance.gpuOnly': 'Yalnızca GPU',
  'settings.summary.performance.cpuOnly': 'Yalnızca CPU',
  'settings.summary.performance.workerOne': '1 çalışan',
  'settings.summary.performance.workers': '{count} çalışan',
  'settings.summary.performance.everyGpu': "Tüm GPU'lar",
  'settings.summary.performance.noGpuAssist': 'GPU desteği yok',
  'settings.summary.performance.cache': '{value} MB önbellek',

  /* ================================================================ */
  /* Preset bar                                                        */
  /* ================================================================ */

  'settings.preset.select': 'Etkin hazır ayar',
  'settings.preset.groupBuiltin': 'Yerleşik',
  'settings.preset.groupMine': 'Sizinkiler',
  'settings.preset.modified': 'Değiştirildi',
  'settings.preset.revertTooltip': 'Bu değişiklikleri at ve hazır ayarı yeniden yükle',
  'settings.preset.revertLabel': 'Kayıtlı hazır ayara dön',
  'settings.preset.saveTooltip': 'Ekrandaki ayarları kendi hazır ayarınız olarak kaydedin',
  'settings.preset.save': 'Kaydet',

  /* ================================================================ */
  /* Format section                                                    */
  /* ================================================================ */

  'settings.format.label': 'Çıktı biçimi',
  'settings.format.original.label': 'Her dosyanın biçimini koru',
  'settings.format.jpeg.tagline': 'Evrensel fotoğraf biçimi',
  'settings.format.jpeg.description':
    'Her yerde açılır. Saydamlık ya da animasyon yok, ama MozJPEG onu fotoğraflarda rekabetçi tutar.',
  'settings.format.png.tagline': 'Saydamlık destekli kayıpsız',
  'settings.format.png.description':
    'Alpha ile piksel birebir; ekran görüntüsü, logo ve UI varlıkları için. Palet modu düz çizimleri iyice küçültür.',
  'settings.format.webp.tagline': 'Güvenli modern varsayılan',
  'settings.format.webp.description':
    "Aynı kalitede JPEG'den yaklaşık yüzde 30 daha küçük; alpha ve animasyon destekli. Güncel her tarayıcı okur.",
  'settings.format.avif.tagline': 'En küçük dosya, yavaş kodlama',
  'settings.format.avif.description':
    "Buradaki en iyi sıkıştırma; çoğu kez WebP'nin yarısı boyutunda. Kodlaması yavaştır, çabayı yalnızca boyut çok önemliyken artırın.",
  'settings.format.tiff.tagline': 'Arşiv ve baskı',
  'settings.format.tiff.description':
    'Baskı, tarama ve arşiv için. Yüksek bit derinlikleri, çeşitli sıkıştırma yöntemleri ve piramit döşeme.',
  'settings.format.gif.tagline': 'Eski usul animasyon',
  'settings.format.gif.description':
    '256 renkle sınırlı ve yerini animasyonlu WebP aldı, ama eski uygulamalarda kısa döngüler için hâlâ en güvenlisi.',
  'settings.format.heif.tagline': 'Apple ekosistemi',
  'settings.format.heif.description':
    "iPhone'ların varsayılan biçimi. Güçlü sıkıştırma ve geniş renk, ama Apple dışındaki platformlarda görüntülenmesi sorunlu.",
  'settings.format.jxl.tagline': "AVIF'ten küçük, kodlaması hızlı",
  'settings.format.jxl.description':
    "Aynı boyutta AVIF'ten daha çok ayrıntı korur ve daha hızlı kodlar. Tarayıcı desteği sınırlı, meta veri çıktıya taşınmaz.",
  'settings.format.jp2.tagline': 'Dalgacık arşiv biçimi',
  'settings.format.jp2.description':
    'Tıbbi görüntüleme, dijital sinema ve bazı arşivlerde zorunlu. Dosyalar büyüktür ve kalite bir yüzde değil, sinyal gürültü oranı hedefidir.',

  'settings.format.original.tagline': 'Dönüştürme yok, yalnızca optimizasyon',
  'settings.format.original.description':
    'Her dosya geldiği biçime geri yazılır. Yeniden boyutlandırma, ayarlamalar ve filigranlar yine uygulanır.',
  'settings.format.unavailable': 'Kullanılamıyor: bu libvips yapısı o codec olmadan derlenmiş.',

  'settings.format.caps.alpha.on': 'Saydamlık',
  'settings.format.caps.alpha.off': 'Saydamlık yok',
  'settings.format.caps.animation.on': 'Animasyon',
  'settings.format.caps.animation.off': 'Animasyon yok',
  'settings.format.caps.lossless.on': 'Kayıpsız mod',
  'settings.format.caps.lossless.off': 'Yalnızca kayıplı',
  'settings.format.caps.hdr.on': 'Yüksek bit derinliği',
  'settings.format.caps.hdr.off': 'Yalnızca sekiz bit',
  'settings.format.caps.metadata.on': 'Meta veriyi korur',
  'settings.format.caps.metadata.off': 'Meta veriyi siler',
  'settings.format.caps.gpu.on': 'GPU ile kodlanabilir',
  'settings.format.caps.gpu.off': "CPU'da kodlanır",

  'settings.format.quality.label': 'Kalite',
  'settings.format.quality.hint':
    'Yükseği daha büyük dosyalarda daha çok ayrıntı korur. Fotoğraflar 75 ile 90 arasında sorunsuz.',
  'settings.format.lossless.label': 'Kayıpsız',
  'settings.format.lossless.hint': 'Her pikseli birebir yeniden üretir. Dosyalar çok büyür.',
  'settings.format.effort.label': 'Kodlayıcı çabası',
  'settings.format.effort.hint':
    'Daha yüksek çaba, daha küçük dosya ve daha yavaş kodlama demektir.',
  'settings.format.effort.fast': 'Hızlı',
  'settings.format.effort.small': 'Küçük',
  'settings.format.chroma.label': 'Kroma alt örnekleme',
  'settings.format.chroma.hint':
    '4:4:4 rengi tam çözünürlükte saklar. 4:2:0 bunun dörtte birini saklar.',
  'settings.format.alphaQuality.label': 'Alfa kalitesi',
  'settings.format.alphaQuality.hint':
    'Saydamlık maskesinin ne kadar sıkıştırılacağı. 100 değerinde bırakın.',
  'settings.format.progressive.label': 'Aşamalı',
  'settings.format.progressive.hint':
    'Önce kaba bir sürüm gösterir, gerisi geldikçe onu iyileştirir.',
  'settings.format.animated.label': 'Animasyonu koru',
  'settings.format.animated.hint':
    'Animasyonlu kaynağın her karesini dönüştürür. Kapalıyken yalnızca ilkini yazar.',

  'settings.format.jpeg.title': 'JPEG kodlayıcı',
  'settings.format.jpeg.mozjpeg.label': 'MozJPEG',
  'settings.format.jpeg.mozjpeg.hint':
    "Mozilla'nın ayarlanmış kodlayıcısı. Aynı kalitede standart kodlayıcıdan genellikle yüzde 5 ila 15 daha küçük, ama daha yavaş.",
  'settings.format.jpeg.trellis.label': 'Trellis niceleme',
  'settings.format.jpeg.trellis.hint':
    'Her katsayıyı saklama maliyetine göre optimize eder. Yavaştır, birkaç yüzde kazandırır.',
  'settings.format.jpeg.overshoot.label': 'Halka giderme',
  'settings.format.jpeg.overshoot.hint': 'Metni kirli gösteren, sert kenarlardaki haleyi bastırır.',
  'settings.format.jpeg.scans.label': 'Aşamalı taramaları optimize et',
  'settings.format.jpeg.scans.hint':
    'Daha iyi bir aşamalı tarama sırası arar. Aşamalı açık olmalı.',

  'settings.format.png.title': 'PNG kodlayıcı',
  'settings.format.png.compression.label': 'Sıkıştırma düzeyi',
  'settings.format.png.compression.hint':
    '0 ile 9 arasında Deflate çabası. 9. düzey, 7. düzeyden daha fazla zaman harcar.',
  'settings.format.png.palette.label': 'Palete indirge',
  'settings.format.png.palette.hint':
    'Görseli indeksli renge indirger. Fotoğraflar posterize olur.',
  'settings.format.png.colours.label': 'Palet renkleri',
  'settings.format.png.colours.hint':
    'Korunacak farklı renk sayısı. Logolar ve ekran görüntüleri 64 ile sorunsuz kalır.',
  'settings.format.png.dither.label': 'Dither',
  'settings.format.png.dither.hint':
    'Niceleme hatasını dağıtır, böylece renk geçişleri daha az şeritlenir.',
  'settings.format.png.adaptive.label': 'Uyarlanabilir filtreleme',
  'settings.format.png.adaptive.hint':
    'Her tarama satırına ayrı filtre seçer. Fotoğraflara yarar, düz çizime zarar verir.',

  'settings.format.webp.title': 'WebP kodlayıcı',
  'settings.format.webp.nearLossless.label': 'Kayıpsıza yakın',
  'settings.format.webp.nearLossless.hint':
    'Görseli ön işler, böylece kayıpsız kodlama onu çok daha küçük sıkıştırır.',
  'settings.format.webp.smartSubsample.label': 'Akıllı alt örnekleme',
  'settings.format.webp.smartSubsample.hint':
    'Renk çözünürlüğüne kodlayıcı, grup başına değil görsel başına karar verir.',

  'settings.format.tiff.title': 'TIFF kapsayıcı',
  'settings.format.tiff.compression.label': 'Sıkıştırma',
  'settings.format.tiff.compression.hint':
    'LZW ve Deflate kayıpsızdır. JPEG ve WebP kayıplıdır ve kaliteyi dikkate alır.',
  'settings.format.tiff.compression.ccitt': 'CCITT Grup 4 faks',
  'settings.format.tiff.predictor.label': 'Öngörücü',
  'settings.format.tiff.predictor.hint':
    'Komşu pikseller arasındaki farkı saklar, LZW ve Deflate için işe yarar.',
  'settings.format.tiff.predictor.horizontal': 'Yatay',
  'settings.format.tiff.predictor.float': 'Kayan nokta',
  'settings.format.tiff.bitdepth.label': 'Kanal başına bit',
  'settings.format.tiff.bitdepth.hint':
    "8'in altı iki seviyeli ya da az renkli yazar, taranmış çizgi çalışmalarına uygundur.",
  'settings.format.tiff.pyramid.label': 'Piramit döşeme',
  'settings.format.tiff.pyramid.hint':
    'Büyük görselleri görüntülemek için tek dosyaya birkaç çözünürlük yazar.',

  'settings.format.gif.title': 'GIF paleti',
  'settings.format.gif.colours.label': 'Palet renkleri',
  'settings.format.gif.colours.hint':
    "GIF en fazla 256 renk tutar. 64'e inmek çoğu kez üçte bir kazandırır.",
  'settings.format.gif.dither.label': 'Dither',
  'settings.format.gif.dither.hint':
    'Yükseği geçiş şeritlenmesini gizler ama gürültü ve dosya boyutu ekler.',
  'settings.format.gif.loop.label': 'Döngü sayısı',
  'settings.format.gif.loop.hint': 'Sıfır sonsuza dek yineler. Başka bir sayı o kadar kez oynatır.',

  'settings.format.jxl.title': 'JPEG XL',
  'settings.format.jxl.note':
    'JPEG XL kodlayıcısı WebAssembly ile çalışır, bu yüzden diğerlerinden yavaştır. Meta veri çıktıya taşınmaz.',

  /* ================================================================ */
  /* Resize section                                                    */
  /* ================================================================ */

  'settings.resize.strategy.label': 'Yöntem',
  'settings.resize.strategy.none': 'Yeniden boyutlandırma yok',
  'settings.resize.strategy.exact': 'Tam genişlik ve yükseklik',
  'settings.resize.strategy.width': 'Sabit genişlik',
  'settings.resize.strategy.height': 'Sabit yükseklik',
  'settings.resize.strategy.longest': 'En uzun kenar',
  'settings.resize.strategy.shortest': 'En kısa kenar',
  'settings.resize.strategy.percentage': 'Orijinalin yüzdesi',
  'settings.resize.strategy.megapixels': 'Toplam megapiksel',

  'settings.resize.target.label': 'Hedef boyut',
  'settings.resize.target.hint': 'İki sayı da piksel cinsindendir.',
  'settings.resize.width.label': 'Genişlik',
  'settings.resize.width.placeholder': 'Genişlik',
  'settings.resize.height.label': 'Yükseklik',
  'settings.resize.height.placeholder': 'Yükseklik',
  'settings.resize.edge.hint': 'Piksel cinsinden ölçülür.',
  'settings.resize.pixels.placeholder': 'Piksel',
  'settings.resize.scale.label': 'Ölçek',
  'settings.resize.megapixels.label': 'Megapiksel',
  'settings.resize.megapixels.hint': 'On iki megapiksel kabaca 4000 x 3000 pikseldir.',
  'settings.resize.megapixels.suffix': 'MP',

  'settings.resize.locked':
    'Sığdırma, konum ve yeniden örneklemeyi açmak için yukarıdan bir yöntem seçin.',

  'settings.resize.fit.label': 'Sığdırma',
  'settings.resize.fit.hint':
    'Kapla kırpar, Sığdır boşluk ekler, İçine ve Dışına en boy oranını korur.',
  'settings.resize.fit.cover': 'Kapla',
  'settings.resize.fit.contain': 'Sığdır',
  'settings.resize.fit.fill': 'Doldur',
  'settings.resize.fit.inside': 'İçine',
  'settings.resize.fit.outside': 'Dışına',

  'settings.resize.position.label': 'Konum',
  'settings.resize.position.hint':
    'Kapla kırpmasının hangi bölümü koruyacağı, Sığdır boşluğunun görseli nereye oturtacağı.',

  'settings.resize.kernel.label': 'Yeniden örnekleme',
  'settings.resize.kernel.hint':
    'Lanczos 3 fotoğraflarda en keskinidir. En yakın komşu piksel sanatına uygundur.',
  'settings.resize.kernel.lanczos3': 'Lanczos 3',
  'settings.resize.kernel.lanczos2': 'Lanczos 2',
  'settings.resize.kernel.mitchell': 'Mitchell',
  'settings.resize.kernel.cubic': 'Kübik',
  'settings.resize.kernel.nearest': 'En yakın komşu',

  'settings.resize.noEnlarge.label': 'Asla büyütme',
  'settings.resize.noEnlarge.hint': 'Bir görsel hedeften zaten küçükse ona dokunmaz.',
  'settings.resize.noReduce.label': 'Asla küçültme',
  'settings.resize.noReduce.hint': 'Bir görsel hedeften zaten büyükse ona dokunmaz.',
  'settings.resize.background.label': 'Arka plan',
  'settings.resize.background.hint':
    'Sığdır seçeneğinin bıraktığı boşluğu doldurur. Saydamlık için alfa destekli bir biçim gerekir.',

  'settings.resize.outcome.unchanged': 'Her görsel orijinal piksel boyutlarını korur.',
  'settings.resize.outcome.missingTarget':
    'Hedef boyut belirlenmedi, bu yüzden görseller orijinal boyutlarını korur.',
  'settings.resize.outcome.exact.cover':
    'Her görsel tam olarak {width} x {height} pikseli dolduracak biçimde ölçeklenir ve kırpılır.',
  'settings.resize.outcome.exact.contain':
    'Her görsel {width} x {height} içine sığdırılır, artan boşluk arka plan rengini alır.',
  'settings.resize.outcome.exact.fill':
    'Her görsel en boy oranı yok sayılarak tam {width} x {height} piksele esnetilir.',
  'settings.resize.outcome.exact.inside':
    'Her görsel {width} x {height} pikselin içine sığacak biçimde ölçeklenir, bu yüzden bir kenar kısa kalır.',
  'settings.resize.outcome.exact.outside':
    'Her görsel {width} x {height} pikseli kaplayana dek ölçeklenir, bu yüzden bir kenar taşar.',
  'settings.resize.outcome.width':
    'Her görsel {width} piksel genişliğe ölçeklenir, yükseklik en boy oranını izler.',
  'settings.resize.outcome.height':
    'Her görsel {height} piksel yüksekliğe ölçeklenir, genişlik en boy oranını izler.',
  'settings.resize.outcome.longest':
    'Her görsel en uzun kenarı {value} piksel olana dek ölçeklenir.',
  'settings.resize.outcome.shortest':
    'Her görsel en kısa kenarı {value} piksel olana dek ölçeklenir.',
  'settings.resize.outcome.percentage':
    'Her görsel orijinal boyutunun yüzde {value} kadarına ölçeklenir.',
  'settings.resize.outcome.percentageBlockedReducing':
    'Her görsel yüzde {value} oranına ölçeklenir, ama küçültme koruması bunu engeller, bu yüzden hiçbir şey değişmez.',
  'settings.resize.outcome.percentageBlockedEnlarging':
    'Her görsel yüzde {value} oranına ölçeklenir, ama büyütme koruması bunu engeller, bu yüzden hiçbir şey değişmez.',
  'settings.resize.outcome.megapixels':
    'Her görsel en boy oranını koruyarak yaklaşık {value} megapiksele ölçeklenir.',
  'settings.resize.guards.both':
    'İki koruma da açık; bu, yeniden boyutlandırmayı iptal eder ve her görseli olduğu gibi bırakır.',
  'settings.resize.guards.noEnlarge': 'Hiçbir görsel başladığından daha büyük yapılmaz.',
  'settings.resize.guards.noReduce': 'Hiçbir görsel başladığından daha küçük yapılmaz.',
  'settings.resize.guards.free': 'Hedeften küçük kaynaklar hedefe ulaşmak için büyütülür.',

  /* ================================================================ */
  /* Transform section                                                 */
  /* ================================================================ */

  'settings.transform.autoOrient.label': 'EXIF yönlendirmesine uy',
  'settings.transform.autoOrient.hint':
    'Fotoğraf makinesinin yönlendirme bayrağını, aşağıda ayarladığınız döndürmeden önce uygular.',
  'settings.transform.rotate.label': 'Döndür',
  'settings.transform.rotate.hint': 'Saat yönünde, yönlendirme bayrağından sonra uygulanır.',
  'settings.transform.flipVertical.label': 'Dikey çevir',
  'settings.transform.flipVertical.hint': 'Görseli yukarıdan aşağıya aynalar.',
  'settings.transform.flipHorizontal.label': 'Yatay çevir',
  'settings.transform.flipHorizontal.hint': 'Görseli soldan sağa aynalar.',

  'settings.transform.crop.title': 'Kırpma',
  'settings.transform.crop.enable.label': 'Yeniden boyutlandırmadan önce kırp',
  'settings.transform.crop.enable.hint':
    'Yeniden boyutlandırma adımından önce kaynağın bir bölümünü siler.',
  'settings.transform.crop.mode.label': 'Mod',
  'settings.transform.crop.mode.manual': 'Elle',
  'settings.transform.crop.mode.aspect': 'Oran',
  'settings.transform.crop.mode.trim': 'Kenarları buda',
  'settings.transform.crop.manual.hint':
    'Sol üst köşeden, kaynak piksel cinsinden sabit bir dikdörtgen; her dosyaya uygulanır.',
  'settings.transform.crop.offset.label': 'Konum',
  'settings.transform.crop.size.label': 'Boyut',
  'settings.transform.crop.size.hint': 'Sıfır, görselin kenarına kadar devam eder.',
  'settings.transform.crop.aspect.hint': 'Bu şekildeki en büyük dikdörtgeni korur, gerisini atar.',
  'settings.transform.crop.ratios.label': 'Yaygın oranlar',
  'settings.transform.crop.ratio.label': 'Oran',
  'settings.transform.crop.ratio.hint':
    "Genişliğin yüksekliğe bölümü. 1'in üstü yatay, altı dikeydir.",
  'settings.transform.crop.trim.hint': 'Neredeyse tek renk olan bir kenarlık algılar ve onu keser.',
  'settings.transform.crop.tolerance.label': 'Tolerans',
  'settings.transform.crop.tolerance.hint':
    'Bir pikselin köşe renginden ne kadar sapıp yine de kenarlık sayılabileceği.',

  'settings.transform.border.title': 'Kenarlık',
  'settings.transform.padding.label': 'Dolgu',
  'settings.transform.padding.hint':
    'Yeniden boyutlandırmadan sonra eklenen kenarlık. Çıktı bu sayının iki katı büyür.',
  'settings.transform.paddingColor.label': 'Dolgu rengi',
  'settings.transform.paddingColor.hint':
    'Saydamlık için alfa kanallı bir biçim gerekir. JPEG bunu siyaha düzleştirir.',

  /* ================================================================ */
  /* Adjust section                                                    */
  /* ================================================================ */

  'settings.adjust.colour.title': 'Renk',
  'settings.adjust.grayscale.label': 'Gri tonlama',
  'settings.adjust.grayscale.hint':
    'Renk kanallarını atar; palet tabanlı biçimlerde dosyayı belirgin biçimde küçültür.',
  'settings.adjust.invert.label': 'Tersine çevir',
  'settings.adjust.invert.hint': 'Alfa dışındaki her kanalın negatifini üretir.',
  'settings.adjust.sepia.label': 'Sepya',
  'settings.adjust.sepia.hint':
    'Sıcak tek renk tonu, varsa gri tonlama dönüşümünden sonra uygulanır.',
  'settings.adjust.tint.label': 'Renklendirme',
  'settings.adjust.tint.hint': 'Parlaklığını koruyarak görseli tek bir renge doğru iter.',
  'settings.adjust.tintColor.label': 'Renklendirme rengi',
  'settings.adjust.flatten.label': 'Saydamlığı düzleştir',
  'settings.adjust.flatten.hint':
    'Görseli düz bir rengin üzerine yerleştirir. Bu olmadan JPEG saydamlığı siyaha çevirir.',
  'settings.adjust.flattenColor.label': 'Arka plan rengi',

  'settings.adjust.tone.title': 'Ton',
  'settings.adjust.tone.hint':
    'Aşağıdaki kaydırıcılar nötrde durur. Birini oynatana dek hiçbir şey uygulanmaz.',
  'settings.adjust.brightness.label': 'Parlaklık',
  'settings.adjust.saturation.label': 'Doygunluk',
  'settings.adjust.contrast.label': 'Kontrast',
  'settings.adjust.hue.label': 'Ton döndürme',
  'settings.adjust.hue.hint': 'Her rengi renk çemberinde döndürür. Ten tonlarında küçük tutun.',
  'settings.adjust.lightness.label': 'Açıklık',
  'settings.adjust.lightness.hint':
    'Açıklığa sabit bir ekleme yapar. Gölgeler açılır, parlak alanlar patlamaz.',

  'settings.adjust.gamma.label': 'Gama düzeltmesi',
  'settings.adjust.gamma.hint': 'Saf siyaha ve saf beyaza dokunmadan orta tonları yeniden yazar.',
  'settings.adjust.gammaValue.label': 'Gama',
  'settings.adjust.gammaValue.hint':
    '2.2, sRGB eğrisiyle eşleşir. Düşüğü gölgeleri açar, yükseği koyulaştırır.',

  'settings.adjust.normalize.label': 'Seviyeleri normalleştir',
  'settings.adjust.normalize.hint':
    'Histogramı gerer: en koyu piksel siyah, en parlak piksel beyaz olur.',
  'settings.adjust.normalizeLower.label': 'Alt yüzdelik',
  'settings.adjust.normalizeLower.hint':
    'Siyaha kırpılmasına izin verilen en koyu piksellerin oranı.',
  'settings.adjust.normalizeUpper.label': 'Üst yüzdelik',
  'settings.adjust.normalizeUpper.hint': 'Üzerindeki piksellerin beyaza kırpıldığı nokta.',

  'settings.adjust.clahe.label': 'Yerel kontrast',
  'settings.adjust.clahe.hint':
    'Kontrast Sınırlı Uyarlanabilir Histogram Eşitleme, döşeme döşeme uygulanır.',
  'settings.adjust.claheWidth.label': 'Döşeme genişliği',
  'settings.adjust.claheWidth.hint':
    'Küçük döşemeler daha ince ayrıntı bulur, görünür ek yeri bırakma olasılığı artar.',
  'settings.adjust.claheHeight.label': 'Döşeme yüksekliği',
  'settings.adjust.claheSlope.label': 'En yüksek eğim',
  'settings.adjust.claheSlope.hint':
    'Döşeme başına kontrast tavanı. Sıfır sınırı kaldırır ve gürültüyü yükseltir.',

  'settings.adjust.detail.title': 'Ayrıntı',
  'settings.adjust.sharpen.label': 'Keskinleştir',
  'settings.adjust.sharpen.hint': 'Görseller küçültülürken açmaya değer.',
  'settings.adjust.sharpenRadius.label': 'Yarıçap',
  'settings.adjust.sharpenRadius.hint':
    'Algılanan kenarın genişliği. 1 civarı ekrana, yükseği baskıya uygundur.',
  'settings.adjust.sharpenFlat.label': 'Düz alan gücü',
  'settings.adjust.sharpenFlat.hint':
    'Pürüzsüz bölgelerin ne kadar keskinleştirileceği. Düşük tutun.',
  'settings.adjust.sharpenEdge.label': 'Kenar gücü',
  'settings.adjust.sharpenEdge.hint':
    'Gerçek kenarların ne kadar keskinleştirileceği. Asıl yükseltilecek ayar bu.',
  'settings.adjust.blur.label': 'Bulanıklaştır',
  'settings.adjust.blur.hint': 'Görselin tamamına uygulanan Gauss bulanıklığı.',
  'settings.adjust.blurRadius.label': 'Yarıçap',
  'settings.adjust.median.label': 'Medyan filtresi',
  'settings.adjust.median.hint':
    'Her pikseli komşularının medyanıyla değiştirir, benekleri temizler.',
  'settings.adjust.medianSize.label': 'Pencere boyutu',
  'settings.adjust.medianSize.hint':
    'Dikkate alınan komşu karesi. Büyük pencereler daha çok temizler, daha yavaş çalışır.',
  'settings.adjust.reset': 'Ayarlamaları sıfırla',

  /* ================================================================ */
  /* Watermark section                                                 */
  /* ================================================================ */

  'settings.watermark.kind.label': 'Filigran',
  'settings.watermark.kind.text': 'Metin',
  'settings.watermark.kind.textTooltip': 'Her görselin üzerine bir satır metin yazın',
  'settings.watermark.kind.image': 'Görsel',
  'settings.watermark.kind.imageTooltip': 'Her görselin üzerine bir logo ya da rozet bindirin',
  'settings.watermark.none.hint': 'Çıktıya hiçbir şey basılmaz.',

  'settings.watermark.text.label': 'Metin',
  'settings.watermark.text.placeholder': 'Örneğin PROVA ya da stüdyonuzun adı',
  'settings.watermark.fontSize.label': 'Yazı tipi boyutu',
  'settings.watermark.fontSize.hint': 'Çıktı çözünürlüğüne göre ölçülen piksel.',
  'settings.watermark.font.label': 'Yazı tipi',
  'settings.watermark.colour.label': 'Renk',
  'settings.watermark.colour.hint': 'Saydamlık buradan değil, opaklık kaydırıcısından gelir.',

  'settings.watermark.image.label': 'Filigran görseli',
  'settings.watermark.image.hint':
    'Saydam arka planlı bir PNG her opaklıkta temiz biçimde bindirilir.',
  'settings.watermark.image.choose': 'Görsel seç',
  'settings.watermark.image.change': 'Başka bir görsel seç',
  'settings.watermark.image.remove': 'Filigran görselini kaldır',

  'settings.watermark.position.label': 'Konum',
  'settings.watermark.position.hint': 'Döşeme kapalıyken damganın nereye oturacağı.',
  'settings.watermark.opacity.label': 'Opaklık',
  'settings.watermark.scale.label': 'Boyut',
  'settings.watermark.scale.hint': 'Çıktı genişliğinin yüzdesi olarak filigran genişliği.',
  'settings.watermark.margins.label': 'Kenar boşlukları',
  'settings.watermark.margins.hint': 'Seçilen kenardan uzaklık, piksel cinsinden.',
  'settings.watermark.margins.horizontal': 'Piksel cinsinden yatay kenar boşluğu',
  'settings.watermark.margins.vertical': 'Piksel cinsinden dikey kenar boşluğu',
  'settings.watermark.rotation.label': 'Döndürme',
  'settings.watermark.rotation.hint': 'Negatif değerler saat yönünün tersine döndürür.',
  'settings.watermark.tile.label': 'Görsel boyunca döşe',
  'settings.watermark.tile.hint': 'Filigranı bir kez yerleştirmek yerine baştan sona yineler.',

  /* ================================================================ */
  /* Metadata section                                                  */
  /* ================================================================ */

  'settings.metadata.policy.label': 'Ne korunsun',
  'settings.metadata.policy.strip': 'Temizle',
  'settings.metadata.policy.stripTooltip': 'Tüm etiketleri kaldır',
  'settings.metadata.policy.stripHint':
    'Bir fotoğrafın nerede çekildiğini kaydeden GPS koordinatları dâhil tüm etiketleri kaldırır.',
  'settings.metadata.policy.keep': 'Tümünü koru',
  'settings.metadata.policy.keepTooltip': 'GPS konumu dâhil her şeyi koru',
  'settings.metadata.policy.keepHint':
    'Tüm etiketleri kopyalar: fotoğraf makinesi, zaman damgaları, düzenleme geçmişi ve GPS konumu. Yalnızca sizde kalacak dosyalar için güvenlidir.',
  'settings.metadata.policy.icc': 'Yalnızca ICC',
  'settings.metadata.policy.iccTooltip': 'Yalnızca renk profilini koru',
  'settings.metadata.policy.iccHint':
    'Renk profilini korur, gerisini atar. Konum ya da fotoğraf makinesi verisi kalmaz.',
  'settings.metadata.policy.rights': 'Haklar',
  'settings.metadata.policy.rightsTooltip': 'Renk profilini, telif hakkını ve sanatçıyı koru',
  'settings.metadata.policy.rightsHint':
    'Renk profiliyle birlikte telif hakkı ve sanatçı alanlarını korur. GPS konumu yine kaldırılır.',

  'settings.metadata.density.label': 'Çözünürlüğü geçersiz kıl',
  'settings.metadata.density.hint':
    'Dosyadaki DPI değerini yeniden yazar. Matbaalar okur, tarayıcılar yok sayar.',
  'settings.metadata.density.blocked':
    'Yalnızca Tümünü koru seçiliyken ya da TIFF yazarken kullanılabilir. Diğer durumlarda bunu yazmak, bu ilkenin kaldırdığı etiketleri geri getirir.',
  'settings.metadata.resolution.label': 'Çözünürlük',
  'settings.metadata.resolution.aria': 'İnç başına nokta cinsinden çıktı çözünürlüğü',

  'settings.metadata.icc.label': 'ICC profili',
  'settings.metadata.icc.hint': 'srgb ya da p3 gibi bir profil adı veya bir .icc dosyasının yolu.',
  'settings.metadata.icc.placeholder': 'srgb',
  'settings.metadata.copyright.label': 'Telif hakkı',
  'settings.metadata.copyright.placeholder': 'Telif hakkı 2026 Stüdyonuz',
  'settings.metadata.artist.label': 'Sanatçı',
  'settings.metadata.artist.placeholder': 'Adınız',
  'settings.metadata.strippedNote':
    'Geçerli ilke tüm etiketleri kaldırdığı için telif hakkı ve sanatçı devre dışı. Bunları yazmak için Haklar seçeneğine geçin.',

  /* ================================================================ */
  /* Output section                                                    */
  /* ================================================================ */

  'settings.output.target.label': 'Nereye yazılsın',
  'settings.output.target.folder': 'Klasör',
  'settings.output.target.folderTooltip': 'Seçtiğiniz bir klasöre yazın',
  'settings.output.target.zip': 'ZIP arşivi',
  'settings.output.target.zipTooltip': 'Tüm çıktıları tek bir arşivde toplayın',
  'settings.output.target.inPlace': 'Yerinde',
  'settings.output.target.inPlaceTooltip': 'Her orijinal dosyanın yanına yazın',
  'settings.output.inPlace.title': 'Orijinaller değiştirilir',
  'settings.output.inPlace.body':
    'Her kaynak dosyanın üzerine dönüştürülmüş sürümü yazılır. Hiçbir şey geri dönüşüm kutusuna gitmez, bu yüzden önce yedek alın.',

  'settings.output.folder.label': 'Hedef klasör',
  'settings.output.folder.choose': 'Klasör seç',
  'settings.output.folder.change': 'Başka bir klasör seç',
  'settings.output.folder.empty': 'Henüz klasör seçilmedi.',
  'settings.output.archive.label': 'Arşiv dosyası',
  'settings.output.archive.choose': 'Arşiv seç',
  'settings.output.archive.change': 'Başka bir arşiv seç',
  'settings.output.archive.empty': 'Henüz arşiv yolu seçilmedi.',

  'settings.output.structure.label': 'Klasör yapısı',
  'settings.output.structure.flat': 'Düz',
  'settings.output.structure.flatDescription':
    'Hangi klasörden gelirse gelsin her şey hedefe iner.',
  'settings.output.structure.flatHint':
    'Her dosya doğrudan hedef klasöre iner. Aynı adlar aşağıdaki çakışma kuralına uyar.',
  'settings.output.structure.mirror': 'Kaynak ağacını yansıt',
  'settings.output.structure.mirrorDescription': 'Kaynakların klasör düzenini yeniden oluşturur.',
  'settings.output.structure.mirrorHint':
    'Kaynak klasör ağacı hedefin içinde yeniden oluşturulur, böylece göreli yollar çalışmayı sürdürür.',
  'settings.output.structure.byFormat': 'Biçim başına klasör',
  'settings.output.structure.byFormatDescription': 'Çıktıyı biçim başına bir alt klasöre gruplar.',
  'settings.output.structure.byFormatHint':
    'Çıktı, biçiminin adını taşıyan bir alt klasöre gruplanır.',
  'settings.output.structure.byDate': 'Tarih başına klasör',
  'settings.output.structure.byDateDescription':
    'Çıktıyı çalıştırma tarihi başına bir alt klasöre gruplar.',
  'settings.output.structure.byDateHint':
    'Çıktı, çalıştırmanın tarihini taşıyan bir alt klasöre gruplanır.',

  'settings.output.collision.label': 'Dosya zaten oradaysa',
  'settings.output.collision.rename': 'Yeniden adlandır',
  'settings.output.collision.renameHint':
    'Ada bir sayaç eklenir, böylece var olan dosyaya hiç dokunulmaz.',
  'settings.output.collision.overwrite': 'Üzerine yaz',
  'settings.output.collision.overwriteHint':
    'O yolda ne varsa değiştirilir. Geri alma yoktur ve hiçbir şey geri dönüşüm kutusuna gitmez.',
  'settings.output.collision.skip': 'Atla',
  'settings.output.collision.skipHint':
    'Var olan dosyaya dokunulmaz, görsel özette atlandı olarak bildirilir.',

  'settings.output.template.label': 'Dosya adı şablonu',
  'settings.output.template.help':
    'Bilinmeyen bir belirteç silinmez, adın içinde bırakılır; böylece yazım hatası önizlemede görünür.',
  'settings.output.template.placeholder': '{name}',
  'settings.output.template.example': 'Örnek',
  'settings.output.template.firstFile': 'İlk dosya',

  'settings.output.token.name': 'Uzantısı olmadan özgün dosya adı',
  'settings.output.token.ext': 'Çıktı dosyasının uzantısı',
  'settings.output.token.format': 'Çıktı biçimi kimliği, örneğin webp',
  'settings.output.token.index': 'Kuyruktaki sıra, başına sıfır eklenmiş',
  'settings.output.token.total': 'Çalıştırmadaki toplam dosya sayısı',
  'settings.output.token.width': 'Piksel cinsinden çıktı genişliği',
  'settings.output.token.height': 'Piksel cinsinden çıktı yüksekliği',
  'settings.output.token.quality': 'Bu dosya için kullanılan kalite değeri',
  'settings.output.token.preset': 'Etkin hazır ayarın adı',
  'settings.output.token.variant': 'Geçerli boyut varyantının soneki',
  'settings.output.token.parent': 'Kaynağın geldiği klasörün adı',
  'settings.output.token.date': 'Çalıştırma tarihi, yıl ay gün sırasıyla (YYYYMMDD)',
  'settings.output.token.time': 'Çalıştırma saati, saat dakika saniye sırasıyla (HHMMSS)',
  'settings.output.token.random': 'Rastgele altı karakter',

  'settings.output.case.label': 'Harf durumu',
  'settings.output.case.none': 'Yazıldığı gibi bırak',
  'settings.output.case.lower': 'küçük harf',
  'settings.output.case.upper': 'BÜYÜK HARF',
  'settings.output.case.kebab': 'kebab-case',
  'settings.output.case.snake': 'snake_case',

  'settings.output.sanitize.label': 'Dosya adlarını temizle',
  'settings.output.sanitize.hint':
    "Windows ve macOS'un kabul etmediği karakterleri, sondaki nokta ve boşlukları değiştirir.",
  'settings.output.skipIfLarger.label': 'Orijinal daha küçükse onu koru',
  'settings.output.skipIfLarger.hint':
    'Dönüştürülmüş dosya daha büyük olacaksa kaynak dosyayı korur.',

  'settings.output.zipLevel.label': 'Arşiv sıkıştırması',
  'settings.output.zipLevel.hint':
    'Kodlanmış görseller neredeyse hiç yeniden sıkışmaz, bu yüzden 0 onları olduğu gibi saklar.',
  'settings.output.zipLevel.store': 'Sakla',
  'settings.output.zipLevel.max': 'En üst',

  'settings.output.report.label': 'CSV raporu yaz',
  'settings.output.report.hint':
    'Görsel başına bir satırlık tablo kaydeder: yollar, boyutlar, kazanç, hatalar.',
  'settings.output.noFolderNote': 'Hedef klasör belirlenmeden bir çalıştırma başlayamaz.',

  /* ================================================================ */
  /* Variants section                                                  */
  /* ================================================================ */

  'settings.variants.intro':
    'Varyantlar, tek bir çözümlemeden ek boyutlar yazar: duyarlı bir srcset için 480, 960 ve 1440 ekleyin. Devral, ana ayarları izler.',
  'settings.variants.empty':
    'Henüz varyant yok. Çalıştırma, yukarıdaki ayarlarla kaynak başına tek dosya yazar.',
  'settings.variants.add': 'Varyant ekle',
  'settings.variants.remove': 'Bu varyantı kaldır',
  'settings.variants.removeNamed': '{label} varyantını kaldır',
  'settings.variants.defaultLabel': 'Varyant {index}',
  'settings.variants.enable.label': 'Çalıştırmaya dâhil et',
  'settings.variants.name.label': 'Ad',
  'settings.variants.name.hint': 'Kuyrukta ve çalıştırma raporunda görünür.',
  'settings.variants.name.placeholder': 'Küçük resim',
  'settings.variants.formatQuality.label': 'Biçim ve kalite',
  'settings.variants.format.inherit': 'Devral',
  'settings.variants.format.source': 'Kaynakla aynı',
  'settings.variants.format.aria': 'Varyant çıktı biçimi',
  'settings.variants.quality.aria': 'Varyant kalitesi',
  'settings.variants.size.label': 'Boyut',
  'settings.variants.strategy.none': 'Ana çıktıyla aynı boyut',
  'settings.variants.strategy.width': 'Sabit genişlik',
  'settings.variants.strategy.height': 'Sabit yükseklik',
  'settings.variants.strategy.longest': 'En uzun kenar',
  'settings.variants.strategy.percentage': 'Kaynağın yüzdesi',
  'settings.variants.strategy.aria': 'Varyant yeniden boyutlandırma yöntemi',
  'settings.variants.value.aria': 'Varyant hedef boyutu',
  'settings.variants.suffix.label': 'Dosya adı soneki',
  'settings.variants.suffix.hint': 'Uzantıdan önce ada eklenir.',
  'settings.variants.suffix.placeholder': '-960w',
  'settings.variants.problem.empty':
    'Boş bir sonek ana çıktının dosya adıyla aynı olur, biri diğerinin üzerine yazar.',
  'settings.variants.problem.duplicate':
    'Bu soneki başka bir varyant kullanıyor. İkisi de aynı dosya adını yazar, sonuncusu kazanır.',

  /* ================================================================ */
  /* Smart section                                                     */
  /* ================================================================ */

  'settings.smart.sizeTarget.label': 'Boyut hedefi',
  'settings.smart.sizeTarget.off': 'Kapalı',
  'settings.smart.sizeTarget.offTooltip': 'Seçilen kalitede bir kez kodla',
  'settings.smart.sizeTarget.offHint':
    'Her görsel, boyutu ne çıkarsa çıksın seçtiğiniz kalitede bir kez kodlanır.',
  'settings.smart.sizeTarget.max': 'Altında kal',
  'settings.smart.sizeTarget.maxTooltip': 'Bütçeyi kesin bir tavan say',
  'settings.smart.sizeTarget.maxHint':
    'Çıktı bütçeyi asla aşmaz; kalite, aralığın alt sınırına dek düşer.',
  'settings.smart.sizeTarget.aim': 'Yaklaş',
  'settings.smart.sizeTarget.aimTooltip': 'Bütçeye olabildiğince yaklaş',
  'settings.smart.sizeTarget.aimHint': 'Çıktı, iki yönden de bütçeye olabildiğince yaklaşır.',

  'settings.smart.budget.label': 'Görsel başına bütçe',
  'settings.smart.budget.hint': 'Çalıştırmadaki her dosya için {size}.',
  'settings.smart.budget.aria': 'Kilobayt cinsinden görsel başına boyut bütçesi',
  'settings.smart.quality.label': 'Kalite aralığı',
  'settings.smart.quality.hint': 'Arama yalnızca bu penceredeki kaliteleri dener.',
  'settings.smart.searchNote':
    'Her görsel, sonuç bütçeye sığana dek kalite penceresi her turda yarıya inerek birkaç kez kodlanır.',
  'settings.smart.slow.title': 'Bu, bir çalıştırmayı kat kat yavaşlatır',
  'settings.smart.slow.body':
    'Görsel başına bir yerine dört ila yedi kodlama bekleyin. Büyük bir AVIF grubu bir saate yakın sürebilir.',
  'settings.smart.autoFormat.label': 'Biçimi görsel başına seç',
  'settings.smart.autoFormat.hint':
    'Düz çizim ve ekran görüntülerini PNG, fotoğrafları sizin biçiminizde yazar.',
  'settings.smart.autoPalette.label': 'Bedavaysa palete düş',
  'settings.smart.autoPalette.hint': 'Görselin renk sayısı yeterince azsa indeksli renge geçer.',

  /* ================================================================ */
  /* Performance section                                               */
  /* ================================================================ */

  'settings.performance.backend.label': 'İşleme arka ucu',
  'settings.performance.backend.auto': 'Otomatik',
  'settings.performance.backend.autoTooltip': 'Makinenin sunduğu her hattı kullan',
  'settings.performance.backend.autoHint':
    'Her görsel boşta olan hattı alır: GPU ya da sharp çalışan havuzu.',
  'settings.performance.backend.gpuTooltip': 'Uygulanabildiği her yerde GPU hatlarını tercih et',
  'settings.performance.backend.gpuHint':
    "GPU hatlarını tercih eder, bağdaştırıcı yetişemediğinde sharp'a düşer.",
  'settings.performance.backend.gpuMissing': 'Kullanılabilir bir GPU bağdaştırıcısı bulunamadı',
  'settings.performance.backend.cpuTooltip': 'Her şeyi sharp çalışanlarından geçir',
  'settings.performance.backend.cpuHint':
    "GPU'yu yok sayar ve grubu sharp çalışan havuzundan geçirir.",

  'settings.performance.probePending': 'Bağdaştırıcı ayrıntıları GPU yoklaması bitince görünür.',
  'settings.performance.gpuUnavailable.title': 'GPU hızlandırma kullanılamıyor',
  'settings.performance.gpuUnavailable.body':
    "Yetenek yoklamasına hiçbir bağdaştırıcı yanıt vermedi, bu yüzden her görsel CPU'da işlenir.",

  'settings.performance.adapters.label': 'Bağdaştırıcılar',
  'settings.performance.adapter.unnamed': 'Adsız bağdaştırıcı',
  'settings.performance.adapter.active': 'Etkin',
  'settings.performance.adapter.discrete': 'Ayrık',
  'settings.performance.adapter.integrated': 'Tümleşik',
  'settings.performance.adapter.software': 'Yazılım',
  'settings.performance.adapter.maxTexture': 'En büyük doku {value} px',

  'settings.performance.preferDiscrete.label': 'Ayrık bağdaştırıcıyı tercih et',
  'settings.performance.preferDiscrete.hint': 'İşi tümleşik yerine ayrık ekran kartına gönderir.',
  'settings.performance.useAllGpus.label': 'Tüm bağdaştırıcıları aynı anda kullan',
  'settings.performance.useAllGpus.hint':
    'Yalnızca tercih edilen için değil, her bağdaştırıcı için bir hat açar.',
  'settings.performance.gpuAssist.label': 'GPU destekli kodlama',
  'settings.performance.gpuAssist.hint':
    "GPU yeniden boyutlandırır ve filtreler; AVIF, TIFF ve JPEG XL'i sharp yazar.",

  'settings.performance.workers.label': 'Çalışan iş parçacıkları',
  'settings.performance.workers.hint':
    "Aynı anda kodlanan görsel sayısı. 0, {cores} mantıksal çekirdeğe bakarak seçimi BICO'ya bırakır.",
  'settings.performance.workers.hintUnknown':
    "Aynı anda kodlanan görsel sayısı. 0, çekirdek sayısına bakarak seçimi BICO'ya bırakır.",
  'settings.performance.workers.auto': 'Otomatik',
  'settings.performance.vips.label': 'Her çalışandaki iş parçacıkları',
  'settings.performance.vips.hint':
    "libvips'in tek bir görselde kullandığı iş parçacığı. 0 kararı libvips'e bırakır.",
  'settings.performance.cache.label': 'İşlem önbelleği',
  'settings.performance.cache.hint': "libvips'in ara sonuçlar için tutabileceği bellek.",
  'settings.performance.maxPixels.label': 'Piksel sınırı',
  'settings.performance.maxPixels.hint':
    'Bundan fazla piksele çözülen görseller yüklenmez, reddedilir.',
  'settings.performance.maxPixels.aria': 'Megapiksel cinsinden en büyük çözülmüş boyut',
  'settings.performance.megapixels': 'MP',

  /* ================================================================ */
  /* About                                                             */
  /* ================================================================ */

  'about.title': 'BICO hakkında',
  'about.tab.about': 'Hakkında',
  'about.tab.formats': 'Biçimler',
  'about.tab.credits': 'Emeği geçenler',

  'about.hero.logoAlt': 'BICO uygulama simgesi',
  'about.build.version': 'Sürüm {version}',
  'about.build.platform': '{platform} {arch}',
  'about.build.built': 'Yapım {date}',
  'about.build.reading': 'Yapı bilgileri okunuyor',
  'about.platform.windows': 'Windows',
  'about.platform.macos': 'macOS',
  'about.platform.linux': 'Linux',

  'about.intro':
    'BICO, görselleri makinenizde toplu olarak dönüştürür ve optimize eder. Hiçbir şey karşıya yüklenmez, siz istemedikçe orijinallere dokunulmaz.',

  'about.section.highlights': 'Bu sürümde yenilikler',
  'about.highlight.pipeline':
    'Binlerce dosya kodlanırken pencereyi yanıt verir tutan çok iş parçacıklı sharp işlem hattı.',
  'about.highlight.gpu':
    'Çözme, yeniden boyutlandırma ve kodlamayı tüm bağdaştırıcılara yayan isteğe bağlı GPU işleme.',
  'about.highlight.formats': 'Birlikte gelen JPEG XL codec dâhil sekiz çıktı biçimi.',
  'about.highlight.preview':
    'Gerçek hedef biçimde canlı önce ve sonra önizlemesi, böylece gerçek bozulmaları görürsünüz.',
  'about.highlight.sizeTarget':
    'Her dosya bayt bütçesine sığana dek kalite aralığını tarayan boyut hedefleme.',
  'about.highlight.variants':
    'Tek bir çözümlemeden eksiksiz bir srcset üreten duyarlı varyant oluşturma.',
  'about.highlight.watch':
    'Yeni görselleri diske düşer düşmez dönüştüren izlenen klasör otomasyonu.',

  'about.section.links': 'Bağlantılar',
  'about.link.repository': 'Depo',
  'about.link.issues': 'Sorun bildir',
  'about.link.author': 'Yazar profili',
  'about.link.sponsor': 'Bana bir kahve ısmarla',
  'about.licence':
    'MIT lisansı altında yayımlanmıştır. Muhammad Sheharyar Butt tarafından yazılır ve sürdürülür.',

  'about.formats.allAvailable': 'Aşağıdaki her biçim bu yapıda kullanılabilir',
  'about.formats.missingOne': 'Bir biçim bu yapı tarafından yazılamıyor',
  'about.formats.missingMany': '{count} biçim bu yapı tarafından yazılamıyor',
  'about.formats.note':
    'Kullanılabilirlik, bu yapının başlangıçta neyi çözdüğünü gösterir; kullanılamayan biçimler soluklaşır. JPEG XL, WebAssembly libjxl olarak birlikte gelir.',
  'about.formats.column.format': 'Biçim',
  'about.formats.column.bestFor': 'En uygun',
  'about.formats.column.capabilities': 'Yetenekler',
  'about.formats.column.availability': 'Bu yapı',

  'about.capability.quality': 'Kalite',
  'about.capability.lossless': 'Kayıpsız',
  'about.capability.alpha': 'Alfa',
  'about.capability.animation': 'Animasyon',
  'about.capability.progressive': 'Aşamalı',
  'about.capability.chroma': 'Kroma',
  'about.capability.hdr': 'HDR',
  'about.capability.metadata': 'Meta veri',
  'about.capability.effort': 'Çaba {min} - {max}',
  'about.capability.gpuEncode': 'GPU ile kodlama',

  'about.availability.notReported': 'Bildirilmedi',
  'about.availability.reads': 'Okur',
  'about.availability.noDecoder': 'Kod çözücü yok',
  'about.availability.writes': 'Yazar',
  'about.availability.noEncoder': 'Kodlayıcı yok',

  'about.credits.intro': "BICO'nun bağımlı olduğu projeler, şu anda çalışan sürümleriyle.",
  'about.credits.visit': 'Ziyaret et',
  'about.credits.versionUnknown': 'Sürüm bildirilmedi',
  'about.credits.footer':
    'Ant Design simgeleri, Inter ve Electron builder araç zinciri listeyi tamamlar. Hepsi BICO gibi izin verici lisanslarla dağıtılır.',
  'about.credits.libvips':
    'Her dönüştürmenin gerçekte üzerinden geçtiği akış tabanlı görüntü işleme kitaplığı.',
  'about.credits.sharp': "libvips'i çalışan iş parçacıklarının içinden süren Node bağlayıcısı.",
  'about.credits.electron':
    "BICO'nun yerel penceresi ve dosya sistemi erişiminin ardındaki masaüstü çalışma ortamı.",
  'about.credits.chromium': 'Arayüzü çizen ve GPU hatlarını barındıran motor.',
  'about.credits.react': 'Arayüzün tamamının yazıldığı bileşen modeli.',
  'about.credits.antd': 'Arayüzün temalandırıldığı bileşen kitaplığı ve tasarım belirteçleri.',
  'about.credits.webgpu':
    'GPU hatlarının çözme, yeniden boyutlandırma ve kodlama işi için kullandığı hesaplama katmanı.',
  'about.credits.plex':
    'Arapça dâhil arayüzün tamamında kullanılan yazı tipi, SIL Açık Yazı Tipi Lisansı ile.',
  'about.credits.gpuNone': 'Bu makinede bağdaştırıcı algılanmadı',
  'about.credits.gpuOne': 'Bir bağdaştırıcı algılandı',
  'about.credits.gpuMany': '{count} bağdaştırıcı algılandı',

  /* ================================================================ */
  /* History                                                           */
  /* ================================================================ */

  'history.title': 'Çalıştırma geçmişi',
  'history.action.refresh': 'Yenile',
  'history.action.seeFailures': 'Nelerin başarısız olduğunu gör',
  'history.clear.confirmTitle': 'Çalıştırma geçmişi temizlensin mi?',
  'history.clear.confirmBody': 'Özetler kaldırılır. Dönüştürülmüş dosyalara dokunulmaz.',
  'history.clear.confirmOk': 'Temizle',
  'history.clear.confirmCancel': 'Kalsın',
  'history.toast.cleared': 'Çalıştırma geçmişi temizlendi.',
  'history.toast.clearFailed': 'Geçmiş dosyası temizlenemedi.',
  'history.toast.noLocation': 'Bu çalıştırma bir çıktı konumu kaydetmedi.',

  'history.empty':
    'Henüz kaydedilmiş çalıştırma yok. Biten dönüştürmeler; kazanç, çıktı klasörü ve süresiyle burada kaydedilir.',

  'history.summary.runs': 'Kaydedilen çalıştırma',
  'history.summary.images': 'Dönüştürülen görsel',
  'history.summary.saved': 'Toplam kazanç',

  'history.finishTimeUnknown': 'Bitiş saati kaydedilmedi',
  'history.formatOriginal': 'Kaynakla aynı',
  'history.preset': 'Hazır ayar {name}',
  'history.presetCustom': 'özel',

  'history.tag.processed': '{count} işlendi',
  'history.tag.failed': '{count} başarısız',
  'history.tag.skipped': '{count} atlandı',
  'history.tag.stoppedEarly': 'Erken durduruldu',
  'history.tag.onGpu': "{count} GPU'da",
  'history.tag.onCpu': "{count} CPU'da",

  'history.field.saved': 'Kazanç',
  'history.field.size': 'Boyut',
  'history.field.location': 'Konum',
  'history.savedPercent': '(%{percent})',
  'history.sizeChange': '{before} boyutundan {after} boyutuna',
  'history.notRecorded': 'Kaydedilmedi',

  'history.open.folder': 'Çıktı klasörünü aç',
  'history.open.zip': 'Arşivi aç',
  'history.open.inPlace': 'Kaynak klasörünü aç',
  'history.open.report': 'CSV raporunu aç',

  'history.errors.titleOne': 'Bir dosya başarısız oldu',
  'history.errors.titleMany': '{count} dosya başarısız oldu',

  /* ================================================================ */
  /* Preview                                                           */
  /* ================================================================ */

  'preview.title': 'Canlı önizleme',
  'preview.empty': 'Nasıl dönüştürüleceğini önizlemek için kuyruktan bir görsel seçin.',
  'preview.dimensions': '{width} x {height} piksel',
  'preview.dimensionsPending': 'Boyutlar hâlâ okunuyor',
  'preview.tag.alpha': 'Saydamlık içeriyor',
  'preview.tag.animated': 'Animasyonlu',

  'preview.error.title': 'Bu görsel önizlenemedi',
  'preview.formatOriginal': 'Kaynakla aynı',

  'preview.fallback.title': '{requested} değil, {shown} olarak gösteriliyor',
  'preview.fallback.body':
    '{reason} Aşağıdaki pikseller doğrudur, ancak boyutlar gerçek biçimden değil, yedek kapsayıcıdan gelir.',

  'preview.field.originalSize': 'Orijinal boyut',
  'preview.field.estimatedOutput': 'Tahmini çıktı',
  'preview.field.change': 'Değişim',
  'preview.field.outputFormat': 'Çıktı biçimi',
  'preview.field.render': 'Önizleme işlemesi',

  'preview.change.smaller': '%{percent} daha küçük',
  'preview.change.larger': '%{percent} daha büyük',
  'preview.renderDetail': '{duration} içinde {width} x {height}',

  'preview.estimateNote':
    'Önizleme düşük çözünürlükte işlenir ve boyutu buradan tahmin eder; kesin bir bayt sayısı değil, yol gösterici sayın.',
  'preview.rerendering': 'Az önce değiştirdiğiniz ayarlarla yeniden işleniyor.',

  /* ================================================================ */
  /* Watch folder                                                      */
  /* ================================================================ */

  'watch.title': 'Klasör izleme',
  'watch.formatOriginal': 'kaynak biçimi',
  'watch.intro.title': 'İzlenen klasöre bırakılan dosyalar otomatik dönüştürülür.',
  'watch.intro.body':
    "Ayarlar Başlat'a bastığınızda alınır ve sabit kalır; kenar çubuğunu değiştirseniz de sonraki dosyalar {format} olarak yazılır.",

  'watch.action.choose': 'Seç',
  'watch.action.start': 'İzlemeyi başlat',
  'watch.action.stop': 'Durdur',

  'watch.folder.label': 'İzlenecek klasör',
  'watch.folder.hint': 'Buraya gelen yeni görseller kuyruğa alınır ve teker teker dönüştürülür.',
  'watch.folder.placeholder': 'Henüz klasör seçilmedi',

  'watch.recursive.label': 'Alt klasörleri dâhil et',
  'watch.recursive.hint': 'Yukarıdakinin altındaki her klasörü de izler.',

  'watch.settle.label': 'Sabitlenme süresi',
  'watch.settle.hint':
    'Bir dosyanın bitmiş sayılması için boyutunun ne kadar süre değişmeden kalması gerektiği.',

  'watch.move.label': 'Orijinalleri şuraya taşı',
  'watch.move.hint': 'Dönüştürülmüş kopyası oluşunca her kaynak dosya buraya taşınır.',
  'watch.move.placeholder': 'Orijinalleri oldukları yerde bırak',

  'watch.delete.label': 'Dönüştürdükten sonra orijinalleri sil',
  'watch.delete.hint': 'Kopyası yazılınca her kaynak dosyayı kalıcı olarak siler.',
  'watch.delete.hintMoving': 'Orijinaller başka bir klasöre taşınırken kullanılamaz.',
  'watch.delete.confirmTitle': 'Her orijinal, dönüştürüldükten sonra silinsin mi?',
  'watch.delete.confirmBody':
    'Dönüştürülmüş kopyası yazılınca her kaynak dosya silinir. Geri alma yoktur ve hiçbir şey geri dönüşüm kutusuna gitmez.',
  'watch.delete.confirmOk': 'Orijinalleri sil',
  'watch.delete.confirmCancel': 'Orijinalleri koru',
  'watch.delete.warningTitle': 'Orijinal dosyalar silinecek',
  'watch.delete.warningBody':
    'Bu izleyicinin dönüştürdüğü her görsel sonrasında izlenen klasörden silinir.',

  'watch.toast.needFolder': 'Önce izlenecek bir klasör seçin.',
  'watch.toast.needOutput': 'İzlemeden önce kenar çubuğundan bir çıktı klasörü seçin.',
  'watch.toast.started': 'İzleme başladı.',
  'watch.toast.stopped': 'İzleme durduruldu.',

  'watch.status.title': 'Durum',
  'watch.status.state': 'Durum',
  'watch.status.running': 'İzleniyor',
  'watch.status.idle': 'Boşta',
  'watch.status.folder': 'Klasör',
  'watch.status.noFolder': 'Seçilmedi',
  'watch.status.seen': 'Görülen dosya',
  'watch.status.processed': 'Dönüştürülen dosya',
  'watch.status.lastEvent': 'Son olay',
  'watch.status.noEvent': 'Henüz bir şey olmadı',
  'watch.status.errorTitle': 'İzleyici bir sorun bildirdi',
  'watch.status.locked':
    'İzleme sürerken ayarlar kilitlidir. Değiştirmeniz gerekirse önce durdurun.',

  /* ================================================================ */
  /* Lifetime statistics                                               */
  /* ================================================================ */

  'stats.title': 'Toplam istatistikler',
  'stats.since': '{date} tarihinden bu yana bu bilgisayarda sayılıyor.',
  'stats.sinceUnknown': 'Bu bilgisayarda bitirdiğiniz tüm çalıştırmalar boyunca sayılıyor.',

  'stats.action.refresh': 'Yenile',
  'stats.action.reset': 'Sıfırla',

  'stats.reset.title': 'Tüm toplam sayaçlar silinsin mi?',
  'stats.reset.description':
    'Toplamları, doksan günlük grafiği ve en iyi çalıştırmayı kalıcı olarak siler. Bu geri alınamaz. Görselleriniz ve çalıştırma geçmişiniz etkilenmez.',
  'stats.reset.ok': 'Sil',
  'stats.reset.cancel': 'Kalsın',
  'stats.reset.done': 'Tüm toplam sayaçlar sıfıra döndü.',
  'stats.reset.failed': 'Sayaçlar sıfırlanamadı.',
  'stats.load.failed': 'İstatistikler diskten okunamadı.',

  'stats.empty.title': 'Henüz sayılmış bir şey yok',
  'stats.empty.description':
    'Toplamlar ilk çalıştırmanız biter bitmez görünür: yazılan görseller, kazanılan baytlar, harcanan süre ve kullanılan motor.',

  'stats.headline.images': 'Dönüştürülen görsel',
  'stats.headline.imagesOne': 'Dönüştürülen görsel',
  'stats.headline.saved': 'Kazanılan yer',
  'stats.headline.added': 'Eklenen yer',
  'stats.headline.time': 'Dönüştürme süresi',
  'stats.headline.runs': 'Biten çalıştırma',
  'stats.headline.runsOne': 'Biten çalıştırma',

  'stats.activity.title': 'Etkinlik',
  'stats.activity.hint': 'Son doksan günün her birinde tamamlanan görseller.',
  'stats.activity.chart':
    'Son doksan günde günlük dönüştürülen görseller. En yoğun gün {images} görselle {date}, pencerede toplam {total}.',
  'stats.activity.chartQuiet':
    'Son doksan günde günlük dönüştürülen görseller. Hiçbir şey dönüştürülmedi.',
  'stats.activity.peak': 'En yoğun gün {date}, {images} görsel',
  'stats.activity.peakOne': 'En yoğun gün {date}, bir görsel',
  'stats.activity.quiet': 'Son doksan günde hiçbir şey dönüştürülmedi',
  'stats.activity.windowTotal': 'bu pencerede {images}',

  'stats.formats.title': 'Çıktı biçimleri',
  'stats.formats.hint':
    'Biçim başına yazılan görseller ve her birinin orijinallere karşı kazandırdığı.',
  'stats.formats.original': 'Kaynakla aynı',
  'stats.formats.images': '{images} görsel',
  'stats.formats.imagesOne': '1 görsel',
  'stats.formats.saved': '{bytes} kazanç',
  'stats.formats.added': '{bytes} artış',
  'stats.formats.bar': '{format}, {images} görsel yazıldı, {saved}.',
  'stats.formats.empty': 'Henüz hiçbir çıktı biçimi yazılmadı.',

  'stats.backend.title': "GPU'ya karşı CPU",
  'stats.backend.hint': 'Her dosyada işi hangi motorun yaptığı.',
  'stats.backend.chart': "{gpu} görsel GPU'da, {cpu} görsel CPU'da tamamlandı; GPU payı {share}.",
  'stats.backend.centre': "GPU'da",
  'stats.backend.empty': 'Henüz hiçbir görsel bir motora atfedilmedi.',
  'stats.backend.images': '{images} görsel',

  'stats.best.title': 'En iyi çalıştırma',
  'stats.best.saved': '{bytes} kazanç',
  'stats.best.detail': '{date} tarihinde {format} olarak yazılan {images} görsel',
  'stats.best.detailOne': '{date} tarihinde {format} olarak yazılan bir görsel',
  'stats.best.percent': '%{percent} daha küçük',
  'stats.best.none':
    'Henüz hiçbir çalıştırma kazanç sağlamadı, bu yüzden gösterilecek en iyi çalıştırma yok.',

  'stats.derived.title': 'Türetilen değerler',
  'stats.derived.hint': 'Saklanmak yerine yukarıdaki toplamlardan hesaplanır.',
  'stats.derived.averageSaving': 'Ortalama kazanç',
  'stats.derived.imagesPerRun': 'Çalıştırma başına görsel',
  'stats.derived.msPerImage': 'Görsel başına süre',
  'stats.derived.gpuShare': 'GPU payı',
  'stats.derived.activeDays': 'Etkin gün',
  'stats.derived.activeDaysValue': '{days} gün',
  'stats.derived.activeDaysValueOne': '1 gün',
  'stats.derived.volume': 'İşlenen bayt',
  'stats.derived.volumeValue': '{read} okundu, {written} yazıldı',
  'stats.derived.failed': 'Başarısız görseller',
  'stats.derived.skipped': 'Atlanan görseller',

  /* ================================================================ */
  /* Appearance                                                        */
  /* ================================================================ */

  'appearance.section.title': 'Görünüm',
  'appearance.section.hint': 'Mod açık ya da koyuyu belirler. Aşağıdaki kartlar paleti seçer.',

  'appearance.mode.label': 'Açık ya da koyu',
  'appearance.mode.hint': 'Sistem, işletim sistemini izler ve onunla birlikte değişir.',
  'appearance.mode.dark': 'Koyu',
  'appearance.mode.light': 'Açık',
  'appearance.mode.system': 'Sistem',

  'appearance.themes.title': 'Tema',
  'appearance.themes.hint':
    'Her kart bir temayı önizler. Seçtiğinizde açık ya da koyu da ona uyar.',
  'appearance.themes.group.dark': 'Koyu temalar',
  'appearance.themes.group.light': 'Açık temalar',
  'appearance.themes.inUse': 'Kullanımda',
  'appearance.themes.choose': '{name} temasını kullan',
  'appearance.themes.previewNote':
    'Önizlemeler her temanın kendi vurgusunu kullanır. Kendi vurgu renginizi belirlediğinizde onun yerini alır.',

  'appearance.accent.label': 'Vurgu rengi',
  'appearance.accent.hint':
    'Düğmeleri, ilerleme çubuklarını, bağlantıları ve seçim vurgusunu yeniden renklendirir.',
  'appearance.accent.reset': 'Tema vurgusu',
  'appearance.accent.resetHint': '{name} temasının çevresinde tasarlandığı vurgu rengine döner.',

  'appearance.language.title': 'Dil',
  'appearance.language.select': 'Arayüz dili',
  'appearance.language.hint':
    'Tüm metni değiştirir; tarih, sayı ve dosya boyutlarını da o dile göre biçimlendirir.',
  'appearance.language.rtl': 'Arapça ayrıca tüm düzeni sağdan sola çevirir.',

  'appearance.theme.midnight.name': 'Gece Yarısı',
  'appearance.theme.midnight.description': 'Serin tonlu koyu lacivert. Varsayılan.',
  'appearance.theme.graphite.name': 'Grafit',
  'appearance.theme.graphite.description':
    'Renk yanlılığı olmayan nötr gri, renk işlerini değerlendirmek için.',
  'appearance.theme.nord.name': 'Nord',
  'appearance.theme.nord.description': 'Kısık kutup mavileri, uzun oturumlarda göze rahat gelir.',
  'appearance.theme.dracula.name': 'Dracula',
  'appearance.theme.dracula.description': 'Yüksek doygunlukta mor, yüzeylere karşı güçlü kontrast.',
  'appearance.theme.forest.name': 'Orman',
  'appearance.theme.forest.description': 'Sıcak koyu yeşil, lacivert temalardan daha az mavi ışık.',
  'appearance.theme.daylight.name': 'Gün Işığı',
  'appearance.theme.daylight.description': 'Serin grilerle temiz beyaz. Varsayılan açık tema.',
  'appearance.theme.paper.name': 'Kâğıt',
  'appearance.theme.paper.description': 'Sıcak kırık beyaz, ekrandan çok baskı kâğıdına yakın.',
  'appearance.theme.contrast.name': 'Yüksek kontrast',
  'appearance.theme.contrast.description':
    'Erişilebilirlik için metinle arka plan arasında en yüksek ayrım.',

  /* ================================================================ */
  /* Diagnostics                                                       */
  /* ================================================================ */

  'diagnostics.title': 'Tanılama',
  'diagnostics.tab.environment': 'Ortam',
  'diagnostics.tab.graphics': 'Grafik',
  'diagnostics.tab.log': 'Günlük',
  'diagnostics.tab.preferences': 'Tercihler',

  'diagnostics.env.copy': 'Hata bildirimi için raporu kopyala',
  'diagnostics.env.copied': 'Tanılama raporu panoya kopyalandı.',
  'diagnostics.env.copyFailed': 'Panoya yazılamadı.',
  'diagnostics.env.empty': 'Sistem bilgileri ana süreçten henüz gelmedi.',

  'diagnostics.env.app': 'Uygulama',
  'diagnostics.env.app.name': 'Ad',
  'diagnostics.env.app.version': 'Sürüm',
  'diagnostics.env.app.buildDate': 'Yapı tarihi',
  'diagnostics.env.app.packaged': 'Paketlenmiş',
  'diagnostics.env.app.packagedYes': 'Evet',
  'diagnostics.env.app.packagedNo': 'Hayır, kaynaktan çalışıyor',
  'diagnostics.env.app.locale': 'Sistem yerel ayarı',

  'diagnostics.env.runtime': 'Çalışma ortamı',
  'diagnostics.env.runtime.electron': 'Electron',
  'diagnostics.env.runtime.chromium': 'Chromium',
  'diagnostics.env.runtime.node': 'Node',
  'diagnostics.env.runtime.v8': 'V8',
  'diagnostics.env.runtime.abi': 'Yerel modül ABI',

  'diagnostics.env.os': 'İşletim sistemi',
  'diagnostics.env.os.platform': 'Platform',
  'diagnostics.env.os.arch': 'Mimari',
  'diagnostics.env.os.release': 'Yayım',
  'diagnostics.env.os.version': 'Sürüm',
  'diagnostics.env.os.processor': 'İşlemci',
  'diagnostics.env.os.cores': 'Mantıksal çekirdek',
  'diagnostics.env.os.memory': 'Bellek',
  'diagnostics.env.os.memoryValue': 'toplam {total} MB, boş {free} MB',

  'diagnostics.env.imaging': 'Görüntüleme',
  'diagnostics.env.imaging.sharp': 'sharp',
  'diagnostics.env.imaging.libvips': 'libvips',
  'diagnostics.env.imaging.simd': 'SIMD',
  'diagnostics.env.imaging.simdOn': 'Etkin',
  'diagnostics.env.imaging.simdOff': 'Kullanılamıyor',
  'diagnostics.env.imaging.threads': 'libvips iş parçacıkları',
  'diagnostics.env.imaging.codecs': "Codec'ler",
  'diagnostics.env.imaging.codecsHint':
    'Yeşil okur ve yazar, düz yalnızca okur, kehribar bu yapıda yok.',

  'diagnostics.env.paths': 'Yollar',
  'diagnostics.env.paths.userData': 'Kullanıcı verileri',
  'diagnostics.env.paths.logs': 'Günlükler',
  'diagnostics.env.paths.temp': 'Geçici dosyalar',
  'diagnostics.env.paths.presets': 'Hazır ayarlar',
  'diagnostics.env.paths.open': 'Bu klasörü dosya yöneticisinde aç',

  'diagnostics.graphics.intro':
    'WebGPU bağdaştırıcıları, GPU hatlarının dönüştürüp dönüştürmeyeceğine karar verir. Chromium donanım hızlandırma yalnızca bu pencerenin nasıl çizildiğini anlatır.',
  'diagnostics.graphics.adapters': 'WebGPU bağdaştırıcıları',
  'diagnostics.graphics.column.adapter': 'Bağdaştırıcı',
  'diagnostics.graphics.column.type': 'Tür',
  'diagnostics.graphics.column.limits': 'Sınırlar',
  'diagnostics.graphics.column.lane': 'Hat',
  'diagnostics.graphics.vendorUnknown': 'Üretici bildirilmedi',
  'diagnostics.graphics.limitsValue': '{pixels} px, {megabytes} MB',
  'diagnostics.graphics.kind.discrete': 'Ayrık',
  'diagnostics.graphics.kind.integrated': 'Tümleşik',
  'diagnostics.graphics.kind.cpu': 'Yazılım',
  'diagnostics.graphics.kind.unknown': 'Bildirilmedi',
  'diagnostics.graphics.fallbackAdapter': 'Yedek',
  'diagnostics.graphics.laneWorking': 'Çalışıyor',
  'diagnostics.graphics.laneIdle': 'Boşta',
  'diagnostics.graphics.noAdapters':
    'Hiçbir WebGPU bağdaştırıcısı çözülemedi, bu yüzden her görsel CPU hattında çalışır.',
  'diagnostics.graphics.webgpuOn': 'WebGPU kullanılabilir',
  'diagnostics.graphics.webgpuOff': 'WebGPU kullanılamıyor',
  'diagnostics.graphics.lanesOn': 'GPU hatları etkin',
  'diagnostics.graphics.lanesOff': 'GPU hatları kapalı',
  'diagnostics.graphics.processedOne': "GPU'da 1 görsel",
  'diagnostics.graphics.processedMany': "GPU'da {count} görsel",
  'diagnostics.graphics.fellBackOne': "1 görsel CPU'ya düştü",
  'diagnostics.graphics.fellBackMany': "{count} görsel CPU'ya düştü",
  'diagnostics.graphics.chromium': 'Chromium grafik raporu',
  'diagnostics.graphics.chromium.vendor': 'Üretici',
  'diagnostics.graphics.chromium.device': 'Aygıt',
  'diagnostics.graphics.chromium.driver': 'Sürücü',
  'diagnostics.graphics.chromium.description': 'Açıklama',
  'diagnostics.graphics.chromium.notReported': 'Bildirilmedi',
  'diagnostics.graphics.chromium.raw': 'Ham Chromium raporu',
  'diagnostics.graphics.chromium.pending': 'Chromium grafik raporunu henüz döndürmedi.',

  'diagnostics.log.filter.all': 'Tümü',
  'diagnostics.log.filter.info': 'Bilgi',
  'diagnostics.log.filter.warn': 'Uyarılar',
  'diagnostics.log.filter.error': 'Hatalar',
  'diagnostics.log.level.debug': 'hata ayıklama',
  'diagnostics.log.level.info': 'bilgi',
  'diagnostics.log.level.warn': 'uyarı',
  'diagnostics.log.level.error': 'hata',
  'diagnostics.log.openFile': 'Günlük dosyasını aç',
  'diagnostics.log.empty': 'Bu düzeyde henüz bir kayıt yok.',
  'diagnostics.log.follow':
    'Akış, siz yukarı kaydırana dek yeni satırları izler, sonra olduğu yerde durur.',

  'diagnostics.prefs.interface': 'Arayüz',
  'diagnostics.prefs.behaviour': 'Davranış',
  'diagnostics.prefs.compact': 'Sıkışık düzen',
  'diagnostics.prefs.compactHint':
    'Ekrana kuyruğun daha fazlasını sığdırmak için iç boşlukları ve yazı boyutunu daraltır.',
  'diagnostics.prefs.queueView': 'Kuyruk düzeni',
  'diagnostics.prefs.queueViewHint':
    'Tablo dosya başına daha çok ayrıntı, ızgara daha çok küçük resim gösterir.',
  'diagnostics.prefs.queueView.table': 'Tablo',
  'diagnostics.prefs.queueView.grid': 'Izgara',
  'diagnostics.prefs.confirm': 'Çalıştırmadan önce onay iste',
  'diagnostics.prefs.confirmHint':
    'Çalıştırma başlamadan neyin yazılacağını gösterir, yerinde çıktı dâhil.',
  'diagnostics.prefs.notify': 'Bitince bildir',
  'diagnostics.prefs.notifyHint': 'Bir çalıştırma bittiğinde masaüstü bildirimi gönderir.',
  'diagnostics.prefs.openOutput': 'Bitince çıktıyı aç',
  'diagnostics.prefs.openOutputHint': 'Son dosya yazılınca hedef klasörü açar.',
  'diagnostics.prefs.taskbar': 'İlerlemeyi görev çubuğunda göster',
  'diagnostics.prefs.taskbarHint':
    'Çalıştırma ilerlemesini görev çubuğu ya da dock simgesine yansıtır.',
  'diagnostics.prefs.tray': 'Sistem tepsisinde çalışmayı sürdür',
  'diagnostics.prefs.trayHint':
    'Kapatmak uygulamadan çıkmaz, pencereyi gizler. Çıkmak için tepsi menüsünü kullanın.',

  'diagnostics.updates.title': 'Güncellemeler',
  'diagnostics.updates.auto': 'Otomatik denetle',
  'diagnostics.updates.autoHint':
    'Açılıştan sonra daha yeni bir sürüm arar. Siz istemeden hiçbir şey indirilmez.',
  'diagnostics.updates.check': 'Güncellemeleri denetle',
  'diagnostics.updates.download': '{version} sürümünü indir',
  'diagnostics.updates.openPage': '{version} sürümünü GitHub üzerinden al',
  'diagnostics.updates.manualHint':
    "{version} sürümü yayımlandı. macOS'ta kurulum elle yapılır, bu yüzden sayfa açılır.",
  'diagnostics.updates.install': 'Yeniden başlat ve kur',
  'diagnostics.updates.notes': '{version} sürüm notları',
  'diagnostics.updates.state.idle': 'Bu oturumda henüz denetim yapılmadı.',
  'diagnostics.updates.state.checking': 'Sürüm akışına bağlanılıyor.',
  'diagnostics.updates.state.available': 'İndirilmeye hazır daha yeni bir sürüm var.',
  'diagnostics.updates.state.notAvailable': 'Bu, yayımlanmış en son sürüm.',
  'diagnostics.updates.state.downloading': 'Güncelleme arka planda indiriliyor.',
  'diagnostics.updates.state.downloaded':
    'Güncelleme indirildi ve bir sonraki başlatmada kurulacak.',
  'diagnostics.updates.state.error': 'Güncelleme denetimi tamamlanamadı.',
  'diagnostics.updates.unreachable': 'Sürüm akışına ulaşılamadı.',

  /* ================================================================ */
  /* Presets                                                           */
  /* ================================================================ */

  'presets.panel.title': 'Hazır ayarlar',
  'presets.panel.listLabel': 'Kullanılabilir hazır ayarlar',
  'presets.panel.builtin': 'Yerleşik',
  'presets.panel.mine': 'Sizinkiler',
  'presets.panel.inUse': 'Kullanımda',
  'presets.panel.locked': 'Yerleşik',
  'presets.panel.noneYet': 'Kendi kitaplığınızı başlatmak için geçerli ayarlarınızı kaydedin.',
  'presets.panel.nothingToShow': 'Gösterilecek hazır ayar yok.',
  'presets.panel.noDescription': 'Bu hazır ayarın henüz açıklaması yok.',
  'presets.panel.changes': 'Neleri değiştirir',
  'presets.panel.changesNone': 'Bu hazır ayar her ayarı varsayılan değerinde bırakır.',

  'presets.copyName': '{name} (kopya)',

  'presets.action.apply': 'Uygula',
  'presets.action.duplicate': 'Çoğalt',
  'presets.action.export': 'Dışa aktar',
  'presets.action.exportAll': 'Tümünü dışa aktar',
  'presets.action.import': 'İçe aktar',
  'presets.action.delete': 'Sil',
  'presets.action.saveCurrent': 'Geçerli ayarları kaydet',

  'presets.message.applied': '{name} uygulandı.',
  'presets.message.duplicated': 'Hazır ayar çoğaltıldı.',
  'presets.message.deleted': 'Hazır ayar silindi.',
  'presets.message.imported': 'Hazır ayar dosyası içe aktarıldı.',
  'presets.message.exported': '{name} dışa aktarıldı.',
  'presets.message.exportedAllOne': '{path} konumuna 1 hazır ayar yazıldı.',
  'presets.message.exportedAllMany': '{path} konumuna {count} hazır ayar yazıldı.',
  'presets.message.nothingToExport': 'Henüz dışa aktarılacak kendi hazır ayarınız yok.',
  'presets.message.saved': '{name} kaydedildi.',
  'presets.message.nameRequired': 'Önce hazır ayara bir ad verin.',

  'presets.delete.title': 'Bu hazır ayar silinsin mi?',
  'presets.delete.description': 'Hazır ayar diskten silinir ve geri getirilemez.',
  'presets.delete.confirm': 'Sil',
  'presets.delete.cancel': 'Kalsın',

  'presets.save.title': 'Geçerli ayarları hazır ayar olarak kaydet',
  'presets.save.intro': 'Kenar çubuğundaki her şeyi saklar; çıktı, filigran ve performans dâhil.',
  'presets.save.namePlaceholder': 'Hazır ayar adı',
  'presets.save.descriptionPlaceholder': 'Bu hazır ayarın ne işe yaradığı.',
  'presets.save.confirm': 'Hazır ayarı kaydet',

  'presets.share.title': 'Hazır ayarlar birer dosyadır, paylaşabilirsiniz',
  'presets.share.whatItIs':
    'Hazır ayar, yalnızca kenar çubuğu ayarlarını tutan bir JSON dosyasıdır. İçinde görsel ya da makineniz hakkında bir şey olmaz, paylaşması güvenlidir.',
  'presets.share.howItWorks':
    'Dışa aktar tek bir hazır ayarı dosyaya yazar, tümünü dışa aktar hepsini yazar, içe aktar iki türü de geri okur.',
  'presets.share.exampleTitle': 'Örneğin',
  'presets.share.example':
    'Tüm ekip için: kalite 78 WebP, en uzun kenar 1600 px ile sınırlı, meta veri temizlenmiş; team-photos.json olarak dışa aktarın.',
  'presets.share.uses':
    'Aynı dosya bir meslektaşa e-postayla gönderildiğinde, bir hata bildirimine eklendiğinde ya da herkese yayımlandığında da işe yarar.',
  'presets.share.exportSelected': '{name} dışa aktar',
  'presets.share.exportSelectedNone': 'Seçili hazır ayarı dışa aktar',
  'presets.share.importHint':
    'İçe aktarılanlar sizinkilerin yanına eklenir, üzerlerine asla yazmaz.',

  'presets.summary.format': 'Biçim',
  'presets.summary.formatOriginal': 'Kaynakla aynı',
  'presets.summary.quality': 'Kalite',
  'presets.summary.lossless': 'Kayıpsız',
  'presets.summary.effort': 'Kodlayıcı çabası',
  'presets.summary.chroma': 'Kroma alt örnekleme',
  'presets.summary.progressive': 'Aşamalı',
  'presets.summary.mozjpeg': 'MozJPEG kodlayıcı',
  'presets.summary.tiffCompression': 'TIFF sıkıştırması',
  'presets.summary.pngPalette': 'PNG paleti',
  'presets.summary.pngPaletteOn': 'Açık, {colours} renk',
  'presets.summary.pngCompression': 'PNG sıkıştırması',

  'presets.summary.resize': 'Yeniden boyutlandırma',
  'presets.summary.resize.guard': ', orijinalin ötesine asla büyütülmez',
  'presets.summary.resize.none': 'Orijinal boyutunda korunur',
  'presets.summary.resize.exact': 'Tam olarak {width} x {height} piksel, {fit} ile{guard}',
  'presets.summary.resize.width': 'Genişlik {pixels} pikselle sınırlı{guard}',
  'presets.summary.resize.height': 'Yükseklik {pixels} pikselle sınırlı{guard}',
  'presets.summary.resize.longest': 'En uzun kenar {pixels} pikselle sınırlı{guard}',
  'presets.summary.resize.shortest': 'En kısa kenar {pixels} pikselle sınırlı{guard}',
  'presets.summary.resize.percentage': 'Yüzde {percent} oranına ölçeklenir',
  'presets.summary.resize.megapixels': 'Yaklaşık {megapixels} megapiksele ölçeklenir',
  'presets.summary.resize.unchanged': 'Değişmez',

  'presets.summary.crop': 'Kırpma',
  'presets.summary.cropValue': 'Etkin, {mode} modu',

  'presets.summary.adjustments': 'Ayarlamalar',
  'presets.summary.adjust.grayscale': 'gri tonlama',
  'presets.summary.adjust.normalize': 'seviyeler gerildi',
  'presets.summary.adjust.sharpen': 'keskinleştirildi',
  'presets.summary.adjust.blur': 'bulanıklaştırıldı',
  'presets.summary.adjust.clahe': 'yerel kontrast',
  'presets.summary.adjust.contrast': 'kontrast {value}',
  'presets.summary.adjust.separator': ', ',

  'presets.summary.watermark': 'Filigran',
  'presets.summary.watermark.text': '{text} yazan metin',
  'presets.summary.watermark.textTiled': '{text} yazan döşenmiş metin',
  'presets.summary.watermark.textEmpty': 'henüz bir şey yok',
  'presets.summary.watermark.image': 'Görsel bindirme',
  'presets.summary.watermark.imageTiled': 'Döşenmiş görsel bindirme',

  'presets.summary.metadata': 'Meta veri',
  'presets.summary.metadata.strip': 'Tamamen kaldırılır',
  'presets.summary.metadata.keep': 'Tümüyle korunur',
  'presets.summary.metadata.keepIcc': 'Yalnızca renk profili korunur',
  'presets.summary.metadata.keepCopyright': 'Yalnızca telif hakkı alanları korunur',
  'presets.summary.density': 'Yoğunluk',
  'presets.summary.densityValue': '{density} DPI',

  'presets.summary.template': 'Dosya adı şablonu',
  'presets.summary.structure': 'Klasör yapısı',
  'presets.summary.structure.flat': 'Her şey tek klasörde',
  'presets.summary.structure.mirror': 'Kaynak klasör ağacını yansıtır',
  'presets.summary.structure.byFormat': 'Çıktı biçimi başına bir klasör',
  'presets.summary.structure.byDate': 'Çalıştırma tarihi başına bir klasör',

  'presets.summary.sizeBudget': 'Boyut bütçesi',
  'presets.summary.sizeBudgetValue':
    'Görsel başına {kilobytes} KB, kalite {min} ile {max} arasında aranır',
  'presets.summary.autoFormat': 'Otomatik biçim',
  'presets.summary.autoFormatValue': 'İçeriğine göre her görsel için seçilir',

  'presets.summary.backend': 'İşleme arka ucu',
  'presets.summary.backend.auto': 'Görsel başına seçilir',
  'presets.summary.backend.gpu': 'GPU hatları tercih edilir',
  'presets.summary.backend.cpu': 'Yalnızca CPU çalışanları',
  'presets.summary.gpuLanes': 'GPU hatları',
  'presets.summary.gpuLanesValue': 'Algılanan her bağdaştırıcı için bir tane',

  'presets.summary.variants': 'Ek çıktılar',
  'presets.summary.variantsItem': '{label} ({suffix})',

  /* ================================================================ */
  /* Shell                                                             */
  /* ================================================================ */

  'shell.settings.title': 'Dönüştürme ayarları',

  'shell.drop.title': 'Eklemek için bırakın',
  'shell.drop.body': 'Görseller de klasörler de kabul edilir',

  'shell.import.unreadable': 'Bu öğeler diskten okunamadı.',
  'shell.import.dropEmpty': 'Bıraktıklarınızın içinde desteklenen görsel bulunamadı.',
  'shell.import.folderEmpty': 'Bu klasörde desteklenen görsel yoktu.',
  'shell.import.added.one': 'Bir görsel eklendi.',
  'shell.import.added.many': '{count} görsel eklendi.',

  'shell.convert.empty': 'Önce birkaç görsel ekleyin.',
  'shell.convert.needsFolder': 'Başlamadan önce bir çıktı klasörü seçin.',
  'shell.convert.cancelling': 'Sürmekte olan görseller bitiriliyor, ardından duracak.',

  /* ================================================================ */
  /* Compare slider                                                    */
  /* ================================================================ */

  'preview.error.unsupported': 'Bu görsel bu ayarlarla önizlenemedi.',

  'preview.compare.subject': 'seçili görsel',
  'preview.compare.altBefore': '{subject}, dönüştürmeden önce',
  'preview.compare.altAfter': '{subject}, dönüştürmeden sonra',
  'preview.compare.converted': 'Dönüştürülmüş',
  'preview.compare.original': 'Orijinal',
  'preview.compare.aria': 'Karşılaştırma sürgüsünün konumu',
  'preview.compare.ariaValue': '%{percent} dönüştürülmüş'
}
