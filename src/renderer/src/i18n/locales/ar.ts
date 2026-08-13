import type { TranslatedDictionary } from './contract'

/**
 * Arabic.
 *
 * The interface also flips to right to left for this language, which the
 * provider handles. Translations assume that layout rather than trying to
 * compensate inside the strings.
 *
 * Format names, codec names and hardware acronyms stay in Latin script, which is
 * how the field writes them in Arabic prose as well.
 */
export const ar: TranslatedDictionary = {
  /* ================================================================ */
  /* Common                                                            */
  /* ================================================================ */

  'app.name': 'BICO',
  'app.tagline': 'محوّل ومحسّن الصور بالجملة',

  'action.ok': 'موافق',
  'action.cancel': 'إلغاء',
  'action.close': 'إغلاق',
  'action.save': 'حفظ',
  'action.delete': 'حذف',
  'action.remove': 'إزالة',
  'action.apply': 'تطبيق',
  'action.reset': 'إعادة تعيين',
  'action.copy': 'نسخ',
  'action.copied': 'تم النسخ',
  'action.open': 'فتح',
  'action.browse': 'استعراض',
  'action.import': 'استيراد',
  'action.export': 'تصدير',
  'action.duplicate': 'تكرار',
  'action.retry': 'إعادة المحاولة',
  'action.clear': 'مسح',
  'action.showInFolder': 'إظهار في مدير الملفات',
  'action.learnMore': 'اعرف المزيد',

  'state.on': 'مفعّل',
  'state.off': 'معطّل',
  'state.automatic': 'تلقائي',
  'state.none': 'لا شيء',
  'state.unknown': 'غير معروف',
  'state.loading': 'جارٍ التحميل',
  'state.unavailable': 'غير متاح',

  'unit.byte': 'B',
  'unit.kb': 'KB',
  'unit.mb': 'MB',
  'unit.gb': 'GB',
  'unit.tb': 'TB',
  'unit.pixels': 'px',
  'unit.dpi': 'DPI',
  'unit.perSecond': 'في الثانية',
  'unit.mbPerSecond': 'MB/s',
  'unit.imagesPerSecond': 'صورة/ث',
  'unit.milliseconds': 'ms',
  'unit.seconds': 's',
  'unit.percent': 'بالمئة',

  'time.hoursMinutes': '{hours}س {minutes}د',
  'time.minutesSeconds': '{minutes}د {seconds}ث',
  'time.seconds': '{seconds}ث',
  'time.milliseconds': '{ms}ms',

  'backend.gpu': 'GPU',
  'backend.cpu': 'CPU',

  'status.queued': 'في الطابور',
  'status.running': 'قيد التنفيذ',
  'status.done': 'تمّت',
  'status.failed': 'فشلت',
  'status.skipped': 'متخطّاة',
  'status.cancelled': 'ملغاة',

  /* ================================================================ */
  /* Welcome                                                           */
  /* ================================================================ */

  'welcome.version': 'الإصدار {version}',
  'welcome.intro':
    'يحوّل BICO الصور ويحسّنها بالجملة على هذا الجهاز. لا يُرفع أي شيء، وتبقى الأصول دون تغيير ما لم تطلب غير ذلك.',
  'welcome.whatsNew': 'الجديد في {version}',
  'welcome.dontShowAgain': 'لا تُظهر هذا مجددًا',
  'welcome.start': 'لنبدأ',
  'welcome.facts.aria': 'العتاد المكتشف',

  'welcome.fact.processor': 'المعالج',
  'welcome.fact.processorValue': '{cpu}، {threads} خيط',
  'welcome.fact.workers': 'الخيوط العاملة',
  'welcome.fact.workersValue': '{count} قيد التشغيل',
  'welcome.fact.graphics': 'الرسوميات',
  'welcome.fact.graphicsNone': 'لا يوجد مهايئ صالح للاستخدام، والتحويل يجري على المعالج',

  'welcome.highlight.threads.title': 'الواجهة لا تتجمّد',
  'welcome.highlight.threads.body':
    'يجري الترميز في تجمّع من خيوط العمل الأصيلة بحجم يناسب معالجك.',
  'welcome.highlight.gpu.title': 'تسريع GPU',
  'welcome.highlight.gpu.body':
    'تعمل عمليات تغيير الحجم والمرشحات واللون كمظلّلات حوسبة على مُهايئ الرسوميات لديك، مع العودة إلى المعالج عند الحاجة.',
  'welcome.highlight.formats.title': 'تسع صيغ إخراج',
  'welcome.highlight.formats.body':
    'من JPEG وPNG إلى AVIF وJPEG XL وJPEG 2000، ولكل منها عناصر تحكم خاصة بمُرمِّزها.',
  'welcome.highlight.preview.title': 'شاهد النتيجة قبل التشغيل',
  'welcome.highlight.preview.body':
    'مقارنة حية بين ما قبل وما بعد بإعداداتك الحالية، مع حجم الناتج المتوقع.',
  'welcome.highlight.languages.title': 'ثلاث لغات',
  'welcome.highlight.languages.body':
    'الإنجليزية والتركية والعربية في كل الواجهة، مع انعكاس التخطيط للعربية.',
  'welcome.highlight.themes.title': 'ثماني سمات',
  'welcome.highlight.themes.body':
    'لوحات ألوان كاملة بدل تبديل لون التمييز فقط، وتُعاين كل واحدة حيًا قبل الاختيار.',

  /* ================================================================ */
  /* Toolbar                                                           */
  /* ================================================================ */

  'toolbar.panel.stats': 'الإحصائيات',
  'toolbar.panel.preferences': 'التفضيلات والتشخيص',
  'toolbar.settings': 'الإعدادات',
  'toolbar.settings.tooltip': 'الإعدادات المسبقة ومجلد المراقبة وسجل العمليات والمظهر والتشخيص',
  'toolbar.actions.aria': 'الإجراءات الرئيسية',
  'toolbar.theme.cycle': 'المظهر: {theme}',

  'toolbar.logoAlt': 'أيقونة تطبيق BICO',
  'toolbar.version': 'v{version}',
  'toolbar.sidebar.hide': 'إخفاء لوحة الإعدادات',
  'toolbar.sidebar.show': 'إظهار لوحة الإعدادات',

  'toolbar.addImages': 'إضافة صور',
  'toolbar.addImages.tooltip': 'اختر صورًا مفردة لإضافتها إلى الطابور',
  'toolbar.addFolder': 'إضافة مجلد',
  'toolbar.addFolder.tooltip': 'اختر مجلدًا وأضف كل صورة بداخله',

  'toolbar.start': 'بدء التحويل',
  'toolbar.start.tooltip': 'حوّل كل ما في الطابور بالإعدادات الحالية',
  'toolbar.pause': 'إيقاف مؤقت',
  'toolbar.pause.tooltip': 'التوقف عن أخذ صور جديدة بعد انتهاء الصور الجارية',
  'toolbar.resume': 'استئناف',
  'toolbar.resume.tooltip': 'المتابعة من حيث أُوقفت العملية',
  'toolbar.cancel': 'إلغاء',
  'toolbar.cancel.tooltip': 'إيقاف العملية. وتبقى الملفات المكتوبة بالفعل',

  'toolbar.more': 'أدوات أخرى',

  'toolbar.panel.preview': 'معاينة حية',
  'toolbar.panel.presets': 'الإعدادات المسبقة',
  'toolbar.panel.watch': 'مجلد المراقبة',
  'toolbar.panel.history': 'سجل العمليات',
  'toolbar.panel.diagnostics': 'التشخيص',
  'toolbar.panel.about': 'عن BICO',

  'toolbar.theme.dark': 'السمة الداكنة',
  'toolbar.theme.light': 'السمة الفاتحة',
  'toolbar.theme.system': 'السمة تتبع النظام',
  'toolbar.theme.change': 'تغيير السمة',
  'toolbar.theme.tooltip': '{theme}. انقر لتغييرها.',

  'toolbar.confirm.title': 'بدء التحويل',
  'toolbar.confirm.one': 'ستُحوَّل صورة واحدة إلى {format}.',
  'toolbar.confirm.many': 'ستُحوَّل {count} صورة إلى {format}.',
  'toolbar.confirm.oneOriginal': 'ستُحوَّل صورة واحدة مع الإبقاء على صيغتها.',
  'toolbar.confirm.manyOriginal': 'ستُحوَّل {count} صورة، وتحتفظ كل منها بصيغتها.',
  'toolbar.confirm.ok': 'ابدأ',
  'toolbar.confirm.cancel': 'ليس الآن',

  'toolbar.progress.aria': 'تقدّم التحويل، اكتمل {percent} بالمئة',

  /* ================================================================ */
  /* Stat strip                                                        */
  /* ================================================================ */

  'stats.queued.one': 'صورة في الطابور',
  'stats.queued.many': 'صور في الطابور',
  'stats.sourceSize': 'حجم المصدر',
  'stats.targetFormat.original': 'الأصلية',
  'stats.targetFormat.originalTagline': 'كل ملف يحتفظ بصيغته',
  'stats.targetFormat.originalHint': 'لا يُطبَّق أي تغيير للحاوية.',
  'stats.throughput.value': '{rate} MB/s',
  'stats.throughput.label': 'يتبقى {duration}',
  'stats.estimate.label': 'الناتج المقدَّر',
  'stats.estimate.pending': 'جارٍ التقدير',
  'stats.estimate.smaller': 'أصغر بنسبة {percent}%',
  'stats.estimate.larger': 'أكبر بنسبة {percent}%',

  /* ================================================================ */
  /* Status bar                                                        */
  /* ================================================================ */

  'statusbar.gpu.probing': 'جارٍ فحص دعم الرسوميات',
  'statusbar.gpu.probingDetail': 'ما زال BICO يفحص المهايئات المتاحة.',
  'statusbar.gpu.unavailable': 'GPU غير متاح، {reason}',
  'statusbar.gpu.unavailableReason': 'لم يُعثر على مهايئ متوافق',
  'statusbar.gpu.unavailableDetail': 'ستُعالَج كل صورة عبر مسار CPU.',
  'statusbar.gpu.idle': 'GPU خامل، {reason}',
  'statusbar.gpu.idleReason': 'التسريع معطّل في الإعدادات',
  'statusbar.gpu.idleDetail': 'غيّر محرك المعالجة في إعدادات الأداء لاستخدامه.',
  'statusbar.gpu.active': 'تسريع GPU على {device}',
  'statusbar.gpu.genericAdapter': 'مهايئ رسوميات',
  'statusbar.gpu.activeDetail':
    'اكتملت {processed} صورة على مسارات GPU، و{fallbacks} تراجعت إلى CPU.',
  'statusbar.gpu.openDiagnostics': 'فتح لوحة التشخيص',

  'statusbar.workers.one': 'خيط عامل واحد',
  'statusbar.workers.many': '{count} خيوط عاملة',
  'statusbar.workers.detail': 'خيوط CPU العاملة المتاحة لمجمّع التحويل.',
  'statusbar.working': 'قيد العمل: {devices}',
  'statusbar.working.detail': 'كل مسار يحمل صورة في هذه اللحظة.',

  'statusbar.output.folder': 'مجلد',
  'statusbar.output.archive': 'أرشيف',
  'statusbar.output.inPlace': 'في المكان، تُعاد كتابة كل ملف بجوار مصدره',
  'statusbar.output.inPlaceDetail':
    'يُستبدل كل ملف مصدر بنسخته المحوّلة. ولا يُنسخ شيء إلى مكان آخر.',
  'statusbar.output.label': '{label}:',
  'statusbar.output.revealHint': '{path}. انقر لعرضه في مدير الملفات.',
  'statusbar.output.noArchive': 'لم يُختَر أرشيف بعد',
  'statusbar.output.noFolder': 'لم يُختَر مجلد إخراج بعد',
  'statusbar.output.noneDetail': 'اختر وجهة في قسم الإخراج قبل بدء أي عملية.',

  'statusbar.rate.throughput': '{rate} MB/s',
  'statusbar.rate.throughputDetail': 'ميغابايت المصدر المقروءة في الثانية عبر كل المسارات.',
  'statusbar.rate.images': '{rate} صورة/ث',
  'statusbar.rate.imagesDetail': 'الصور المنتهية في الثانية عبر كل المسارات.',

  /* ================================================================ */
  /* Command palette                                                   */
  /* ================================================================ */

  'palette.search.placeholder': 'ابحث في الأوامر واللوحات والإعدادات المسبقة',
  'palette.search.aria': 'البحث في الأوامر',
  'palette.list.aria': 'الأوامر',
  'palette.empty': 'لا يوجد أمر يطابق هذا البحث.',
  'palette.empty.hint': 'جرّب كلمة أقصر أو جزءًا من اسم إعداد مسبق.',
  'palette.hint.move': 'أعلى وأسفل للتنقل',
  'palette.hint.run': 'Enter للتشغيل',
  'palette.hint.close': 'Escape للإغلاق',

  'palette.section.files': 'الملفات',
  'palette.section.conversion': 'التحويل',
  'palette.section.panels': 'اللوحات',
  'palette.section.appearance': 'المظهر',
  'palette.section.presets': 'الإعدادات المسبقة',
  'palette.section.help': 'مساعدة',

  'palette.command.addFiles': 'إضافة صور',
  'palette.command.addFiles.keywords':
    'استيراد فتح صور لقطات استعراض import open pictures photos browse',
  'palette.command.addFolder': 'إضافة مجلد صور',
  'palette.command.addFolder.keywords':
    'استيراد مجلد دليل متداخل شجرة import directory recursive tree',
  'palette.command.outputFolder': 'اختيار مجلد الإخراج',
  'palette.command.outputFolder.keywords':
    'وجهة حفظ أين هدف مجلد destination save where target directory',
  'palette.command.outputZip': 'كتابة الناتج في أرشيف ZIP',
  'palette.command.outputZip.keywords': 'أرشيف ضغط حزمة zip archive compress bundle package',
  'palette.command.removeSelected': 'إزالة الصورة المحددة',
  'palette.command.removeSelected.keywords': 'حذف إزالة تجاهل صف delete drop discard row',
  'palette.command.clearQueue': 'مسح الطابور',
  'palette.command.clearQueue.keywords': 'إفراغ تفريغ الكل بداية empty reset remove all start over',
  'palette.command.start': 'بدء التحويل',
  'palette.command.start.keywords': 'تشغيل بدء معالجة دفعة run go begin process batch',
  'palette.command.pause': 'إيقاف العملية مؤقتًا أو استئنافها',
  'palette.command.pause.keywords': 'تعليق متابعة استئناف hold continue suspend',
  'palette.command.cancel': 'إلغاء العملية',
  'palette.command.cancel.keywords': 'إيقاف إجهاض stop abort halt',
  'palette.command.panelPreview': 'فتح المعاينة الحية',
  'palette.command.panelPreview.keywords':
    'مقارنة قبل بعد جودة compare before after wipe quality check',
  'palette.command.panelPresets': 'إدارة الإعدادات المسبقة',
  'palette.command.panelPresets.keywords': 'مكتبة محفوظ وصفات ملفات library saved recipes profiles',
  'palette.command.panelWatch': 'إعداد مجلد المراقبة',
  'palette.command.panelWatch.keywords':
    'مجلد ساخن تلقائي مراقبة hot folder automatic monitor drop',
  'palette.command.panelHistory': 'فتح سجل العمليات',
  'palette.command.panelHistory.keywords': 'سابق سجل نتائج past previous log results',
  'palette.command.panelDiagnostics': 'فتح التشخيص',
  'palette.command.panelDiagnostics.keywords':
    'النظام سجلات دعم أعطال system gpu logs support troubleshooting',
  'palette.command.panelAbout': 'عن BICO',
  'palette.command.panelAbout.keywords': 'الإصدار شكر ترخيص version credits licence',
  'palette.command.themeDark': 'استخدام السمة الداكنة',
  'palette.command.themeDark.keywords': 'ليل ألوان داكن night colour scheme',
  'palette.command.themeLight': 'استخدام السمة الفاتحة',
  'palette.command.themeLight.keywords': 'نهار فاتح ألوان day bright colour scheme',
  'palette.command.themeSystem': 'مطابقة سمة النظام',
  'palette.command.themeSystem.keywords': 'تلقائي النظام اتباع ألوان auto os follow colour scheme',
  'palette.command.viewTable': 'عرض الطابور كجدول',
  'palette.command.viewTable.keywords': 'قائمة صفوف أعمدة تفاصيل list rows columns detail',
  'palette.command.viewGrid': 'عرض الطابور كشبكة',
  'palette.command.viewGrid.keywords': 'مصغرات بطاقات معرض thumbnails cards tiles gallery',
  'palette.command.toggleSidebar': 'تبديل الشريط الجانبي للإعدادات',
  'palette.command.toggleSidebar.keywords': 'إخفاء إظهار لوحة طي hide show panel collapse',
  'palette.command.help': 'فتح صفحة مشروع BICO',
  'palette.command.help.keywords': 'توثيق مساعدة مشكلات documentation github readme support issues',
  'palette.command.applyPreset': 'تطبيق الإعداد المسبق: {name}',

  /* ================================================================ */
  /* Run summary                                                       */
  /* ================================================================ */

  'summary.title': 'ملخص العملية',
  'summary.result.cancelled': 'أُلغيت العملية',
  'summary.result.partial': 'انتهت مع بعض الإخفاقات',
  'summary.result.success': 'حُوِّلت كل الصور',
  'summary.format.original': 'صيغتها الأصلية',
  'summary.subtitle.cancelled': 'توقّف بعد {processed} من أصل {total} صورة.',
  'summary.subtitle.partial':
    'كُتبت {processed} من أصل {total} صورة بصيغة {format}، وفشلت {failed}.',
  'summary.subtitle.success': 'كُتبت {processed} صورة بصيغة {format} في {duration}.',

  'summary.tile.converted': 'مُحوَّلة',
  'summary.tile.failed': 'فاشلة',
  'summary.tile.skipped': 'متخطّاة',
  'summary.tile.totalTime': 'الوقت الإجمالي',
  'summary.tile.averagePerImage': 'المتوسط لكل صورة',
  'summary.tile.sizeBefore': 'الحجم قبل',
  'summary.tile.sizeAfter': 'الحجم بعد',
  'summary.tile.saved': 'المُوفَّر',
  'summary.tile.savedPercent': 'نسبة التوفير',
  'summary.tile.savedPercentValue': '{percent} بالمئة',

  'summary.lanes.title': 'أين جرى العمل',
  'summary.lanes.empty': 'لم تكتمل أي صورة، فلا يوجد ما يُقسَّم.',
  'summary.lanes.aria': '{gpu} صورة على مسارات GPU و{cpu} على عمّال CPU',
  'summary.lanes.gpu': 'GPU {count} صورة، {percent} بالمئة',
  'summary.lanes.cpu': 'CPU {count} صورة، {percent} بالمئة',

  'summary.output.title': 'الإخراج',
  'summary.output.unknown': 'لم يُسجَّل موقع الإخراج لهذه العملية.',
  'summary.output.openReport': 'فتح تقرير CSV',

  'summary.errors.one': 'تعذّر تحويل صورة واحدة',
  'summary.errors.many': 'تعذّر تحويل {count} صورة',
  'summary.errors.copy': 'نسخ كل الإخفاقات',
  'summary.errors.copied': 'نُسخت كل الإخفاقات إلى الحافظة.',

  /* ================================================================ */
  /* Queue                                                             */
  /* ================================================================ */

  'queue.count.one': 'صورة واحدة',
  'queue.count.many': '{count} صورة',
  'queue.count.filtered': '{shown} من {total} صورة',

  'queue.view.table': 'عرض جدولي',
  'queue.view.grid': 'عرض شبكي',

  'queue.search.placeholder': 'تصفية باسم الملف',
  'queue.filter.aria': 'تصفية الطابور حسب الحالة',
  'queue.filter.all': 'كل الصور',
  'queue.filter.pending': 'قيد الانتظار',
  'queue.filter.done': 'تمّت',
  'queue.filter.failed': 'فشلت',
  'queue.filter.skipped': 'متخطّاة',

  'queue.clear': 'مسح',
  'queue.clear.title': 'مسح الطابور',
  'queue.clear.description': 'تخرج كل صورة من القائمة. ولا يُحذف شيء من القرص.',
  'queue.clear.confirm': 'مسح',
  'queue.clear.keep': 'إبقاء',

  'queue.column.thumbnail': 'معاينة',
  'queue.column.file': 'الملف',
  'queue.column.dimensions': 'الأبعاد',
  'queue.column.source': 'المصدر',
  'queue.column.output': 'الناتج',
  'queue.column.status': 'الحالة',
  'queue.column.backend': 'المحرك',
  'queue.column.actions': 'إجراءات',

  'queue.dimensions.value': '{width} × {height}',
  'queue.dimensions.reading': 'جارٍ القراءة',
  'queue.dimensions.readingHint': 'ما زال BICO يقرأ ترويسة هذا الملف.',

  'queue.output.pending': 'قيد الانتظار',
  'queue.output.none': 'لا شيء',
  'queue.output.smaller': '-{percent}%',
  'queue.output.larger': '+{percent}%',

  'queue.backend.gpuHint': 'مهايئ رسوميات',
  'queue.backend.cpuHint': 'خيط عامل',

  'queue.row.remove': 'إزالة من الطابور',
  'queue.row.removeNamed': 'إزالة {name}',
  'queue.row.thumbnailAlt': 'صورة مصغّرة لـ {name}',

  'queue.empty.filtered': 'لا توجد صور تطابق هذه التصفية.',
  'queue.empty.filteredHint': 'امسح حقل البحث أو اختر حالة أخرى.',
  'queue.grid.limited': 'تُعرض أول {count} صورة. انتقل إلى العرض الجدولي للطابور كاملًا.',

  /* ================================================================ */
  /* Empty state                                                       */
  /* ================================================================ */

  'dropzone.title': 'أفلت الصور هنا للبدء',
  'dropzone.body': 'اسحب ملفات أو مجلدات. تُفحص المجلدات حتى آخر مستوى وتبقى الأصول دون مساس.',
  'dropzone.formats': 'الصيغ المقروءة: {list}',
  'dropzone.feature.recursive': 'يشمل المجلدات الفرعية',
  'dropzone.feature.nondestructive': 'الأصول دون مساس',
  'dropzone.feature.formats': '{count} صيغة إدخال',

  /* ================================================================ */
  /* Shared value formats and anchor names                             */
  /* ================================================================ */

  'settings.value.px': '{value} px',
  'settings.value.percent': '{value}%',
  'settings.value.percentWord': '{value} بالمئة',
  'settings.value.degrees': '{value} درجة',
  'settings.value.deg': '{value}°',
  'settings.value.megabytes': '{value} MB',
  'settings.value.range': '{min} إلى {max}',

  'settings.axis.x': 'X',
  'settings.axis.y': 'Y',
  'settings.axis.width': 'W',
  'settings.axis.height': 'H',

  'settings.position.center': 'الوسط',
  'settings.position.north': 'أعلى',
  'settings.position.northeast': 'أعلى اليمين',
  'settings.position.east': 'يمين',
  'settings.position.southeast': 'أسفل اليمين',
  'settings.position.south': 'أسفل',
  'settings.position.southwest': 'أسفل اليسار',
  'settings.position.west': 'يسار',
  'settings.position.northwest': 'أعلى اليسار',
  'settings.position.entropy': 'أكثر منطقة ازدحامًا',
  'settings.position.attention': 'الموضوع الرئيسي',

  /* ================================================================ */
  /* Sidebar sections and their header badges                          */
  /* ================================================================ */

  'settings.section.format': 'صيغة الإخراج',
  'settings.section.resize': 'تغيير الحجم',
  'settings.section.transform': 'التحويل الهندسي',
  'settings.section.adjust': 'التعديلات',
  'settings.section.watermark': 'العلامة المائية',
  'settings.section.metadata': 'البيانات الوصفية',
  'settings.section.output': 'الإخراج',
  'settings.section.variants': 'الإصدارات',
  'settings.section.smart': 'الذكي',
  'settings.section.performance': 'الأداء',

  'settings.summary.more': '{first} +{count}',

  'settings.summary.format.original': 'الأصلية',
  'settings.summary.format.lossless': '{format} بلا فقد',
  'settings.summary.format.quality': '{format} {quality}',

  'settings.summary.resize.exact': '{width} × {height}',
  'settings.summary.resize.exactUnset': 'حجم محدد',
  'settings.summary.resize.width': 'عرض {value}',
  'settings.summary.resize.widthUnset': 'عرض ثابت',
  'settings.summary.resize.height': 'ارتفاع {value}',
  'settings.summary.resize.heightUnset': 'ارتفاع ثابت',
  'settings.summary.resize.longest': 'أطول ضلع {value}',
  'settings.summary.resize.longestUnset': 'أطول ضلع',
  'settings.summary.resize.shortest': 'أقصر ضلع {value}',
  'settings.summary.resize.shortestUnset': 'أقصر ضلع',
  'settings.summary.resize.percentage': '{value} بالمئة',
  'settings.summary.resize.megapixels': '{value} MP',

  'settings.summary.transform.rotated': 'تدوير {angle}',
  'settings.summary.transform.flippedBoth': 'قلب بالاتجاهين',
  'settings.summary.transform.mirrored': 'قلب أفقي',
  'settings.summary.transform.flipped': 'قلب رأسي',
  'settings.summary.transform.cropped': 'مقتصّة',
  'settings.summary.transform.border': 'إطار {value} px',
  'settings.summary.transform.exifIgnored': 'تجاهل EXIF',

  'settings.summary.adjust.activeOne': 'واحد مفعّل',
  'settings.summary.adjust.active': '{count} مفعّلة',

  'settings.summary.watermark.text': 'نص',
  'settings.summary.watermark.image': 'صورة',

  'settings.summary.metadata.keepAll': 'إبقاء الكل',
  'settings.summary.metadata.keepProfile': 'إبقاء الملف اللوني',
  'settings.summary.metadata.keepCopyright': 'إبقاء حقوق النشر',
  'settings.summary.metadata.density': '{value} DPI',
  'settings.summary.metadata.customProfile': 'ملف لوني مخصص',
  'settings.summary.metadata.attributed': 'منسوبة',

  'settings.summary.output.zip': 'إلى ZIP',
  'settings.summary.output.inPlace': 'في المكان',
  'settings.summary.output.mirror': 'شجرة مطابقة',
  'settings.summary.output.byFormat': 'تقسيم بالصيغة',
  'settings.summary.output.byDate': 'تقسيم بالتاريخ',
  'settings.summary.output.customNames': 'أسماء مخصصة',
  'settings.summary.output.overwrites': 'استبدال',
  'settings.summary.output.skipsExisting': 'تخطي الموجود',
  'settings.summary.output.caseChanged': 'تغيير الأحرف',
  'settings.summary.output.skipsGrowth': 'تخطي التضخم',
  'settings.summary.output.report': 'تقرير CSV',

  'settings.summary.variants.enabledOne': 'واحد مفعّل',
  'settings.summary.variants.enabled': '{count} مفعّلة',

  'settings.summary.smart.under': 'أقل من {value} KB',
  'settings.summary.smart.about': 'نحو {value} KB',
  'settings.summary.smart.autoFormat': 'صيغة تلقائية',
  'settings.summary.smart.autoPalette': 'لوحة ألوان تلقائية',

  'settings.summary.performance.gpuOnly': 'GPU فقط',
  'settings.summary.performance.cpuOnly': 'CPU فقط',
  'settings.summary.performance.workerOne': 'عامل واحد',
  'settings.summary.performance.workers': '{count} عامل',
  'settings.summary.performance.everyGpu': 'كل بطاقات GPU',
  'settings.summary.performance.noGpuAssist': 'بلا مساعدة GPU',
  'settings.summary.performance.cache': 'ذاكرة مؤقتة {value} MB',

  /* ================================================================ */
  /* Preset bar                                                        */
  /* ================================================================ */

  'settings.preset.select': 'الإعداد المسبق النشط',
  'settings.preset.groupBuiltin': 'مدمجة',
  'settings.preset.groupMine': 'خاصتك',
  'settings.preset.modified': 'معدّل',
  'settings.preset.revertTooltip': 'تجاهل هذه التغييرات وأعد تحميل الإعداد المسبق',
  'settings.preset.revertLabel': 'العودة إلى الإعداد المسبق المحفوظ',
  'settings.preset.saveTooltip': 'احفظ الإعدادات المعروضة كإعداد مسبق خاص بك',
  'settings.preset.save': 'حفظ',

  /* ================================================================ */
  /* Format section                                                    */
  /* ================================================================ */

  'settings.format.label': 'صيغة الإخراج',
  'settings.format.original.label': 'الإبقاء على صيغة كل ملف',
  'settings.format.jpeg.tagline': 'صيغة الصور الشاملة',
  'settings.format.jpeg.description':
    'يُفتح في كل مكان. بلا شفافية ولا حركة، لكن MozJPEG يبقيه منافسًا في الصور الفوتوغرافية.',
  'settings.format.png.tagline': 'بلا فقد مع شفافية',
  'settings.format.png.description':
    'دقيق على مستوى البكسل مع alpha، للقطات الشاشة والشعارات وعناصر UI. ووضع لوحة الألوان يقلّص حجم الرسوم المسطّحة بشدة.',
  'settings.format.webp.tagline': 'الخيار الحديث الآمن',
  'settings.format.webp.description':
    'أصغر من JPEG بنحو 30 بالمئة عند الجودة نفسها، مع alpha وحركة. وكل متصفح حالي يقرؤه.',
  'settings.format.avif.tagline': 'أصغر الملفات، أبطأ ترميز',
  'settings.format.avif.description':
    'أفضل ضغط هنا، وغالبًا نصف حجم WebP. والترميز بطيء، فلا ترفع الجهد إلا حين يكون الحجم هو الأهم.',
  'settings.format.tiff.tagline': 'الأرشفة والطباعة',
  'settings.format.tiff.description':
    'للطباعة والمسح الضوئي والأرشيف. أعماق بتات عالية وعدة أنظمة ضغط وتبليط هرمي.',
  'settings.format.gif.tagline': 'حركة قديمة الطراز',
  'settings.format.gif.description':
    'لا يتجاوز 256 لونًا وحلّ محله WebP المتحرك، لكنه يبقى الأكثر أمانًا للحلقات القصيرة في البرامج القديمة.',
  'settings.format.heif.tagline': 'منظومة Apple',
  'settings.format.heif.description':
    'ما تكتبه أجهزة iPhone افتراضيًا. ضغط قوي وألوان واسعة، لكن العرض خارج منصات Apple متفاوت.',
  'settings.format.jxl.tagline': 'أصغر من AVIF وأسرع ترميزًا',
  'settings.format.jxl.description':
    'يحفظ التفاصيل أفضل من AVIF عند الحجم نفسه ويُرمَّز أسرع. ودعم المتصفحات محدود، والبيانات الوصفية لا تُنقل.',
  'settings.format.jp2.tagline': 'صيغة أرشفة مويجية',
  'settings.format.jp2.description':
    'مطلوب في التصوير الطبي والسينما الرقمية وبعض الأرشيفات. الملفات كبيرة، والجودة هدف لنسبة الإشارة إلى الضوضاء لا نسبة مئوية.',

  'settings.format.original.tagline': 'بلا تحويل، تحسين فقط',
  'settings.format.original.description':
    'يُكتب كل ملف بالصيغة التي وصل بها. ويبقى تغيير الحجم والتعديلات والعلامات المائية ساريًا.',
  'settings.format.unavailable': 'غير متاح: بُنيت نسخة libvips هذه دون هذا الترميز.',

  'settings.format.caps.alpha.on': 'شفافية',
  'settings.format.caps.alpha.off': 'بلا شفافية',
  'settings.format.caps.animation.on': 'حركة',
  'settings.format.caps.animation.off': 'بلا حركة',
  'settings.format.caps.lossless.on': 'وضع بلا فقد',
  'settings.format.caps.lossless.off': 'مع فقد فقط',
  'settings.format.caps.hdr.on': 'عمق ألوان عالٍ',
  'settings.format.caps.hdr.off': 'ثمانية بتات فقط',
  'settings.format.caps.metadata.on': 'يحفظ البيانات الوصفية',
  'settings.format.caps.metadata.off': 'يُسقط البيانات الوصفية',
  'settings.format.caps.gpu.on': 'قابل للترميز على GPU',
  'settings.format.caps.gpu.off': 'يُرمَّز على CPU',

  'settings.format.quality.label': 'الجودة',
  'settings.format.quality.hint':
    'الأعلى يحفظ تفاصيل أكثر في ملفات أكبر. والصور الفوتوغرافية تصمد بين 75 و90.',
  'settings.format.lossless.label': 'بلا فقد',
  'settings.format.lossless.hint': 'يعيد إنتاج كل بكسل تمامًا. وتصبح الملفات أكبر بكثير.',
  'settings.format.effort.label': 'جهد المُرمِّز',
  'settings.format.effort.hint': 'الجهد الأعلى يعني ملفات أصغر وترميزًا أبطأ.',
  'settings.format.effort.fast': 'سريع',
  'settings.format.effort.small': 'صغير',
  'settings.format.chroma.label': 'اختزال عيّنات اللون',
  'settings.format.chroma.hint': '4:4:4 يحفظ اللون بدقته الكاملة. و4:2:0 يحفظ ربعها.',
  'settings.format.alphaQuality.label': 'جودة قناة ألفا',
  'settings.format.alphaQuality.hint': 'مدى شدة ضغط قناع الشفافية. اتركه عند 100.',
  'settings.format.progressive.label': 'تدريجي',
  'settings.format.progressive.hint': 'يعرض نسخة تقريبية أولًا، ثم يحسّنها كلما وصل الباقي.',
  'settings.format.animated.label': 'الإبقاء على الحركة',
  'settings.format.animated.hint': 'يحوّل كل إطار من المصدر المتحرك. وتعطيله يكتب الأول وحده.',

  'settings.format.jpeg.title': 'مُرمِّز JPEG',
  'settings.format.jpeg.mozjpeg.label': 'MozJPEG',
  'settings.format.jpeg.mozjpeg.hint':
    'مُرمِّز Mozilla المضبوط. أصغر عادة بنسبة 5 إلى 15 بالمئة من المُرمِّز القياسي عند الجودة نفسها، وأبطأ منه.',
  'settings.format.jpeg.trellis.label': 'تكميم Trellis',
  'settings.format.jpeg.trellis.hint':
    'يحسّن كل معامل مقابل كلفة تخزينه. بطيء، ويستحق بضع نقاط مئوية.',
  'settings.format.jpeg.overshoot.label': 'إزالة الهالات حول الحواف',
  'settings.format.jpeg.overshoot.hint':
    'يكبح الهالة حول الحواف الحادة التي تجعل النص يبدو متسخًا.',
  'settings.format.jpeg.scans.label': 'تحسين المسحات التدريجية',
  'settings.format.jpeg.scans.hint': 'يبحث عن ترتيب أفضل للمسحات التدريجية. ويحتاج تفعيل التدريجي.',

  'settings.format.png.title': 'مُرمِّز PNG',
  'settings.format.png.compression.label': 'مستوى الضغط',
  'settings.format.png.compression.hint':
    'جهد Deflate من 0 إلى 9. والمستوى 9 يكلّف وقتًا أطول من المستوى 7.',
  'settings.format.png.palette.label': 'التكميم إلى لوحة ألوان',
  'settings.format.png.palette.hint':
    'يختزل الصورة إلى ألوان مفهرسة. والصور الفوتوغرافية تتقطّع لونيًا.',
  'settings.format.png.colours.label': 'ألوان اللوحة',
  'settings.format.png.colours.hint':
    'عدد الألوان المميزة المحفوظة. والشعارات ولقطات الشاشة تصمد عند 64.',
  'settings.format.png.dither.label': 'التنقيط',
  'settings.format.png.dither.hint': 'يبعثر خطأ التكميم فتقلّ أشرطة التدرجات.',
  'settings.format.png.adaptive.label': 'الترشيح التكيّفي',
  'settings.format.png.adaptive.hint':
    'يختار مرشّحًا لكل سطر مسح. يفيد الصور الفوتوغرافية ويضر الرسوم المسطحة.',

  'settings.format.webp.title': 'مُرمِّز WebP',
  'settings.format.webp.nearLossless.label': 'شبه بلا فقد',
  'settings.format.webp.nearLossless.hint':
    'يعالج الصورة مسبقًا ليضغطها الترميز بلا فقد إلى حجم أصغر بكثير.',
  'settings.format.webp.smartSubsample.label': 'اختزال العينات الذكي',
  'settings.format.webp.smartSubsample.hint': 'يضبط المُرمِّز دقة اللون لكل صورة لا لكل دفعة.',

  'settings.format.tiff.title': 'حاوية TIFF',
  'settings.format.tiff.compression.label': 'الضغط',
  'settings.format.tiff.compression.hint':
    'LZW وDeflate بلا فقد. وJPEG وWebP مع فقد ويلتزمان بالجودة.',
  'settings.format.tiff.compression.ccitt': 'CCITT Group 4 للفاكس',
  'settings.format.tiff.predictor.label': 'المتنبّئ',
  'settings.format.tiff.predictor.hint':
    'يخزّن الفروق بين البكسلات المتجاورة، وهو ما يفيد LZW وDeflate.',
  'settings.format.tiff.predictor.horizontal': 'أفقي',
  'settings.format.tiff.predictor.float': 'فاصلة عائمة',
  'settings.format.tiff.bitdepth.label': 'البتات لكل قناة',
  'settings.format.tiff.bitdepth.hint':
    'ما دون 8 يكتب صورة ثنائية المستوى أو قليلة الألوان، تناسب الرسوم الخطية الممسوحة.',
  'settings.format.tiff.pyramid.label': 'التبليط الهرمي',
  'settings.format.tiff.pyramid.hint': 'يكتب عدة دقّات في ملف واحد لعرض الصور الضخمة.',

  'settings.format.gif.title': 'لوحة ألوان GIF',
  'settings.format.gif.colours.label': 'ألوان اللوحة',
  'settings.format.gif.colours.hint':
    'يحمل GIF 256 لونًا كحد أقصى. والنزول إلى 64 يوفّر غالبًا الثلث.',
  'settings.format.gif.dither.label': 'التنقيط',
  'settings.format.gif.dither.hint': 'الأعلى يخفي تقطّع التدرجات لكنه يضيف ضجيجًا وحجمًا.',
  'settings.format.gif.loop.label': 'عدد التكرارات',
  'settings.format.gif.loop.hint': 'الصفر يكرّر إلى ما لا نهاية. وأي رقم آخر يشغّل بهذا العدد.',

  'settings.format.jxl.title': 'JPEG XL',
  'settings.format.jxl.note':
    'مُرمِّز JPEG XL يعمل بـ WebAssembly، فهو أبطأ من غيره. والبيانات الوصفية لا تُنقل إلى الناتج.',

  /* ================================================================ */
  /* Resize section                                                    */
  /* ================================================================ */

  'settings.resize.strategy.label': 'الأسلوب',
  'settings.resize.strategy.none': 'بلا تغيير للحجم',
  'settings.resize.strategy.exact': 'عرض وارتفاع محددان',
  'settings.resize.strategy.width': 'عرض ثابت',
  'settings.resize.strategy.height': 'ارتفاع ثابت',
  'settings.resize.strategy.longest': 'أطول ضلع',
  'settings.resize.strategy.shortest': 'أقصر ضلع',
  'settings.resize.strategy.percentage': 'نسبة من الأصل',
  'settings.resize.strategy.megapixels': 'إجمالي الميغابكسل',

  'settings.resize.target.label': 'الحجم الهدف',
  'settings.resize.target.hint': 'كلا الرقمين بالبكسل.',
  'settings.resize.width.label': 'العرض',
  'settings.resize.width.placeholder': 'العرض',
  'settings.resize.height.label': 'الارتفاع',
  'settings.resize.height.placeholder': 'الارتفاع',
  'settings.resize.edge.hint': 'مقيسة بالبكسل.',
  'settings.resize.pixels.placeholder': 'بكسل',
  'settings.resize.scale.label': 'المقياس',
  'settings.resize.megapixels.label': 'ميغابكسل',
  'settings.resize.megapixels.hint': 'اثنا عشر ميغابكسل تعادل نحو 4000 × 3000 بكسل.',
  'settings.resize.megapixels.suffix': 'MP',

  'settings.resize.locked': 'اختر أسلوبًا أعلاه لفتح الملاءمة والموضع وإعادة أخذ العينات.',

  'settings.resize.fit.label': 'الملاءمة',
  'settings.resize.fit.hint':
    'التغطية تقتصّ، والاحتواء يحشو، والداخلي والخارجي يحافظان على نسبة الأبعاد.',
  'settings.resize.fit.cover': 'تغطية',
  'settings.resize.fit.contain': 'احتواء',
  'settings.resize.fit.fill': 'ملء',
  'settings.resize.fit.inside': 'داخلي',
  'settings.resize.fit.outside': 'خارجي',

  'settings.resize.position.label': 'الموضع',
  'settings.resize.position.hint': 'أي جزء يبقيه اقتصاص التغطية، وأين يضع حشو الاحتواء الصورة.',

  'settings.resize.kernel.label': 'إعادة أخذ العينات',
  'settings.resize.kernel.hint':
    'Lanczos 3 الأكثر حدة للصور الفوتوغرافية. والأقرب مجاورةً يناسب فن البكسل.',
  'settings.resize.kernel.lanczos3': 'Lanczos 3',
  'settings.resize.kernel.lanczos2': 'Lanczos 2',
  'settings.resize.kernel.mitchell': 'Mitchell',
  'settings.resize.kernel.cubic': 'تكعيبي',
  'settings.resize.kernel.nearest': 'الأقرب مجاورة',

  'settings.resize.noEnlarge.label': 'عدم التكبير أبدًا',
  'settings.resize.noEnlarge.hint': 'يترك الصورة كما هي إن كانت أصغر من الهدف أصلًا.',
  'settings.resize.noReduce.label': 'عدم التصغير أبدًا',
  'settings.resize.noReduce.hint': 'يترك الصورة كما هي إن كانت أكبر من الهدف أصلًا.',
  'settings.resize.background.label': 'الخلفية',
  'settings.resize.background.hint':
    'يملأ المساحة التي يتركها الاحتواء. والشفافية تحتاج صيغة بقناة ألفا.',

  'settings.resize.outcome.unchanged': 'تحتفظ كل صورة بأبعادها الأصلية بالبكسل.',
  'settings.resize.outcome.missingTarget': 'لم يُحدَّد حجم هدف، فتحتفظ الصور بأبعادها الأصلية.',
  'settings.resize.outcome.exact.cover':
    'تُحجَّم كل صورة وتُقتصّ لتملأ {width} × {height} بكسل تمامًا.',
  'settings.resize.outcome.exact.contain':
    'تُلاءم كل صورة داخل {width} × {height} وتأخذ المساحة المتبقية لون الخلفية.',
  'settings.resize.outcome.exact.fill':
    'تُمدّ كل صورة إلى {width} × {height} بكسل بالضبط، متجاهلةً نسبة أبعادها.',
  'settings.resize.outcome.exact.inside':
    'تُحجَّم كل صورة لتلائم داخل {width} × {height} بكسل، فينتهي أحد ضلعيها أقصر.',
  'settings.resize.outcome.exact.outside':
    'تُحجَّم كل صورة حتى تغطي {width} × {height} بكسل، فينتهي أحد ضلعيها أطول.',
  'settings.resize.outcome.width':
    'تُحجَّم كل صورة إلى عرض {width} بكسل، ويتبع الارتفاع نسبة أبعادها.',
  'settings.resize.outcome.height':
    'تُحجَّم كل صورة إلى ارتفاع {height} بكسل، ويتبع العرض نسبة أبعادها.',
  'settings.resize.outcome.longest': 'تُحجَّم كل صورة حتى يصبح أطول ضلع فيها {value} بكسل.',
  'settings.resize.outcome.shortest': 'تُحجَّم كل صورة حتى يصبح أقصر ضلع فيها {value} بكسل.',
  'settings.resize.outcome.percentage': 'تُحجَّم كل صورة إلى {value} بالمئة من حجمها الأصلي.',
  'settings.resize.outcome.percentageBlockedReducing':
    'تُحجَّم كل صورة إلى {value} بالمئة، لكن حارس منع التصغير يمنع ذلك، فلا يتغير شيء.',
  'settings.resize.outcome.percentageBlockedEnlarging':
    'تُحجَّم كل صورة إلى {value} بالمئة، لكن حارس منع التكبير يمنع ذلك، فلا يتغير شيء.',
  'settings.resize.outcome.megapixels':
    'تُحجَّم كل صورة إلى نحو {value} ميغابكسل، مع الحفاظ على نسبة أبعادها.',
  'settings.resize.guards.both':
    'الحارسان مفعّلان معًا، وهذا يلغي تغيير الحجم ويترك كل صورة كما كانت.',
  'settings.resize.guards.noEnlarge': 'لا تُكبَّر أي صورة عن حجمها الأصلي أبدًا.',
  'settings.resize.guards.noReduce': 'لا تُصغَّر أي صورة عن حجمها الأصلي أبدًا.',
  'settings.resize.guards.free': 'المصادر الأصغر من الهدف تُكبَّر للوصول إليه.',

  /* ================================================================ */
  /* Transform section                                                 */
  /* ================================================================ */

  'settings.transform.autoOrient.label': 'اتباع اتجاه EXIF',
  'settings.transform.autoOrient.hint': 'يطبّق علامة اتجاه الكاميرا قبل أي تدوير تحدده أدناه.',
  'settings.transform.rotate.label': 'تدوير',
  'settings.transform.rotate.hint': 'باتجاه عقارب الساعة، ويُطبَّق بعد علامة الاتجاه.',
  'settings.transform.flipVertical.label': 'قلب رأسي',
  'settings.transform.flipVertical.hint': 'يعكس الصورة من الأعلى إلى الأسفل.',
  'settings.transform.flipHorizontal.label': 'قلب أفقي',
  'settings.transform.flipHorizontal.hint': 'يعكس الصورة من اليسار إلى اليمين.',

  'settings.transform.crop.title': 'الاقتصاص',
  'settings.transform.crop.enable.label': 'الاقتصاص قبل تغيير الحجم',
  'settings.transform.crop.enable.hint': 'يزيل جزءًا من المصدر قبل خطوة تغيير الحجم.',
  'settings.transform.crop.mode.label': 'الوضع',
  'settings.transform.crop.mode.manual': 'يدوي',
  'settings.transform.crop.mode.aspect': 'نسبة',
  'settings.transform.crop.mode.trim': 'قصّ الحواف',
  'settings.transform.crop.manual.hint':
    'مستطيل ثابت بوحدات بكسل المصدر بدءًا من الزاوية العلوية اليسرى، يُستخدم مع كل ملف.',
  'settings.transform.crop.offset.label': 'الإزاحة',
  'settings.transform.crop.size.label': 'الحجم',
  'settings.transform.crop.size.hint': 'القيمة 0 تمتد حتى حافة الصورة.',
  'settings.transform.crop.aspect.hint': 'يُبقي أكبر مستطيل بهذه النسبة ويتخلص من الباقي.',
  'settings.transform.crop.ratios.label': 'نسب شائعة',
  'settings.transform.crop.ratio.label': 'النسبة',
  'settings.transform.crop.ratio.hint':
    'العرض مقسومًا على الارتفاع. أكبر من 1 أفقي، وأقل من 1 عمودي.',
  'settings.transform.crop.trim.hint': 'يكتشف إطارًا شبه موحّد اللون ويقصّه.',
  'settings.transform.crop.tolerance.label': 'التسامح',
  'settings.transform.crop.tolerance.hint':
    'مقدار انحراف البكسل عن لون الزاوية مع بقائه جزءًا من الإطار.',

  'settings.transform.border.title': 'الإطار',
  'settings.transform.padding.label': 'الحشو',
  'settings.transform.padding.hint': 'إطار يُضاف بعد تغيير الحجم. يزداد الناتج بضعف هذا الرقم.',
  'settings.transform.paddingColor.label': 'لون الحشو',
  'settings.transform.paddingColor.hint':
    'الشفافية تتطلب صيغة تدعم قناة ألفا. أما JPEG فيسطّحها إلى الأسود.',

  /* ================================================================ */
  /* Adjust section                                                    */
  /* ================================================================ */

  'settings.adjust.colour.title': 'اللون',
  'settings.adjust.grayscale.label': 'تدرج رمادي',
  'settings.adjust.grayscale.hint': 'يُسقط قنوات اللون، ما يقلّص ملفات صيغ لوحة الألوان بشدة.',
  'settings.adjust.invert.label': 'عكس الألوان',
  'settings.adjust.invert.hint': 'ينتج صورة سالبة لكل قناة عدا قناة ألفا.',
  'settings.adjust.sepia.label': 'سيبيا',
  'settings.adjust.sepia.hint': 'درجة أحادية دافئة، تُطبَّق بعد أي تحويل إلى التدرج الرمادي.',
  'settings.adjust.tint.label': 'صبغة',
  'settings.adjust.tint.hint': 'يميل بالصورة نحو لون واحد مع الحفاظ على نصوعها.',
  'settings.adjust.tintColor.label': 'لون الصبغة',
  'settings.adjust.flatten.label': 'تسطيح الشفافية',
  'settings.adjust.flatten.hint': 'يدمج الصورة على لون صلب. بدونه يحوّل JPEG الشفافية إلى أسود.',
  'settings.adjust.flattenColor.label': 'لون الخلفية',

  'settings.adjust.tone.title': 'الدرجات اللونية',
  'settings.adjust.tone.hint': 'الأشرطة أدناه عند الوضع المحايد. لا يُطبَّق شيء حتى تحرّك أحدها.',
  'settings.adjust.brightness.label': 'السطوع',
  'settings.adjust.saturation.label': 'التشبّع',
  'settings.adjust.contrast.label': 'التباين',
  'settings.adjust.hue.label': 'تدوير التدرج اللوني',
  'settings.adjust.hue.hint': 'يدير كل لون حول عجلة الألوان. أبقِ القيمة صغيرة مع درجات البشرة.',
  'settings.adjust.lightness.label': 'الإضاءة',
  'settings.adjust.lightness.hint':
    'يضيف إزاحة ثابتة إلى الإضاءة. ترتفع الظلال دون إحراق المناطق الساطعة.',

  'settings.adjust.gamma.label': 'تصحيح جاما',
  'settings.adjust.gamma.hint':
    'يعيد ضبط الدرجات المتوسطة دون المساس بالأسود الخالص أو الأبيض الخالص.',
  'settings.adjust.gammaValue.label': 'جاما',
  'settings.adjust.gammaValue.hint':
    'القيمة 2.2 تطابق منحنى sRGB. الأقل يفتح الظلال، والأعلى يعمّقها.',

  'settings.adjust.normalize.label': 'تسوية المستويات',
  'settings.adjust.normalize.hint': 'يمدّ المدرّج التكراري ليصبح أغمق بكسل أسود وأفتحه أبيض.',
  'settings.adjust.normalizeLower.label': 'المئين الأدنى',
  'settings.adjust.normalizeLower.hint': 'نسبة أغمق البكسلات المسموح باقتطاعها إلى الأسود.',
  'settings.adjust.normalizeUpper.label': 'المئين الأعلى',
  'settings.adjust.normalizeUpper.hint': 'النقطة التي تُقتطع فوقها البكسلات إلى الأبيض.',

  'settings.adjust.clahe.label': 'التباين المحلي',
  'settings.adjust.clahe.hint':
    'معادلة المدرّج التكراري التكيفية محدودة التباين (CLAHE)، تُطبَّق بلاطة تلو الأخرى.',
  'settings.adjust.claheWidth.label': 'عرض البلاطة',
  'settings.adjust.claheWidth.hint':
    'البلاطات الأصغر تلتقط تفاصيل أدق لكنها أميل إلى ترك خطوط وصل.',
  'settings.adjust.claheHeight.label': 'ارتفاع البلاطة',
  'settings.adjust.claheSlope.label': 'أقصى ميل',
  'settings.adjust.claheSlope.hint': 'سقف التباين لكل بلاطة. القيمة 0 تلغي الحد وتضخّم التشويش.',

  'settings.adjust.detail.title': 'التفاصيل',
  'settings.adjust.sharpen.label': 'الإحداد',
  'settings.adjust.sharpen.hint': 'يُستحسن تفعيله عند تصغير الصور.',
  'settings.adjust.sharpenRadius.label': 'نصف القطر',
  'settings.adjust.sharpenRadius.hint':
    'عرض الحافة المكتشفة. نحو 1 يناسب الشاشات، والأعلى يناسب الطباعة.',
  'settings.adjust.sharpenFlat.label': 'قوة المناطق المسطحة',
  'settings.adjust.sharpenFlat.hint': 'شدة إبراز الحدة في المناطق الناعمة. أبقِها منخفضة.',
  'settings.adjust.sharpenEdge.label': 'قوة الحواف',
  'settings.adjust.sharpenEdge.hint': 'شدة إبراز الحدة عند الحواف الحقيقية. ارفع هذه القيمة.',
  'settings.adjust.blur.label': 'التمويه',
  'settings.adjust.blur.hint': 'تمويه غاوسي يشمل الصورة بأكملها.',
  'settings.adjust.blurRadius.label': 'نصف القطر',
  'settings.adjust.median.label': 'مرشّح الوسيط',
  'settings.adjust.median.hint': 'يستبدل كل بكسل بوسيط جيرانه، فيزيل التبقّع.',
  'settings.adjust.medianSize.label': 'حجم النافذة',
  'settings.adjust.medianSize.hint':
    'مربّع الجيران المأخوذ في الحسبان. النوافذ الأكبر تنظّف أكثر وتعمل أبطأ.',
  'settings.adjust.reset': 'إعادة تعيين التعديلات',

  /* ================================================================ */
  /* Watermark section                                                 */
  /* ================================================================ */

  'settings.watermark.kind.label': 'العلامة المائية',
  'settings.watermark.kind.text': 'نص',
  'settings.watermark.kind.textTooltip': 'ارسم سطر نص فوق كل صورة',
  'settings.watermark.kind.image': 'صورة',
  'settings.watermark.kind.imageTooltip': 'ركّب شعارًا أو شارة فوق كل صورة',
  'settings.watermark.none.hint': 'لا يُطبع أي شيء على الناتج.',

  'settings.watermark.text.label': 'النص',
  'settings.watermark.text.placeholder': 'مثلًا PROOF أو اسم الاستوديو',
  'settings.watermark.fontSize.label': 'حجم الخط',
  'settings.watermark.fontSize.hint': 'بالبكسل، مقيسة على دقة الناتج.',
  'settings.watermark.font.label': 'الخط',
  'settings.watermark.colour.label': 'اللون',
  'settings.watermark.colour.hint': 'الشفافية تأتي من شريط العتامة، لا من هنا.',

  'settings.watermark.image.label': 'صورة العلامة المائية',
  'settings.watermark.image.hint': 'ملف PNG بخلفية شفافة يندمج بنظافة عند أي درجة عتامة.',
  'settings.watermark.image.choose': 'اختيار صورة',
  'settings.watermark.image.change': 'اختيار صورة أخرى',
  'settings.watermark.image.remove': 'إزالة صورة العلامة المائية',

  'settings.watermark.position.label': 'الموضع',
  'settings.watermark.position.hint': 'موضع الختم عند تعطيل التبليط.',
  'settings.watermark.opacity.label': 'العتامة',
  'settings.watermark.scale.label': 'الحجم',
  'settings.watermark.scale.hint': 'عرض العلامة المائية كنسبة مئوية من عرض الناتج.',
  'settings.watermark.margins.label': 'الهوامش',
  'settings.watermark.margins.hint': 'المسافة من الحافة المختارة، بالبكسل.',
  'settings.watermark.margins.horizontal': 'الهامش الأفقي بالبكسل',
  'settings.watermark.margins.vertical': 'الهامش الرأسي بالبكسل',
  'settings.watermark.rotation.label': 'التدوير',
  'settings.watermark.rotation.hint': 'القيم السالبة تدور عكس عقارب الساعة.',
  'settings.watermark.tile.label': 'التبليط عبر الصورة',
  'settings.watermark.tile.hint': 'يكرّر العلامة المائية من حافة إلى حافة بدل وضعها مرة واحدة.',

  /* ================================================================ */
  /* Metadata section                                                  */
  /* ================================================================ */

  'settings.metadata.policy.label': 'ما يُحتفظ به',
  'settings.metadata.policy.strip': 'تجريد',
  'settings.metadata.policy.stripTooltip': 'إزالة كل وسم',
  'settings.metadata.policy.stripHint':
    'يزيل كل الوسوم، بما فيها إحداثيات GPS التي تسجّل مكان التقاط الصورة.',
  'settings.metadata.policy.keep': 'إبقاء الكل',
  'settings.metadata.policy.keepTooltip': 'الإبقاء على كل شيء، بما فيه موقع GPS',
  'settings.metadata.policy.keepHint':
    'ينقل كل الوسوم: الكاميرا والطوابع الزمنية وسجل التحرير وموقع GPS. آمن فقط للملفات التي تبقى لديك.',
  'settings.metadata.policy.icc': 'ICC فقط',
  'settings.metadata.policy.iccTooltip': 'الإبقاء على الملف اللوني وحده',
  'settings.metadata.policy.iccHint':
    'يحتفظ بملف تعريف الألوان ويُسقط ما عداه. لا تبقى أي بيانات موقع أو كاميرا.',
  'settings.metadata.policy.rights': 'الحقوق',
  'settings.metadata.policy.rightsTooltip': 'الإبقاء على الملف اللوني وحقوق النشر واسم الفنان',
  'settings.metadata.policy.rightsHint':
    'يحتفظ بملف تعريف الألوان وبحقلي حقوق النشر والمؤلف. ويظل موقع GPS مُزالًا.',

  'settings.metadata.density.label': 'تجاوز قيمة الدقة',
  'settings.metadata.density.hint':
    'يعيد كتابة قيمة DPI في الملف. تقرؤها المطابع وتتجاهلها المتصفحات.',
  'settings.metadata.density.blocked':
    'متاح فقط مع خيار الاحتفاظ بالكل، أو عند الكتابة بصيغة TIFF. في غير ذلك ستؤدي كتابته إلى إعادة الوسوم التي تزيلها هذه السياسة.',
  'settings.metadata.resolution.label': 'الدقة',
  'settings.metadata.resolution.aria': 'دقة الإخراج بالنقطة في البوصة',

  'settings.metadata.icc.label': 'ملف ICC اللوني',
  'settings.metadata.icc.hint': 'اسم ملف تعريف مثل srgb أو p3، أو مسار إلى ملف .icc.',
  'settings.metadata.icc.placeholder': 'srgb',
  'settings.metadata.copyright.label': 'حقوق النشر',
  'settings.metadata.copyright.placeholder': 'حقوق النشر 2026 استوديوك',
  'settings.metadata.artist.label': 'الفنان',
  'settings.metadata.artist.placeholder': 'اسمك',
  'settings.metadata.strippedNote':
    'حقوق النشر والمؤلف معطّلان لأن السياسة الحالية تزيل كل الوسوم. بدّل إلى الحقوق لكتابتهما.',

  /* ================================================================ */
  /* Output section                                                    */
  /* ================================================================ */

  'settings.output.target.label': 'الكتابة إلى',
  'settings.output.target.folder': 'مجلد',
  'settings.output.target.folderTooltip': 'الكتابة داخل مجلد تختاره',
  'settings.output.target.zip': 'أرشيف ZIP',
  'settings.output.target.zipTooltip': 'جمع كل الناتج في أرشيف واحد',
  'settings.output.target.inPlace': 'في المكان',
  'settings.output.target.inPlaceTooltip': 'الكتابة بجوار كل ملف أصلي',
  'settings.output.inPlace.title': 'ستُستبدل الملفات الأصلية',
  'settings.output.inPlace.body':
    'يُستبدل كل ملف مصدر بنسخته المحوّلة. لا شيء يصل إلى سلة المحذوفات، فخُذ نسخة احتياطية أولًا.',

  'settings.output.folder.label': 'مجلد الوجهة',
  'settings.output.folder.choose': 'اختيار مجلد',
  'settings.output.folder.change': 'اختيار مجلد آخر',
  'settings.output.folder.empty': 'لم يُختَر مجلد بعد.',
  'settings.output.archive.label': 'ملف الأرشيف',
  'settings.output.archive.choose': 'اختيار أرشيف',
  'settings.output.archive.change': 'اختيار أرشيف آخر',
  'settings.output.archive.empty': 'لم يُختَر مسار أرشيف بعد.',

  'settings.output.structure.label': 'بنية المجلدات',
  'settings.output.structure.flat': 'مسطّحة',
  'settings.output.structure.flatDescription':
    'كل شيء يصل إلى الوجهة، أيًا كان المجلد الذي أتى منه.',
  'settings.output.structure.flatHint':
    'كل ملف يصل مباشرة إلى مجلد الوجهة. الأسماء المكرّرة تخضع لقاعدة التعارض أدناه.',
  'settings.output.structure.mirror': 'محاكاة شجرة المصدر',
  'settings.output.structure.mirrorDescription': 'يعيد إنشاء بنية مجلدات المصادر.',
  'settings.output.structure.mirrorHint':
    'تُعاد شجرة مجلدات المصدر داخل الوجهة، فتظل المسارات النسبية صالحة.',
  'settings.output.structure.byFormat': 'مجلد لكل صيغة',
  'settings.output.structure.byFormatDescription': 'يجمّع الناتج في مجلد فرعي لكل صيغة.',
  'settings.output.structure.byFormatHint': 'يُجمَّع الناتج في مجلد فرعي يحمل اسم صيغته.',
  'settings.output.structure.byDate': 'مجلد لكل تاريخ',
  'settings.output.structure.byDateDescription': 'يجمّع الناتج في مجلد فرعي لكل تاريخ تشغيل.',
  'settings.output.structure.byDateHint': 'يُجمَّع الناتج في مجلد فرعي يحمل تاريخ التشغيل.',

  'settings.output.collision.label': 'إذا كان الملف موجودًا بالفعل',
  'settings.output.collision.rename': 'إعادة تسمية',
  'settings.output.collision.renameHint':
    'يُضاف عدّاد إلى الاسم، فلا يُمَسّ الملف الموجود إطلاقًا.',
  'settings.output.collision.overwrite': 'استبدال',
  'settings.output.collision.overwriteHint':
    'يُستبدل كل ما هو موجود في ذلك المسار. لا تراجع عن ذلك ولا شيء يصل إلى سلة المحذوفات.',
  'settings.output.collision.skip': 'تخطي',
  'settings.output.collision.skipHint':
    'يُترك الملف الموجود كما هو، وتُسجَّل الصورة كمتخطّاة في الملخص.',

  'settings.output.template.label': 'قالب اسم الملف',
  'settings.output.template.help':
    'الرمز غير المعروف يبقى في الاسم بدل حذفه، فيظهر الخطأ المطبعي في المعاينة.',
  'settings.output.template.placeholder': '{name}',
  'settings.output.template.example': 'مثال',
  'settings.output.template.firstFile': 'أول ملف',

  'settings.output.token.name': 'اسم الملف الأصلي بدون امتداده',
  'settings.output.token.ext': 'امتداد ملف الناتج',
  'settings.output.token.format': 'معرّف صيغة الناتج، مثل webp',
  'settings.output.token.index': 'الموضع في الطابور مع أصفار بادئة',
  'settings.output.token.total': 'إجمالي عدد الملفات في العملية',
  'settings.output.token.width': 'عرض الناتج بالبكسل',
  'settings.output.token.height': 'ارتفاع الناتج بالبكسل',
  'settings.output.token.quality': 'قيمة الجودة المستخدمة لهذا الملف',
  'settings.output.token.preset': 'اسم الإعداد المسبق النشط',
  'settings.output.token.variant': 'لاحقة إصدار الحجم الحالي',
  'settings.output.token.parent': 'اسم المجلد الذي جاء منه المصدر',
  'settings.output.token.date': 'تاريخ العملية بترتيب السنة والشهر واليوم (YYYYMMDD)',
  'settings.output.token.time': 'وقت العملية بترتيب الساعة والدقيقة والثانية (HHMMSS)',
  'settings.output.token.random': 'ستة أحرف عشوائية',

  'settings.output.case.label': 'حالة الأحرف',
  'settings.output.case.none': 'كما هي مكتوبة',
  'settings.output.case.lower': 'أحرف صغيرة',
  'settings.output.case.upper': 'أحرف كبيرة',
  'settings.output.case.kebab': 'kebab-case',
  'settings.output.case.snake': 'snake_case',

  'settings.output.sanitize.label': 'تنظيف أسماء الملفات',
  'settings.output.sanitize.hint':
    'يستبدل ما ترفضه Windows وmacOS، إضافة إلى النقاط والمسافات في نهاية الاسم.',
  'settings.output.skipIfLarger.label': 'الإبقاء على الأصل حين يكون أصغر',
  'settings.output.skipIfLarger.hint': 'يُبقي ملف المصدر عندما يكون الملف المحوّل أكبر حجمًا.',

  'settings.output.zipLevel.label': 'ضغط الأرشيف',
  'settings.output.zipLevel.hint':
    'الصور المُرمَّزة لا تكاد تُضغط ثانيةً، لذا تخزّنها القيمة 0 كما هي.',
  'settings.output.zipLevel.store': 'تخزين',
  'settings.output.zipLevel.max': 'أقصى',

  'settings.output.report.label': 'كتابة تقرير CSV',
  'settings.output.report.hint':
    'يحفظ جدول بيانات بصف لكل صورة: المسارات والأحجام والتوفير والأخطاء.',
  'settings.output.noFolderNote': 'لا يمكن بدء التشغيل قبل تحديد مجلد الوجهة.',

  /* ================================================================ */
  /* Variants section                                                  */
  /* ================================================================ */

  'settings.variants.intro':
    'تكتب المتغيرات أحجامًا إضافية من فك ترميز واحد: أضف 480 و960 و1440 لإنشاء srcset متجاوب. ويتبع خيار الوراثة الإعدادات الرئيسية.',
  'settings.variants.empty': 'لا إصدارات بعد. تكتب العملية ملفًا واحدًا لكل مصدر بالإعدادات أعلاه.',
  'settings.variants.add': 'إضافة إصدار',
  'settings.variants.remove': 'إزالة هذا الإصدار',
  'settings.variants.removeNamed': 'إزالة {label}',
  'settings.variants.defaultLabel': 'إصدار {index}',
  'settings.variants.enable.label': 'تضمينه في العملية',
  'settings.variants.name.label': 'الاسم',
  'settings.variants.name.hint': 'يظهر في الطابور وفي تقرير العملية.',
  'settings.variants.name.placeholder': 'صورة مصغّرة',
  'settings.variants.formatQuality.label': 'الصيغة والجودة',
  'settings.variants.format.inherit': 'موروث',
  'settings.variants.format.source': 'مثل المصدر',
  'settings.variants.format.aria': 'صيغة إخراج الإصدار',
  'settings.variants.quality.aria': 'جودة الإصدار',
  'settings.variants.size.label': 'الحجم',
  'settings.variants.strategy.none': 'الحجم نفسه كالناتج الرئيسي',
  'settings.variants.strategy.width': 'عرض ثابت',
  'settings.variants.strategy.height': 'ارتفاع ثابت',
  'settings.variants.strategy.longest': 'أطول ضلع',
  'settings.variants.strategy.percentage': 'نسبة من المصدر',
  'settings.variants.strategy.aria': 'أسلوب تغيير حجم الإصدار',
  'settings.variants.value.aria': 'الحجم الهدف للإصدار',
  'settings.variants.suffix.label': 'لاحقة اسم الملف',
  'settings.variants.suffix.hint': 'تُضاف إلى الاسم قبل الامتداد.',
  'settings.variants.suffix.placeholder': '-960w',
  'settings.variants.problem.empty':
    'اللاحقة الفارغة تطابق اسم ملف الناتج الرئيسي، فيستبدل أحدهما الآخر.',
  'settings.variants.problem.duplicate':
    'هناك متغير آخر يستخدم هذه اللاحقة. كلاهما يكتب الاسم نفسه والأخير هو الذي يبقى.',

  /* ================================================================ */
  /* Smart section                                                     */
  /* ================================================================ */

  'settings.smart.sizeTarget.label': 'هدف الحجم',
  'settings.smart.sizeTarget.off': 'معطّل',
  'settings.smart.sizeTarget.offTooltip': 'ترميز واحد بالجودة المختارة',
  'settings.smart.sizeTarget.offHint':
    'تُرمَّز كل صورة مرة واحدة بالجودة التي اخترتها، أيًا كان الحجم الناتج.',
  'settings.smart.sizeTarget.max': 'البقاء تحت',
  'settings.smart.sizeTarget.maxTooltip': 'التعامل مع الميزانية كسقف صارم',
  'settings.smart.sizeTarget.maxHint':
    'لا يتجاوز الناتج الميزانية أبدًا؛ وتنخفض الجودة حتى الحد الأدنى للنطاق.',
  'settings.smart.sizeTarget.aim': 'الاقتراب من',
  'settings.smart.sizeTarget.aimTooltip': 'الوصول إلى أقرب نقطة ممكنة من الميزانية',
  'settings.smart.sizeTarget.aimHint': 'يقترب الناتج من الميزانية قدر الإمكان من أي من الجهتين.',

  'settings.smart.budget.label': 'الميزانية لكل صورة',
  'settings.smart.budget.hint': '{size} لكل ملف في التشغيل.',
  'settings.smart.budget.aria': 'ميزانية الحجم لكل صورة بالكيلوبايت',
  'settings.smart.quality.label': 'مدى الجودة',
  'settings.smart.quality.hint': 'لا يجرّب البحث إلا الجودات داخل هذه النافذة.',
  'settings.smart.searchNote':
    'تُرمَّز كل صورة عدة مرات، مع تنصيف نافذة الجودة في كل جولة، إلى أن يتوافق الناتج مع الميزانية.',
  'settings.smart.slow.title': 'هذا يجعل العملية أبطأ عدة أضعاف',
  'settings.smart.slow.body':
    'توقّع من أربع إلى سبع عمليات ترميز لكل صورة بدل واحدة. وقد تستغرق دفعة AVIF كبيرة ما يقارب الساعة.',
  'settings.smart.autoFormat.label': 'اختيار الصيغة لكل صورة',
  'settings.smart.autoFormat.hint':
    'يكتب الرسومات المسطحة ولقطات الشاشة بصيغة PNG، والصور الفوتوغرافية بالصيغة التي اخترتها.',
  'settings.smart.autoPalette.label': 'النزول إلى لوحة ألوان حين يكون بلا كلفة',
  'settings.smart.autoPalette.hint':
    'ينتقل إلى الألوان المفهرسة عندما تحتوي الصورة على ألوان قليلة بما يكفي.',

  /* ================================================================ */
  /* Performance section                                               */
  /* ================================================================ */

  'settings.performance.backend.label': 'محرك المعالجة',
  'settings.performance.backend.auto': 'تلقائي',
  'settings.performance.backend.autoTooltip': 'استخدام كل مسار يوفره الجهاز',
  'settings.performance.backend.autoHint':
    'تسلك كل صورة المسار المتاح، سواء GPU أو تجمّع عمّال sharp.',
  'settings.performance.backend.gpuTooltip': 'تفضيل مسارات GPU حيثما أمكن',
  'settings.performance.backend.gpuHint':
    'يفضّل مسارات GPU، ويعود إلى sharp عندما يعجز المُهايئ عن التعامل.',
  'settings.performance.backend.gpuMissing': 'لم يُعثر على مهايئ GPU صالح للاستخدام',
  'settings.performance.backend.cpuTooltip': 'تشغيل كل شيء عبر عمّال sharp',
  'settings.performance.backend.cpuHint': 'يتجاهل GPU ويشغّل الدفعة عبر تجمّع عمّال sharp.',

  'settings.performance.probePending': 'تظهر تفاصيل المهايئ بعد انتهاء فحص GPU.',
  'settings.performance.gpuUnavailable.title': 'تسريع GPU غير متاح',
  'settings.performance.gpuUnavailable.body':
    'لم يستجب أي مُهايئ لفحص القدرات، لذا تُعالَج كل صورة على CPU.',

  'settings.performance.adapters.label': 'المهايئات',
  'settings.performance.adapter.unnamed': 'مهايئ بلا اسم',
  'settings.performance.adapter.active': 'نشط',
  'settings.performance.adapter.discrete': 'منفصل',
  'settings.performance.adapter.integrated': 'مدمج',
  'settings.performance.adapter.software': 'برمجي',
  'settings.performance.adapter.maxTexture': 'أقصى نسيج {value} px',

  'settings.performance.preferDiscrete.label': 'تفضيل المهايئ المنفصل',
  'settings.performance.preferDiscrete.hint': 'يرسل العمل إلى البطاقة المنفصلة بدل المدمجة.',
  'settings.performance.useAllGpus.label': 'استخدام كل المهايئات معًا',
  'settings.performance.useAllGpus.hint': 'يفتح مسارًا لكل مُهايئ بدل المُهايئ المفضّل وحده.',
  'settings.performance.gpuAssist.label': 'الترميز بمساعدة GPU',
  'settings.performance.gpuAssist.hint':
    'يتولى GPU تغيير الحجم والمرشحات؛ ويكتب sharp صيغ AVIF وTIFF وJPEG XL.',

  'settings.performance.workers.label': 'الخيوط العاملة',
  'settings.performance.workers.hint':
    'عدد الصور المُرمَّزة في وقت واحد. القيمة 0 تترك الاختيار لـ BICO من بين {cores} نواة منطقية.',
  'settings.performance.workers.hintUnknown':
    'عدد الصور المُرمَّزة في وقت واحد. القيمة 0 تترك الاختيار لـ BICO حسب عدد الأنوية.',
  'settings.performance.workers.auto': 'تلقائي',
  'settings.performance.vips.label': 'الخيوط داخل كل عامل',
  'settings.performance.vips.hint':
    'عدد الخيوط التي يستخدمها libvips على صورة واحدة. القيمة 0 تترك القرار لـ libvips.',
  'settings.performance.cache.label': 'ذاكرة العمليات المؤقتة',
  'settings.performance.cache.hint': 'الذاكرة التي يجوز لـ libvips الاحتفاظ بها للنتائج الوسيطة.',
  'settings.performance.maxPixels.label': 'حد البكسلات',
  'settings.performance.maxPixels.hint':
    'الصور التي يزيد عدد بكسلاتها بعد فك الترميز عن هذا الحد تُرفض ولا تُحمَّل.',
  'settings.performance.maxPixels.aria': 'أقصى حجم بعد فك الترميز بالميغابكسل',
  'settings.performance.megapixels': 'MP',

  /* ================================================================== */
  /* About                                                               */
  /* ================================================================== */

  'about.title': 'عن BICO',
  'about.tab.about': 'نبذة',
  'about.tab.formats': 'الصيغ',
  'about.tab.credits': 'شكر وتقدير',

  'about.hero.logoAlt': 'أيقونة تطبيق BICO',
  'about.build.version': 'الإصدار {version}',
  'about.build.platform': '{platform} {arch}',
  'about.build.built': 'بُني في {date}',
  'about.build.reading': 'جارٍ قراءة معلومات البناء',
  'about.platform.windows': 'Windows',
  'about.platform.macos': 'macOS',
  'about.platform.linux': 'Linux',

  'about.intro':
    'يحوّل BICO الصور ويحسّنها بالجملة على جهازك. لا يُرفع شيء، وتبقى الأصول دون مساس ما لم تطلب غير ذلك.',

  'about.section.highlights': 'الجديد في هذا الإصدار',
  'about.highlight.pipeline':
    'مسار sharp متعدد الخيوط يبقي النافذة مستجيبة بينما تُرمَّز آلاف الملفات.',
  'about.highlight.gpu': 'معالجة GPU اختيارية توزّع فك الترميز وتغيير الحجم والترميز على كل مهايئ.',
  'about.highlight.formats': 'ثماني صيغ إخراج، منها ترميز JPEG XL مرفق مع التطبيق.',
  'about.highlight.preview':
    'معاينة حية قبل وبعد بالصيغة الهدف الحقيقية، فتحكم على العيوب الحقيقية.',
  'about.highlight.sizeTarget':
    'استهداف الحجم الذي يبحث في مدى الجودة حتى يدخل كل ملف ضمن ميزانية بالبايت.',
  'about.highlight.variants': 'توليد إصدارات متجاوبة، ينتج srcset كاملًا من فك ترميز واحد.',
  'about.highlight.watch': 'أتمتة المجلد الساخن التي تحوّل الصور الجديدة لحظة وصولها إلى القرص.',

  'about.section.links': 'روابط',
  'about.link.repository': 'المستودع',
  'about.link.issues': 'الإبلاغ عن مشكلة',
  'about.link.author': 'صفحة المؤلف',
  'about.link.sponsor': 'ادعمني بقهوة',
  'about.licence': 'يصدر بترخيص MIT. كتبه ويصونه Muhammad Sheharyar Butt.',

  'about.formats.allAvailable': 'كل صيغة أدناه متاحة في هذه النسخة',
  'about.formats.missingOne': 'صيغة واحدة لا تستطيع هذه النسخة كتابتها',
  'about.formats.missingMany': '{count} صيغ لا تستطيع هذه النسخة كتابتها',
  'about.formats.note':
    'يعرض التوفر ما حلّته هذه النسخة عند الإقلاع، لذا تظهر الصيغ غير المتاحة باهتة. وJPEG XL مرفق كنسخة WebAssembly من libjxl.',
  'about.formats.column.format': 'الصيغة',
  'about.formats.column.bestFor': 'الأنسب لـ',
  'about.formats.column.capabilities': 'القدرات',
  'about.formats.column.availability': 'هذه النسخة',

  'about.capability.quality': 'الجودة',
  'about.capability.lossless': 'بلا فقد',
  'about.capability.alpha': 'ألفا',
  'about.capability.animation': 'حركة',
  'about.capability.progressive': 'تدريجي',
  'about.capability.chroma': 'كروما',
  'about.capability.hdr': 'HDR',
  'about.capability.metadata': 'بيانات وصفية',
  'about.capability.effort': 'الجهد من {min} إلى {max}',
  'about.capability.gpuEncode': 'ترميز على GPU',

  'about.availability.notReported': 'غير مُبلَّغ عنه',
  'about.availability.reads': 'قراءة',
  'about.availability.noDecoder': 'بلا فاكّ ترميز',
  'about.availability.writes': 'كتابة',
  'about.availability.noEncoder': 'بلا مُرمِّز',

  'about.credits.intro': 'هذه هي المشاريع التي يعتمد عليها BICO، بالإصدارات العاملة في هذه اللحظة.',
  'about.credits.visit': 'زيارة',
  'about.credits.versionUnknown': 'الإصدار غير مُبلَّغ عنه',
  'about.credits.footer':
    'أيقونات Ant Design وخط Inter وسلسلة أدوات Electron builder تكمل القائمة. وكلها تصدر بتراخيص متساهلة، وكذلك BICO.',
  'about.credits.libvips': 'مكتبة معالجة الصور التدفقية التي يمر بها كل تحويل فعليًا.',
  'about.credits.sharp': 'ربط Node الذي يقود libvips من داخل الخيوط العاملة.',
  'about.credits.electron': 'بيئة سطح المكتب وراء نافذة BICO الأصيلة ووصوله إلى نظام الملفات.',
  'about.credits.chromium': 'المحرك الذي يرسم الواجهة ويستضيف مسارات GPU.',
  'about.credits.react': 'نموذج المكوّنات الذي كُتبت به الواجهة كلها.',
  'about.credits.antd': 'مكتبة المكوّنات ورموز التصميم التي تُنسَّق بها الواجهة.',
  'about.credits.webgpu':
    'طبقة الحوسبة التي تستخدمها مسارات GPU لفك الترميز وتغيير الحجم والترميز.',
  'about.credits.plex':
    'الخط المستخدم في الواجهة كلها، بما فيها العربية، بترخيص SIL Open Font License.',
  'about.credits.gpuNone': 'لم يُكتشف أي مهايئ على هذا الجهاز',
  'about.credits.gpuOne': 'اكتُشف مهايئ واحد',
  'about.credits.gpuMany': 'اكتُشف {count} مهايئ',

  /* ================================================================== */
  /* History                                                             */
  /* ================================================================== */

  'history.title': 'سجل العمليات',
  'history.action.refresh': 'تحديث',
  'history.action.seeFailures': 'عرض ما فشل',
  'history.clear.confirmTitle': 'مسح سجل العمليات؟',
  'history.clear.confirmBody': 'تُزال الملخصات. ولا تُمسّ الملفات المحوَّلة.',
  'history.clear.confirmOk': 'مسح',
  'history.clear.confirmCancel': 'إبقاء',
  'history.toast.cleared': 'مُسح سجل العمليات.',
  'history.toast.clearFailed': 'تعذّر مسح ملف السجل.',
  'history.toast.noLocation': 'لم تسجّل هذه العملية موقع إخراج.',

  'history.empty':
    'لا عمليات مسجلة بعد. تُسجَّل التحويلات المنتهية هنا مع التوفير ومجلد الإخراج والمدة.',

  'history.summary.runs': 'العمليات المسجلة',
  'history.summary.images': 'الصور المحوَّلة',
  'history.summary.saved': 'إجمالي التوفير',

  'history.finishTimeUnknown': 'وقت الانتهاء غير مسجل',
  'history.formatOriginal': 'مثل المصدر',
  'history.preset': 'إعداد مسبق {name}',
  'history.presetCustom': 'مخصص',

  'history.tag.processed': '{count} معالَجة',
  'history.tag.failed': '{count} فاشلة',
  'history.tag.skipped': '{count} متخطّاة',
  'history.tag.stoppedEarly': 'توقفت مبكرًا',
  'history.tag.onGpu': '{count} على GPU',
  'history.tag.onCpu': '{count} على CPU',

  'history.field.saved': 'المُوفَّر',
  'history.field.size': 'الحجم',
  'history.field.location': 'الموقع',
  'history.savedPercent': '({percent} بالمئة)',
  'history.sizeChange': 'من {before} إلى {after}',
  'history.notRecorded': 'غير مسجل',

  'history.open.folder': 'فتح مجلد الإخراج',
  'history.open.zip': 'فتح الأرشيف',
  'history.open.inPlace': 'فتح مجلد المصدر',
  'history.open.report': 'فتح تقرير CSV',

  'history.errors.titleOne': 'فشل ملف واحد',
  'history.errors.titleMany': 'فشل {count} ملف',

  /* ================================================================== */
  /* Preview                                                             */
  /* ================================================================== */

  'preview.title': 'معاينة حية',
  'preview.empty': 'اختر صورة من الطابور لمعاينة كيف ستُحوَّل.',
  'preview.dimensions': '{width} × {height} بكسل',
  'preview.dimensionsPending': 'ما زالت الأبعاد قيد القراءة',
  'preview.tag.alpha': 'تحتوي شفافية',
  'preview.tag.animated': 'متحركة',

  'preview.error.title': 'تعذّرت معاينة هذه الصورة',
  'preview.formatOriginal': 'مثل المصدر',

  'preview.fallback.title': 'تُعرض بصيغة {shown} لا {requested}',
  'preview.fallback.body':
    '{reason} البكسلات أدناه دقيقة، لكن الأحجام من الحاوية البديلة لا من الصيغة الحقيقية.',

  'preview.field.originalSize': 'الحجم الأصلي',
  'preview.field.estimatedOutput': 'الناتج المقدَّر',
  'preview.field.change': 'التغير',
  'preview.field.outputFormat': 'صيغة الإخراج',
  'preview.field.render': 'رسم المعاينة',

  'preview.change.smaller': 'أصغر بنسبة {percent} بالمئة',
  'preview.change.larger': 'أكبر بنسبة {percent} بالمئة',
  'preview.renderDetail': '{width} × {height} في {duration}',

  'preview.estimateNote':
    'تُرسم المعاينة بدقة مخفّضة ويُستقرأ منها الحجم، فعاملها كدليل لا كعدد بايتات دقيق.',
  'preview.rerendering': 'إعادة الرسم بالإعدادات التي غيّرتها للتو.',

  /* ================================================================== */
  /* Watch folder                                                        */
  /* ================================================================== */

  'watch.title': 'مجلد المراقبة',
  'watch.formatOriginal': 'صيغة المصدر',
  'watch.intro.title': 'الملفات المُفلَتة في المجلد المراقَب تُحوَّل تلقائيًا.',
  'watch.intro.body':
    'تُلتقط الإعدادات عند ضغطك على ابدأ وتبقى ثابتة، فتُكتب الملفات اللاحقة بصيغة {format} حتى لو غيّرت الشريط الجانبي.',

  'watch.action.choose': 'اختيار',
  'watch.action.start': 'بدء المراقبة',
  'watch.action.stop': 'إيقاف',

  'watch.folder.label': 'المجلد المراقَب',
  'watch.folder.hint': 'تُضاف الصور الجديدة هنا إلى الطابور وتُحوَّل واحدة تلو الأخرى.',
  'watch.folder.placeholder': 'لم يُختَر مجلد بعد',

  'watch.recursive.label': 'تضمين المجلدات الفرعية',
  'watch.recursive.hint': 'يراقب أيضًا كل مجلد داخل المجلد أعلاه.',

  'watch.settle.label': 'مهلة الاستقرار',
  'watch.settle.hint': 'المدة التي يجب أن يبقى فيها حجم الملف دون تغير قبل اعتباره مكتملًا.',

  'watch.move.label': 'نقل الأصول إلى',
  'watch.move.hint': 'يُنقل كل ملف مصدر إلى هنا بمجرد وجود نسخته المحوَّلة.',
  'watch.move.placeholder': 'اترك الأصول في مكانها',

  'watch.delete.label': 'حذف الأصول بعد التحويل',
  'watch.delete.hint': 'يحذف كل ملف مصدر نهائيًا بمجرد كتابة نسخته.',
  'watch.delete.hintMoving': 'غير متاح أثناء نقل الأصول إلى مجلد آخر.',
  'watch.delete.confirmTitle': 'حذف كل ملف أصلي بعد تحويله؟',
  'watch.delete.confirmBody':
    'يُحذف كل ملف مصدر بمجرد كتابة نسخته المحوَّلة. ولا تراجع عن ذلك ولا يذهب شيء إلى سلة المحذوفات.',
  'watch.delete.confirmOk': 'حذف الأصول',
  'watch.delete.confirmCancel': 'إبقاء الأصول',
  'watch.delete.warningTitle': 'ستُحذف الملفات الأصلية',
  'watch.delete.warningBody': 'كل صورة يحوّلها هذا المراقب تُحذف من المجلد المراقَب بعدها.',

  'watch.toast.needFolder': 'اختر مجلدًا للمراقبة أولًا.',
  'watch.toast.needOutput': 'اختر مجلد إخراج في الشريط الجانبي قبل المراقبة.',
  'watch.toast.started': 'بدأت المراقبة.',
  'watch.toast.stopped': 'توقفت المراقبة.',

  'watch.status.title': 'الحالة',
  'watch.status.state': 'الوضع',
  'watch.status.running': 'قيد المراقبة',
  'watch.status.idle': 'خامل',
  'watch.status.folder': 'المجلد',
  'watch.status.noFolder': 'لم يُختَر شيء',
  'watch.status.seen': 'الملفات المرصودة',
  'watch.status.processed': 'الملفات المحوَّلة',
  'watch.status.lastEvent': 'آخر حدث',
  'watch.status.noEvent': 'لم يحدث شيء بعد',
  'watch.status.errorTitle': 'أبلغ المراقب عن مشكلة',
  'watch.status.locked': 'الإعدادات مقفلة أثناء المراقبة. أوقفها أولًا إن احتجت إلى تغييرها.',

  /* ================================================================== */
  /* Lifetime statistics                                                 */
  /* ================================================================== */

  'stats.title': 'إحصاءات تراكمية',
  'stats.since': 'العدّ على هذا الحاسوب منذ {date}.',
  'stats.sinceUnknown': 'العدّ على هذا الحاسوب عبر كل عملية أنهيتها.',

  'stats.action.refresh': 'تحديث',
  'stats.action.reset': 'إعادة تعيين',

  'stats.reset.title': 'محو كل العدادات التراكمية؟',
  'stats.reset.description':
    'يحذف نهائيًا الإجماليات ومخطط التسعين يومًا وأفضل تشغيل. لا يمكن التراجع عن هذا. أما صورك وسجل عمليات التشغيل فتبقى دون تغيير.',
  'stats.reset.ok': 'امحُها',
  'stats.reset.cancel': 'أبقِها',
  'stats.reset.done': 'عادت كل العدادات التراكمية إلى الصفر.',
  'stats.reset.failed': 'تعذّرت إعادة تعيين العدادات.',
  'stats.load.failed': 'تعذّرت قراءة الإحصاءات من القرص.',

  'stats.empty.title': 'لا شيء مُحصى بعد',
  'stats.empty.description':
    'تظهر الإجماليات بعد انتهاء أول تشغيل: الصور المكتوبة والبايتات الموفّرة والوقت المستغرق والمحرك المستخدم.',

  'stats.headline.images': 'الصور المحوَّلة',
  'stats.headline.imagesOne': 'صورة محوَّلة',
  'stats.headline.saved': 'المساحة الموفَّرة',
  'stats.headline.added': 'المساحة المضافة',
  'stats.headline.time': 'وقت التحويل',
  'stats.headline.runs': 'العمليات المنتهية',
  'stats.headline.runsOne': 'عملية منتهية',

  'stats.activity.title': 'النشاط',
  'stats.activity.hint': 'الصور المنجزة في كل يوم من الأيام التسعين الماضية.',
  'stats.activity.chart':
    'الصور المحوّلة يوميًا خلال الأيام التسعين الماضية. أكثر الأيام نشاطًا {date} بواقع {images} صورة، و{total} خلال المدة كاملة.',
  'stats.activity.chartQuiet':
    'الصور المحوّلة يوميًا خلال الأيام التسعين الماضية. لم يُحوَّل أي شيء.',
  'stats.activity.peak': 'أكثر الأيام ازدحامًا {date}، {images} صورة',
  'stats.activity.peakOne': 'أكثر الأيام ازدحامًا {date}، صورة واحدة',
  'stats.activity.quiet': 'لم يُحوَّل شيء في آخر تسعين يومًا',
  'stats.activity.windowTotal': '{images} في هذه النافذة',

  'stats.formats.title': 'صيغ الإخراج',
  'stats.formats.hint': 'الصور المكتوبة حسب الصيغة، مع ما وفّرته كل صيغة مقارنة بالأصول.',
  'stats.formats.original': 'مثل المصدر',
  'stats.formats.images': '{images} صورة',
  'stats.formats.imagesOne': 'صورة واحدة',
  'stats.formats.saved': 'وفّرت {bytes}',
  'stats.formats.added': 'أضافت {bytes}',
  'stats.formats.bar': '{format}، كُتبت {images} صورة، {saved}.',
  'stats.formats.empty': 'لم تُكتب أي صيغة إخراج بعد.',

  'stats.backend.title': 'GPU مقابل CPU',
  'stats.backend.hint': 'المحرك الذي نفّذ العمل على كل ملف.',
  'stats.backend.chart': 'انتهت {gpu} صورة على GPU و{cpu} على CPU، بحصة GPU تبلغ {share}.',
  'stats.backend.centre': 'على GPU',
  'stats.backend.empty': 'لم تُنسب أي صورة إلى محرك بعد.',
  'stats.backend.images': '{images} صورة',

  'stats.best.title': 'أفضل عملية',
  'stats.best.saved': 'وفّرت {bytes}',
  'stats.best.detail': '{images} صورة كُتبت بصيغة {format} في {date}',
  'stats.best.detailOne': 'صورة واحدة كُتبت بصيغة {format} في {date}',
  'stats.best.percent': 'أصغر بنسبة {percent}',
  'stats.best.none': 'لم توفّر أي عملية شيئًا بعد، فلا توجد أفضل عملية لعرضها.',

  'stats.derived.title': 'أرقام مشتقة',
  'stats.derived.hint': 'محسوبة من الإجماليات أعلاه وليست مخزّنة.',
  'stats.derived.averageSaving': 'متوسط التوفير',
  'stats.derived.imagesPerRun': 'الصور لكل عملية',
  'stats.derived.msPerImage': 'الوقت لكل صورة',
  'stats.derived.gpuShare': 'حصة GPU',
  'stats.derived.activeDays': 'الأيام النشطة',
  'stats.derived.activeDaysValue': '{days} يوم',
  'stats.derived.activeDaysValueOne': 'يوم واحد',
  'stats.derived.volume': 'البايتات المعالَجة',
  'stats.derived.volumeValue': '{read} مقروءة، {written} مكتوبة',
  'stats.derived.failed': 'الصور التي فشلت',
  'stats.derived.skipped': 'الصور المتخطّاة',

  /* ================================================================== */
  /* Appearance                                                          */
  /* ================================================================== */

  'appearance.section.title': 'المظهر',
  'appearance.section.hint': 'الوضع يحدد الفاتح أو الداكن. والبطاقات أدناه تختار لوحة الألوان.',

  'appearance.mode.label': 'فاتح أم داكن',
  'appearance.mode.hint': 'خيار النظام يتبع نظام التشغيل ويتغير معه.',
  'appearance.mode.dark': 'داكن',
  'appearance.mode.light': 'فاتح',
  'appearance.mode.system': 'النظام',

  'appearance.themes.title': 'السمة',
  'appearance.themes.hint': 'كل بطاقة معاينة لسمة. واختيار إحداها يبدّل الفاتح أو الداكن ليطابقها.',
  'appearance.themes.group.dark': 'السمات الداكنة',
  'appearance.themes.group.light': 'السمات الفاتحة',
  'appearance.themes.inUse': 'قيد الاستخدام',
  'appearance.themes.choose': 'استخدام سمة {name}',
  'appearance.themes.previewNote':
    'تستخدم المعاينات اللون المميز الخاص بكل سمة. ويحل لونك المميز محله بمجرد ضبطه.',

  'appearance.accent.label': 'اللون المميز',
  'appearance.accent.hint': 'يعيد تلوين الأزرار وأشرطة التقدم والروابط وإبراز التحديد.',
  'appearance.accent.reset': 'لون السمة',
  'appearance.accent.resetHint': 'يعيد اللون المميز الذي صُممت حوله سمة {name}.',

  'appearance.language.title': 'اللغة',
  'appearance.language.select': 'لغة الواجهة',
  'appearance.language.hint': 'تغيّر كل النصوص، وتنسّق التواريخ والأرقام وأحجام الملفات وفقها.',
  'appearance.language.rtl': 'العربية تقلب أيضًا التخطيط كله ليصبح من اليمين إلى اليسار.',

  'appearance.theme.midnight.name': 'منتصف الليل',
  'appearance.theme.midnight.description': 'كحلي عميق بميل بارد. الافتراضية.',
  'appearance.theme.graphite.name': 'غرافيت',
  'appearance.theme.graphite.description': 'رمادي محايد بلا ميل لوني، لتقييم أعمال الألوان.',
  'appearance.theme.nord.name': 'Nord',
  'appearance.theme.nord.description': 'أزرق قطبي هادئ، مريح للعين في الجلسات الطويلة.',
  'appearance.theme.dracula.name': 'Dracula',
  'appearance.theme.dracula.description': 'بنفسجي عالي التشبّع، بتباين قوي مع الأسطح.',
  'appearance.theme.forest.name': 'غابة',
  'appearance.theme.forest.description': 'أخضر داكن دافئ، بضوء أزرق أقل من السمات الكحلية.',
  'appearance.theme.daylight.name': 'ضوء النهار',
  'appearance.theme.daylight.description': 'أبيض نظيف مع رماديات باردة. السمة الفاتحة الافتراضية.',
  'appearance.theme.paper.name': 'ورق',
  'appearance.theme.paper.description': 'أبيض مائل للدفء، أقرب إلى ورق الطباعة منه إلى الشاشة.',
  'appearance.theme.contrast.name': 'تباين عالٍ',
  'appearance.theme.contrast.description': 'أقصى فصل بين النص والخلفية، لأغراض إمكانية الوصول.',

  /* ================================================================== */
  /* Diagnostics                                                         */
  /* ================================================================== */

  'diagnostics.title': 'التشخيص',
  'diagnostics.tab.environment': 'البيئة',
  'diagnostics.tab.graphics': 'الرسوميات',
  'diagnostics.tab.log': 'السجل',
  'diagnostics.tab.preferences': 'التفضيلات',

  'diagnostics.env.copy': 'نسخ التقرير لبلاغ خطأ',
  'diagnostics.env.copied': 'تقرير التشخيص في الحافظة.',
  'diagnostics.env.copyFailed': 'تعذّرت الكتابة إلى الحافظة.',
  'diagnostics.env.empty': 'لم تصل معلومات النظام من العملية الرئيسية بعد.',

  'diagnostics.env.app': 'التطبيق',
  'diagnostics.env.app.name': 'الاسم',
  'diagnostics.env.app.version': 'الإصدار',
  'diagnostics.env.app.buildDate': 'تاريخ البناء',
  'diagnostics.env.app.packaged': 'مُحزَّم',
  'diagnostics.env.app.packagedYes': 'نعم',
  'diagnostics.env.app.packagedNo': 'لا، يعمل من المصدر',
  'diagnostics.env.app.locale': 'محلّية النظام',

  'diagnostics.env.runtime': 'بيئة التشغيل',
  'diagnostics.env.runtime.electron': 'Electron',
  'diagnostics.env.runtime.chromium': 'Chromium',
  'diagnostics.env.runtime.node': 'Node',
  'diagnostics.env.runtime.v8': 'V8',
  'diagnostics.env.runtime.abi': 'ABI الوحدات الأصلية',

  'diagnostics.env.os': 'نظام التشغيل',
  'diagnostics.env.os.platform': 'المنصة',
  'diagnostics.env.os.arch': 'المعمارية',
  'diagnostics.env.os.release': 'الإصدارة',
  'diagnostics.env.os.version': 'الإصدار',
  'diagnostics.env.os.processor': 'المعالج',
  'diagnostics.env.os.cores': 'الأنوية المنطقية',
  'diagnostics.env.os.memory': 'الذاكرة',
  'diagnostics.env.os.memoryValue': '{total} MB إجمالًا، {free} MB متاحة',

  'diagnostics.env.imaging': 'معالجة الصور',
  'diagnostics.env.imaging.sharp': 'sharp',
  'diagnostics.env.imaging.libvips': 'libvips',
  'diagnostics.env.imaging.simd': 'SIMD',
  'diagnostics.env.imaging.simdOn': 'مفعّل',
  'diagnostics.env.imaging.simdOff': 'غير متاح',
  'diagnostics.env.imaging.threads': 'خيوط libvips',
  'diagnostics.env.imaging.codecs': 'الترميزات',
  'diagnostics.env.imaging.codecsHint':
    'الأخضر يقرأ ويكتب، والعادي يقرأ فقط، والكهرماني ليس في هذه النسخة.',

  'diagnostics.env.paths': 'المسارات',
  'diagnostics.env.paths.userData': 'بيانات المستخدم',
  'diagnostics.env.paths.logs': 'السجلات',
  'diagnostics.env.paths.temp': 'الملفات المؤقتة',
  'diagnostics.env.paths.presets': 'الإعدادات المسبقة',
  'diagnostics.env.paths.open': 'فتح هذا المجلد في مدير الملفات',

  'diagnostics.graphics.intro':
    'مهايئات WebGPU تحدد ما إذا كانت مسارات GPU تحوّل. أما تسريع Chromium العتادي فيصف رسم هذه النافذة وحدها.',
  'diagnostics.graphics.adapters': 'مهايئات WebGPU',
  'diagnostics.graphics.column.adapter': 'المهايئ',
  'diagnostics.graphics.column.type': 'النوع',
  'diagnostics.graphics.column.limits': 'الحدود',
  'diagnostics.graphics.column.lane': 'المسار',
  'diagnostics.graphics.vendorUnknown': 'المُصنِّع غير مُبلَّغ عنه',
  'diagnostics.graphics.limitsValue': '{pixels} px، {megabytes} MB',
  'diagnostics.graphics.kind.discrete': 'منفصل',
  'diagnostics.graphics.kind.integrated': 'مدمج',
  'diagnostics.graphics.kind.cpu': 'برمجي',
  'diagnostics.graphics.kind.unknown': 'غير مُبلَّغ عنه',
  'diagnostics.graphics.fallbackAdapter': 'احتياطي',
  'diagnostics.graphics.laneWorking': 'يعمل',
  'diagnostics.graphics.laneIdle': 'خامل',
  'diagnostics.graphics.noAdapters': 'لم يُحَل أي مهايئ WebGPU، لذا تعمل كل صورة على مسار CPU.',
  'diagnostics.graphics.webgpuOn': 'WebGPU متاح',
  'diagnostics.graphics.webgpuOff': 'WebGPU غير متاح',
  'diagnostics.graphics.lanesOn': 'مسارات GPU مفعّلة',
  'diagnostics.graphics.lanesOff': 'مسارات GPU معطّلة',
  'diagnostics.graphics.processedOne': 'صورة واحدة على GPU',
  'diagnostics.graphics.processedMany': '{count} صورة على GPU',
  'diagnostics.graphics.fellBackOne': 'صورة واحدة تراجعت إلى CPU',
  'diagnostics.graphics.fellBackMany': '{count} صورة تراجعت إلى CPU',
  'diagnostics.graphics.chromium': 'تقرير رسوميات Chromium',
  'diagnostics.graphics.chromium.vendor': 'المُصنِّع',
  'diagnostics.graphics.chromium.device': 'الجهاز',
  'diagnostics.graphics.chromium.driver': 'التعريف',
  'diagnostics.graphics.chromium.description': 'الوصف',
  'diagnostics.graphics.chromium.notReported': 'غير مُبلَّغ عنه',
  'diagnostics.graphics.chromium.raw': 'تقرير Chromium الخام',
  'diagnostics.graphics.chromium.pending': 'لم يُعِد Chromium تقرير الرسوميات بعد.',

  'diagnostics.log.filter.all': 'الكل',
  'diagnostics.log.filter.info': 'معلومات',
  'diagnostics.log.filter.warn': 'تحذيرات',
  'diagnostics.log.filter.error': 'أخطاء',
  'diagnostics.log.level.debug': 'تنقيح',
  'diagnostics.log.level.info': 'معلومة',
  'diagnostics.log.level.warn': 'تحذير',
  'diagnostics.log.level.error': 'خطأ',
  'diagnostics.log.openFile': 'فتح ملف السجل',
  'diagnostics.log.empty': 'لم يُسجَّل شيء عند هذا المستوى بعد.',
  'diagnostics.log.follow': 'يتابع الذيل الأسطر الجديدة حتى تمرّر لأعلى، فيثبّت موضعه.',

  'diagnostics.prefs.interface': 'الواجهة',
  'diagnostics.prefs.behaviour': 'السلوك',
  'diagnostics.prefs.compact': 'تخطيط مضغوط',
  'diagnostics.prefs.compactHint': 'يضيّق الحشو وحجم الخط ليظهر من الطابور على الشاشة أكثر.',
  'diagnostics.prefs.queueView': 'تخطيط الطابور',
  'diagnostics.prefs.queueViewHint':
    'يعرض الجدول تفاصيل أكثر لكل ملف، وتعرض الشبكة صورًا مصغّرة أكثر.',
  'diagnostics.prefs.queueView.table': 'جدول',
  'diagnostics.prefs.queueView.grid': 'شبكة',
  'diagnostics.prefs.confirm': 'التأكيد قبل التشغيل',
  'diagnostics.prefs.confirmHint':
    'يعرض ما ستكتبه العملية قبل بدئها، بما في ذلك الكتابة في المكان.',
  'diagnostics.prefs.notify': 'التنبيه عند الانتهاء',
  'diagnostics.prefs.notifyHint': 'ينشر إشعارًا على سطح المكتب عند اكتمال العملية.',
  'diagnostics.prefs.openOutput': 'فتح الناتج عند الانتهاء',
  'diagnostics.prefs.openOutputHint': 'يفتح مجلد الوجهة بمجرد كتابة آخر ملف.',
  'diagnostics.prefs.taskbar': 'إظهار التقدم على شريط المهام',
  'diagnostics.prefs.taskbarHint': 'يعكس تقدم العملية على أيقونة شريط المهام أو الرصيف.',
  'diagnostics.prefs.tray': 'الاستمرار في العمل في علبة النظام',
  'diagnostics.prefs.trayHint': 'الإغلاق يخفي النافذة بدل الخروج. واخرج من قائمة علبة النظام.',

  'diagnostics.updates.title': 'التحديثات',
  'diagnostics.updates.auto': 'التحقق تلقائيًا',
  'diagnostics.updates.autoHint': 'يتحقق من وجود إصدار أحدث بعد الإقلاع. ولا يُنزَّل شيء دون طلبك.',
  'diagnostics.updates.check': 'التحقق من التحديثات',
  'diagnostics.updates.download': 'تنزيل {version}',
  'diagnostics.updates.openPage': 'احصل على {version} من GitHub',
  'diagnostics.updates.manualHint':
    'الإصدار {version} متاح. والتثبيت يدوي على macOS، لذا تُفتح الصفحة.',
  'diagnostics.updates.install': 'إعادة التشغيل والتثبيت',
  'diagnostics.updates.notes': 'ملاحظات إصدار {version}',
  'diagnostics.updates.state.idle': 'لم يجرِ أي تحقق في هذه الجلسة بعد.',
  'diagnostics.updates.state.checking': 'جارٍ الاتصال بخلاصة الإصدارات.',
  'diagnostics.updates.state.available': 'إصدار أحدث جاهز للتنزيل.',
  'diagnostics.updates.state.notAvailable': 'هذا هو أحدث إصدار منشور.',
  'diagnostics.updates.state.downloading': 'جارٍ تنزيل التحديث في الخلفية.',
  'diagnostics.updates.state.downloaded': 'نُزّل التحديث ويُثبَّت عند إعادة التشغيل التالية.',
  'diagnostics.updates.state.error': 'لم يكتمل التحقق من التحديثات.',
  'diagnostics.updates.unreachable': 'تعذّر الوصول إلى خلاصة الإصدارات.',

  /* ================================================================== */
  /* Presets                                                             */
  /* ================================================================== */

  'presets.panel.title': 'الإعدادات المسبقة',
  'presets.panel.listLabel': 'الإعدادات المسبقة المتاحة',
  'presets.panel.builtin': 'مدمجة',
  'presets.panel.mine': 'خاصتك',
  'presets.panel.inUse': 'قيد الاستخدام',
  'presets.panel.locked': 'مدمج',
  'presets.panel.noneYet': 'احفظ إعداداتك الحالية لتبدأ مكتبتك الخاصة.',
  'presets.panel.nothingToShow': 'لا توجد إعدادات مسبقة لعرضها.',
  'presets.panel.noDescription': 'لا وصف لهذا الإعداد المسبق بعد.',
  'presets.panel.changes': 'ما الذي يغيّره',
  'presets.panel.changesNone': 'يترك هذا الإعداد المسبق كل إعداد على قيمته الافتراضية.',

  'presets.copyName': '{name} (نسخة)',

  'presets.action.apply': 'تطبيق',
  'presets.action.duplicate': 'تكرار',
  'presets.action.export': 'تصدير',
  'presets.action.exportAll': 'تصدير الكل',
  'presets.action.import': 'استيراد',
  'presets.action.delete': 'حذف',
  'presets.action.saveCurrent': 'حفظ الإعدادات الحالية',

  'presets.message.applied': 'طُبِّق {name}.',
  'presets.message.duplicated': 'كُرِّر الإعداد المسبق.',
  'presets.message.deleted': 'حُذف الإعداد المسبق.',
  'presets.message.imported': 'استُورد ملف الإعداد المسبق.',
  'presets.message.exported': 'صُدِّر {name}.',
  'presets.message.exportedAllOne': 'كُتب إعداد مسبق واحد إلى {path}.',
  'presets.message.exportedAllMany': 'كُتب {count} إعداد مسبق إلى {path}.',
  'presets.message.nothingToExport': 'لا توجد إعدادات مسبقة خاصة بك لتصديرها بعد.',
  'presets.message.saved': 'حُفظ {name}.',
  'presets.message.nameRequired': 'أعطِ الإعداد المسبق اسمًا أولًا.',

  'presets.delete.title': 'حذف هذا الإعداد المسبق؟',
  'presets.delete.description': 'يُحذف الإعداد المسبق من القرص ولا يمكن استرجاعه.',
  'presets.delete.confirm': 'حذف',
  'presets.delete.cancel': 'إبقاء',

  'presets.save.title': 'حفظ الإعدادات الحالية كإعداد مسبق',
  'presets.save.intro': 'يخزّن كل ما في الشريط الجانبي، بما فيه الإخراج والعلامة المائية والأداء.',
  'presets.save.namePlaceholder': 'اسم الإعداد المسبق',
  'presets.save.descriptionPlaceholder': 'الغرض من هذا الإعداد المسبق.',
  'presets.save.confirm': 'حفظ الإعداد المسبق',

  'presets.share.title': 'الإعدادات المسبقة ملفات، فيمكنك مشاركتها',
  'presets.share.whatItIs':
    'الإعداد المسبق ملف JSON يحمل إعدادات الشريط الجانبي وحدها. لا صور فيه ولا شيء عن جهازك، فمشاركته آمنة.',
  'presets.share.howItWorks':
    'التصدير يكتب إعدادًا مسبقًا واحدًا إلى ملف، وتصدير الكل يكتب كل الإعدادات المسبقة، والاستيراد يقرأ النوعين معًا.',
  'presets.share.exampleTitle': 'على سبيل المثال',
  'presets.share.example':
    'صدّر WebP بجودة 78، بحد 1600 px على أطول ضلع مع تجريد البيانات الوصفية، باسم team-photos.json للفريق كله.',
  'presets.share.uses':
    'الملف نفسه يصلح مرسلًا بالبريد إلى زميل، أو مرفقًا ببلاغ خطأ، أو منشورًا للجميع.',
  'presets.share.exportSelected': 'تصدير {name}',
  'presets.share.exportSelectedNone': 'تصدير الإعداد المسبق المحدد',
  'presets.share.importHint': 'تُضاف الإعدادات المستوردة إلى جانب إعداداتك ولا تستبدلها أبدًا.',

  'presets.summary.format': 'الصيغة',
  'presets.summary.formatOriginal': 'مثل المصدر',
  'presets.summary.quality': 'الجودة',
  'presets.summary.lossless': 'بلا فقد',
  'presets.summary.effort': 'جهد المُرمِّز',
  'presets.summary.chroma': 'اختزال عيّنات اللون',
  'presets.summary.progressive': 'تدريجي',
  'presets.summary.mozjpeg': 'مُرمِّز MozJPEG',
  'presets.summary.tiffCompression': 'ضغط TIFF',
  'presets.summary.pngPalette': 'لوحة ألوان PNG',
  'presets.summary.pngPaletteOn': 'مفعّلة، {colours} لون',
  'presets.summary.pngCompression': 'ضغط PNG',

  'presets.summary.resize': 'تغيير الحجم',
  'presets.summary.resize.guard': '، دون تكبير عن الأصل',
  'presets.summary.resize.none': 'الإبقاء على الحجم الأصلي',
  'presets.summary.resize.exact': '{width} × {height} بكسل بالضبط، بملاءمة {fit}{guard}',
  'presets.summary.resize.width': 'العرض محدود بـ {pixels} بكسل{guard}',
  'presets.summary.resize.height': 'الارتفاع محدود بـ {pixels} بكسل{guard}',
  'presets.summary.resize.longest': 'أطول ضلع محدود بـ {pixels} بكسل{guard}',
  'presets.summary.resize.shortest': 'أقصر ضلع محدود بـ {pixels} بكسل{guard}',
  'presets.summary.resize.percentage': 'محجَّمة إلى {percent} بالمئة',
  'presets.summary.resize.megapixels': 'محجَّمة إلى نحو {megapixels} ميغابكسل',
  'presets.summary.resize.unchanged': 'دون تغيير',

  'presets.summary.crop': 'الاقتصاص',
  'presets.summary.cropValue': 'مفعّل، وضع {mode}',

  'presets.summary.adjustments': 'التعديلات',
  'presets.summary.adjust.grayscale': 'تدرج رمادي',
  'presets.summary.adjust.normalize': 'مستويات ممدودة',
  'presets.summary.adjust.sharpen': 'إحداد',
  'presets.summary.adjust.blur': 'تمويه',
  'presets.summary.adjust.clahe': 'تباين محلي',
  'presets.summary.adjust.contrast': 'تباين {value}',
  'presets.summary.adjust.separator': '، ',

  'presets.summary.watermark': 'العلامة المائية',
  'presets.summary.watermark.text': 'نص يقول {text}',
  'presets.summary.watermark.textTiled': 'نص مبلّط يقول {text}',
  'presets.summary.watermark.textEmpty': 'لا شيء بعد',
  'presets.summary.watermark.image': 'صورة فوقية',
  'presets.summary.watermark.imageTiled': 'صورة فوقية مبلّطة',

  'presets.summary.metadata': 'البيانات الوصفية',
  'presets.summary.metadata.strip': 'مُزالة بالكامل',
  'presets.summary.metadata.keep': 'محفوظة بالكامل',
  'presets.summary.metadata.keepIcc': 'الملف اللوني وحده محفوظ',
  'presets.summary.metadata.keepCopyright': 'حقول حقوق النشر وحدها محفوظة',
  'presets.summary.density': 'الكثافة',
  'presets.summary.densityValue': '{density} DPI',

  'presets.summary.template': 'قالب اسم الملف',
  'presets.summary.structure': 'بنية المجلدات',
  'presets.summary.structure.flat': 'كل شيء في مجلد واحد',
  'presets.summary.structure.mirror': 'يحاكي شجرة مجلدات المصدر',
  'presets.summary.structure.byFormat': 'مجلد لكل صيغة إخراج',
  'presets.summary.structure.byDate': 'مجلد لكل تاريخ تشغيل',

  'presets.summary.sizeBudget': 'ميزانية الحجم',
  'presets.summary.sizeBudgetValue': '{kilobytes} KB لكل صورة، والجودة يُبحث عنها بين {min} و{max}',
  'presets.summary.autoFormat': 'الصيغة التلقائية',
  'presets.summary.autoFormatValue': 'تُختار لكل صورة من محتواها',

  'presets.summary.backend': 'محرك المعالجة',
  'presets.summary.backend.auto': 'يُختار لكل صورة',
  'presets.summary.backend.gpu': 'تفضيل مسارات GPU',
  'presets.summary.backend.cpu': 'عمّال CPU فقط',
  'presets.summary.gpuLanes': 'مسارات GPU',
  'presets.summary.gpuLanesValue': 'واحد لكل مهايئ مكتشف',

  'presets.summary.variants': 'نسخ إضافية',
  'presets.summary.variantsItem': '{label} ({suffix})',

  /* ================================================================ */
  /* Shell                                                             */
  /* ================================================================ */

  'shell.settings.title': 'إعدادات التحويل',

  'shell.drop.title': 'أفلت للإضافة',
  'shell.drop.body': 'الصور والمجلدات كلاهما مقبول',

  'shell.import.unreadable': 'تعذّرت قراءة هذه العناصر من القرص.',
  'shell.import.dropEmpty': 'لم يُعثر على صور مدعومة فيما أفلته.',
  'shell.import.folderEmpty': 'لم يحتوِ هذا المجلد على صور مدعومة.',
  'shell.import.added.one': 'أُضيفت صورة واحدة.',
  'shell.import.added.many': 'أُضيفت {count} صورة.',

  'shell.convert.empty': 'أضف بعض الصور أولًا.',
  'shell.convert.needsFolder': 'اختر مجلد إخراج قبل البدء.',
  'shell.convert.cancelling': 'يجري إنهاء الصور الجارية ثم التوقف.',

  /* ================================================================ */
  /* Compare slider                                                    */
  /* ================================================================ */

  'preview.error.unsupported': 'تعذّرت معاينة هذه الصورة بهذه الإعدادات.',

  'preview.compare.subject': 'الصورة المحددة',
  'preview.compare.altBefore': '{subject} قبل التحويل',
  'preview.compare.altAfter': '{subject} بعد التحويل',
  'preview.compare.converted': 'محوَّلة',
  'preview.compare.original': 'الأصلية',
  'preview.compare.aria': 'موضع مقبض المقارنة',
  'preview.compare.ariaValue': 'محوَّلة بنسبة {percent} بالمئة'
}
