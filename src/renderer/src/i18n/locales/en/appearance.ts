/**
 * Appearance, diagnostics and the preset library.
 *
 * Three areas share one file because they are the three surfaces the same
 * author owns, and splitting them further would leave files of a dozen keys.
 * Every key still carries its own area prefix, so the flat merge in index.ts
 * cannot have one area quietly shadow another.
 */
export const appearance = {
  /* ================================================================== */
  /* Appearance: light or dark, the palette, the accent and the language */
  /* ================================================================== */

  'appearance.section.title': 'Appearance',
  'appearance.section.hint': 'Mode sets light or dark. The cards below pick the palette.',

  'appearance.mode.label': 'Light or dark',
  'appearance.mode.hint': 'System follows the operating system and changes with it.',
  'appearance.mode.dark': 'Dark',
  'appearance.mode.light': 'Light',
  'appearance.mode.system': 'System',

  'appearance.themes.title': 'Theme',
  'appearance.themes.hint':
    'Each card previews a theme. Picking one switches light or dark to match.',
  'appearance.themes.group.dark': 'Dark themes',
  'appearance.themes.group.light': 'Light themes',
  'appearance.themes.inUse': 'In use',
  'appearance.themes.choose': 'Use the {name} theme',
  'appearance.themes.previewNote':
    "Previews use each theme's own accent. Your accent colour replaces it once you set one.",

  'appearance.accent.label': 'Accent colour',
  'appearance.accent.hint': 'Recolours buttons, progress bars, links and selection highlights.',
  'appearance.accent.reset': 'Theme accent',
  'appearance.accent.resetHint': 'Restores the accent {name} was designed around.',

  'appearance.language.title': 'Language',
  'appearance.language.select': 'Interface language',
  'appearance.language.hint':
    'Changes all text, and formats dates, numbers and file sizes to match.',
  'appearance.language.rtl': 'Arabic also flips the whole layout to right to left.',

  'appearance.theme.midnight.name': 'Midnight',
  'appearance.theme.midnight.description': 'Deep navy with a cool cast. The default.',
  'appearance.theme.graphite.name': 'Graphite',
  'appearance.theme.graphite.description':
    'Neutral grey with no colour cast, for judging colour work.',
  'appearance.theme.nord.name': 'Nord',
  'appearance.theme.nord.description': 'Muted arctic blues, easy on the eyes over long sessions.',
  'appearance.theme.dracula.name': 'Dracula',
  'appearance.theme.dracula.description':
    'High saturation violet with strong contrast against the surfaces.',
  'appearance.theme.forest.name': 'Forest',
  'appearance.theme.forest.description': 'Warm dark green, lower blue light than the navy themes.',
  'appearance.theme.daylight.name': 'Daylight',
  'appearance.theme.daylight.description': 'Clean white with cool greys. The default light theme.',
  'appearance.theme.paper.name': 'Paper',
  'appearance.theme.paper.description': 'Warm off white, closer to print stock than a screen.',
  'appearance.theme.contrast.name': 'High contrast',
  'appearance.theme.contrast.description':
    'Maximum separation between text and background, for accessibility.',

  /* ================================================================== */
  /* Diagnostics                                                         */
  /* ================================================================== */

  'diagnostics.title': 'Diagnostics',
  'diagnostics.tab.environment': 'Environment',
  'diagnostics.tab.graphics': 'Graphics',
  'diagnostics.tab.log': 'Log',
  'diagnostics.tab.preferences': 'Preferences',

  'diagnostics.env.copy': 'Copy report for a bug report',
  'diagnostics.env.copied': 'The diagnostics report is on the clipboard.',
  'diagnostics.env.copyFailed': 'The clipboard could not be written to.',
  'diagnostics.env.empty': 'System information has not arrived from the main process yet.',

  'diagnostics.env.app': 'App',
  'diagnostics.env.app.name': 'Name',
  'diagnostics.env.app.version': 'Version',
  'diagnostics.env.app.buildDate': 'Build date',
  'diagnostics.env.app.packaged': 'Packaged',
  'diagnostics.env.app.packagedYes': 'Yes',
  'diagnostics.env.app.packagedNo': 'No, running from source',
  'diagnostics.env.app.locale': 'System locale',

  'diagnostics.env.runtime': 'Runtime',
  'diagnostics.env.runtime.electron': 'Electron',
  'diagnostics.env.runtime.chromium': 'Chromium',
  'diagnostics.env.runtime.node': 'Node',
  'diagnostics.env.runtime.v8': 'V8',
  'diagnostics.env.runtime.abi': 'Native module ABI',

  'diagnostics.env.os': 'Operating system',
  'diagnostics.env.os.platform': 'Platform',
  'diagnostics.env.os.arch': 'Architecture',
  'diagnostics.env.os.release': 'Release',
  'diagnostics.env.os.version': 'Version',
  'diagnostics.env.os.processor': 'Processor',
  'diagnostics.env.os.cores': 'Logical cores',
  'diagnostics.env.os.memory': 'Memory',
  'diagnostics.env.os.memoryValue': '{total} MB total, {free} MB free',

  'diagnostics.env.imaging': 'Imaging',
  'diagnostics.env.imaging.sharp': 'sharp',
  'diagnostics.env.imaging.libvips': 'libvips',
  'diagnostics.env.imaging.simd': 'SIMD',
  'diagnostics.env.imaging.simdOn': 'Enabled',
  'diagnostics.env.imaging.simdOff': 'Not available',
  'diagnostics.env.imaging.threads': 'libvips threads',
  'diagnostics.env.imaging.codecs': 'Codecs',
  'diagnostics.env.imaging.codecsHint':
    'Green reads and writes, plain reads only, amber is not in this build.',

  'diagnostics.env.paths': 'Paths',
  'diagnostics.env.paths.userData': 'User data',
  'diagnostics.env.paths.logs': 'Logs',
  'diagnostics.env.paths.temp': 'Temporary files',
  'diagnostics.env.paths.presets': 'Presets',
  'diagnostics.env.paths.open': 'Open this folder in the file manager',

  'diagnostics.graphics.intro':
    'WebGPU adapters decide whether the GPU lanes convert. Chromium hardware acceleration only describes how this window is drawn.',
  'diagnostics.graphics.adapters': 'WebGPU adapters',
  'diagnostics.graphics.column.adapter': 'Adapter',
  'diagnostics.graphics.column.type': 'Type',
  'diagnostics.graphics.column.limits': 'Limits',
  'diagnostics.graphics.column.lane': 'Lane',
  'diagnostics.graphics.vendorUnknown': 'Vendor not reported',
  'diagnostics.graphics.limitsValue': '{pixels} px, {megabytes} MB',
  'diagnostics.graphics.kind.discrete': 'Discrete',
  'diagnostics.graphics.kind.integrated': 'Integrated',
  'diagnostics.graphics.kind.cpu': 'Software',
  'diagnostics.graphics.kind.unknown': 'Unreported',
  'diagnostics.graphics.fallbackAdapter': 'Fallback',
  'diagnostics.graphics.laneWorking': 'Working',
  'diagnostics.graphics.laneIdle': 'Idle',
  'diagnostics.graphics.noAdapters':
    'No WebGPU adapter was resolved, so every image runs on the CPU pipeline.',
  'diagnostics.graphics.webgpuOn': 'WebGPU available',
  'diagnostics.graphics.webgpuOff': 'WebGPU unavailable',
  'diagnostics.graphics.lanesOn': 'GPU lanes enabled',
  'diagnostics.graphics.lanesOff': 'GPU lanes off',
  'diagnostics.graphics.processedOne': '1 image on the GPU',
  'diagnostics.graphics.processedMany': '{count} images on the GPU',
  'diagnostics.graphics.fellBackOne': '1 image fell back to the CPU',
  'diagnostics.graphics.fellBackMany': '{count} images fell back to the CPU',
  'diagnostics.graphics.chromium': 'Chromium graphics report',
  'diagnostics.graphics.chromium.vendor': 'Vendor',
  'diagnostics.graphics.chromium.device': 'Device',
  'diagnostics.graphics.chromium.driver': 'Driver',
  'diagnostics.graphics.chromium.description': 'Description',
  'diagnostics.graphics.chromium.notReported': 'Not reported',
  'diagnostics.graphics.chromium.raw': 'Raw Chromium report',
  'diagnostics.graphics.chromium.pending': 'Chromium has not returned its graphics report yet.',

  'diagnostics.log.filter.all': 'All',
  'diagnostics.log.filter.info': 'Info',
  'diagnostics.log.filter.warn': 'Warnings',
  'diagnostics.log.filter.error': 'Errors',
  'diagnostics.log.level.debug': 'debug',
  'diagnostics.log.level.info': 'info',
  'diagnostics.log.level.warn': 'warn',
  'diagnostics.log.level.error': 'error',
  'diagnostics.log.openFile': 'Open log file',
  'diagnostics.log.empty': 'Nothing has been logged at this level yet.',
  'diagnostics.log.follow': 'The tail follows new lines until you scroll up, then holds position.',

  'diagnostics.prefs.interface': 'Interface',
  'diagnostics.prefs.behaviour': 'Behaviour',
  'diagnostics.prefs.compact': 'Compact layout',
  'diagnostics.prefs.compactHint':
    'Tightens padding and type size to fit more of the queue on screen.',
  'diagnostics.prefs.queueView': 'Queue layout',
  'diagnostics.prefs.queueViewHint':
    'The table shows more detail per file, the grid more thumbnails.',
  'diagnostics.prefs.queueView.table': 'Table',
  'diagnostics.prefs.queueView.grid': 'Grid',
  'diagnostics.prefs.confirm': 'Confirm before a run',
  'diagnostics.prefs.confirmHint':
    'Shows what a run will write before it starts, including in place output.',
  'diagnostics.prefs.notify': 'Notify when finished',
  'diagnostics.prefs.notifyHint': 'Posts a desktop notification when a run completes.',
  'diagnostics.prefs.openOutput': 'Open the output when done',
  'diagnostics.prefs.openOutputHint': 'Opens the destination folder once the last file is written.',
  'diagnostics.prefs.taskbar': 'Show progress on the taskbar',
  'diagnostics.prefs.taskbarHint': 'Mirrors run progress onto the taskbar or dock icon.',
  'diagnostics.prefs.tray': 'Keep running in the tray',
  'diagnostics.prefs.trayHint':
    'Closing hides the window instead of quitting. Quit from the tray menu.',

  'diagnostics.updates.title': 'Updates',
  'diagnostics.updates.auto': 'Check automatically',
  'diagnostics.updates.autoHint':
    'Checks for a newer release after launch. Nothing downloads until you ask.',
  'diagnostics.updates.check': 'Check for updates',
  'diagnostics.updates.download': 'Download {version}',
  'diagnostics.updates.openPage': 'Get {version} from GitHub',
  'diagnostics.updates.manualHint':
    'Version {version} is available. macOS installs by hand, so the page opens.',
  'diagnostics.updates.install': 'Restart and install',
  'diagnostics.updates.notes': 'Release notes for {version}',
  'diagnostics.updates.state.idle': 'No check has run yet in this session.',
  'diagnostics.updates.state.checking': 'Contacting the release feed.',
  'diagnostics.updates.state.available': 'A newer version is ready to download.',
  'diagnostics.updates.state.notAvailable': 'This is the latest published release.',
  'diagnostics.updates.state.downloading': 'Downloading the update in the background.',
  'diagnostics.updates.state.downloaded':
    'The update is downloaded and installs on the next restart.',
  'diagnostics.updates.state.error': 'The update check did not complete.',
  'diagnostics.updates.unreachable': 'The release feed could not be reached.',

  /* ================================================================== */
  /* Presets                                                             */
  /* ================================================================== */

  'presets.panel.title': 'Presets',
  'presets.panel.listLabel': 'Available presets',
  'presets.panel.builtin': 'Built in',
  'presets.panel.mine': 'Yours',
  'presets.panel.inUse': 'In use',
  'presets.panel.locked': 'Built in',
  'presets.panel.noneYet': 'Save your current settings to start your own library.',
  'presets.panel.nothingToShow': 'There are no presets to show.',
  'presets.panel.noDescription': 'This preset has no description yet.',
  'presets.panel.changes': 'What it changes',
  'presets.panel.changesNone': 'This preset leaves every setting at its default value.',

  /* Persisted into the preset file, so it has to be the user's own language. */
  'presets.copyName': '{name} (copy)',

  'presets.action.apply': 'Apply',
  'presets.action.duplicate': 'Duplicate',
  'presets.action.export': 'Export',
  'presets.action.exportAll': 'Export all',
  'presets.action.import': 'Import',
  'presets.action.delete': 'Delete',
  'presets.action.saveCurrent': 'Save current settings',

  'presets.message.applied': 'Applied {name}.',
  'presets.message.duplicated': 'Duplicated the preset.',
  'presets.message.deleted': 'Deleted the preset.',
  'presets.message.imported': 'Imported the preset file.',
  'presets.message.exported': 'Exported {name}.',
  'presets.message.exportedAllOne': 'Wrote 1 preset to {path}.',
  'presets.message.exportedAllMany': 'Wrote {count} presets to {path}.',
  'presets.message.nothingToExport': 'There are no presets of your own to export yet.',
  'presets.message.saved': 'Saved {name}.',
  'presets.message.nameRequired': 'Give the preset a name first.',

  'presets.delete.title': 'Delete this preset?',
  'presets.delete.description': 'The preset is deleted from disk and cannot be recovered.',
  'presets.delete.confirm': 'Delete',
  'presets.delete.cancel': 'Keep',

  'presets.save.title': 'Save current settings as a preset',
  'presets.save.intro':
    'Stores everything in the sidebar, including output, watermark and performance.',
  'presets.save.namePlaceholder': 'Preset name',
  'presets.save.descriptionPlaceholder': 'What this preset is for.',
  'presets.save.confirm': 'Save preset',

  'presets.share.title': 'Presets are files, so you can share them',
  'presets.share.whatItIs':
    'A preset is a JSON file with sidebar settings only. No images and nothing about your machine, so it is safe to share.',
  'presets.share.howItWorks':
    'Export writes one preset to a file, export all writes every preset, and import reads either kind back.',
  'presets.share.exampleTitle': 'For example',
  'presets.share.example':
    'Export WebP at quality 78, capped at 1600 px on the longest edge with metadata stripped, as team-photos.json for the whole team.',
  'presets.share.uses':
    'The same file works emailed to a colleague, attached to a bug report, or published for anyone.',
  'presets.share.exportSelected': 'Export {name}',
  'presets.share.exportSelectedNone': 'Export the selected preset',
  'presets.share.importHint': 'Imports are added alongside yours and never overwrite them.',

  'presets.summary.format': 'Format',
  'presets.summary.formatOriginal': 'Same as the source',
  'presets.summary.quality': 'Quality',
  'presets.summary.lossless': 'Lossless',
  'presets.summary.effort': 'Encoder effort',
  'presets.summary.chroma': 'Chroma subsampling',
  'presets.summary.progressive': 'Progressive',
  'presets.summary.mozjpeg': 'MozJPEG encoder',
  'presets.summary.tiffCompression': 'TIFF compression',
  'presets.summary.pngPalette': 'PNG palette',
  'presets.summary.pngPaletteOn': 'On, {colours} colours',
  'presets.summary.pngCompression': 'PNG compression',

  'presets.summary.resize': 'Resize',
  'presets.summary.resize.guard': ', never enlarged past the original',
  'presets.summary.resize.none': 'Kept at the original size',
  'presets.summary.resize.exact': 'Exactly {width} by {height} pixels, fitted with {fit}{guard}',
  'presets.summary.resize.width': 'Width capped at {pixels} pixels{guard}',
  'presets.summary.resize.height': 'Height capped at {pixels} pixels{guard}',
  'presets.summary.resize.longest': 'Longest edge capped at {pixels} pixels{guard}',
  'presets.summary.resize.shortest': 'Shortest edge capped at {pixels} pixels{guard}',
  'presets.summary.resize.percentage': 'Scaled to {percent} percent',
  'presets.summary.resize.megapixels': 'Scaled to about {megapixels} megapixels',
  'presets.summary.resize.unchanged': 'Unchanged',

  'presets.summary.crop': 'Crop',
  'presets.summary.cropValue': 'Enabled, {mode} mode',

  'presets.summary.adjustments': 'Adjustments',
  'presets.summary.adjust.grayscale': 'grayscale',
  'presets.summary.adjust.normalize': 'levels stretched',
  'presets.summary.adjust.sharpen': 'sharpened',
  'presets.summary.adjust.blur': 'blurred',
  'presets.summary.adjust.clahe': 'local contrast',
  'presets.summary.adjust.contrast': 'contrast {value}',
  'presets.summary.adjust.separator': ', ',

  'presets.summary.watermark': 'Watermark',
  'presets.summary.watermark.text': 'Text reading {text}',
  'presets.summary.watermark.textTiled': 'Tiled text reading {text}',
  'presets.summary.watermark.textEmpty': 'nothing yet',
  'presets.summary.watermark.image': 'Image overlay',
  'presets.summary.watermark.imageTiled': 'Tiled image overlay',

  'presets.summary.metadata': 'Metadata',
  'presets.summary.metadata.strip': 'Removed entirely',
  'presets.summary.metadata.keep': 'Kept in full',
  'presets.summary.metadata.keepIcc': 'Only the colour profile kept',
  'presets.summary.metadata.keepCopyright': 'Only the copyright fields kept',
  'presets.summary.density': 'Density',
  'presets.summary.densityValue': '{density} DPI',

  'presets.summary.template': 'Filename template',
  'presets.summary.structure': 'Folder structure',
  'presets.summary.structure.flat': 'Everything in one folder',
  'presets.summary.structure.mirror': 'Mirrors the source folder tree',
  'presets.summary.structure.byFormat': 'A folder per output format',
  'presets.summary.structure.byDate': 'A folder per run date',

  'presets.summary.sizeBudget': 'Size budget',
  'presets.summary.sizeBudgetValue':
    '{kilobytes} KB per image, quality searched between {min} and {max}',
  'presets.summary.autoFormat': 'Automatic format',
  'presets.summary.autoFormatValue': 'Chosen per image from its content',

  'presets.summary.backend': 'Processing backend',
  'presets.summary.backend.auto': 'Chosen per image',
  'presets.summary.backend.gpu': 'GPU lanes preferred',
  'presets.summary.backend.cpu': 'CPU workers only',
  'presets.summary.gpuLanes': 'GPU lanes',
  'presets.summary.gpuLanesValue': 'One per detected adapter',

  'presets.summary.variants': 'Extra renditions',
  'presets.summary.variantsItem': '{label} ({suffix})'
} as const
