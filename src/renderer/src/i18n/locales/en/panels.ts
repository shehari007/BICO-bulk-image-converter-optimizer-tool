/**
 * Strings for the About, History, Preview and Watch panels.
 *
 * Keys are prefixed by the panel they belong to rather than by this file,
 * because the dictionary is merged flat: a bare key such as `title` would be
 * overwritten the moment another area needed one of its own.
 */
export const panels = {
  /* ================================================================== */
  /* About                                                               */
  /* ================================================================== */

  'about.title': 'About BICO',
  'about.tab.about': 'About',
  'about.tab.formats': 'Formats',
  'about.tab.credits': 'Credits',

  'about.hero.logoAlt': 'The BICO application icon',
  'about.build.version': 'Version {version}',
  'about.build.platform': '{platform} {arch}',
  'about.build.built': 'Built {date}',
  'about.build.reading': 'Reading build information',
  'about.platform.windows': 'Windows',
  'about.platform.macos': 'macOS',
  'about.platform.linux': 'Linux',

  'about.intro':
    'BICO converts and optimises images in bulk on your machine. Nothing is uploaded, and originals stay untouched unless you ask.',

  'about.section.highlights': 'What is new in this release',
  'about.highlight.pipeline':
    'A multi threaded sharp pipeline that keeps the window responsive while thousands of files encode.',
  'about.highlight.gpu':
    'Optional GPU processing that spreads decode, resize and encode across every adapter.',
  'about.highlight.formats': 'Eight output formats, including a bundled JPEG XL codec.',
  'about.highlight.preview':
    'A live before and after preview in the real target format, so you judge real artefacts.',
  'about.highlight.sizeTarget':
    'Size targeting that searches the quality range until every file fits a byte budget.',
  'about.highlight.variants':
    'Responsive variant generation, producing a whole srcset from a single decode.',
  'about.highlight.watch':
    'Hot folder automation that converts new images the moment they land on disk.',

  'about.section.links': 'Links',
  'about.link.repository': 'Repository',
  'about.link.issues': 'Report an issue',
  'about.link.author': 'Author profile',
  'about.link.sponsor': 'Buy me a coffee',
  'about.licence':
    'Released under the MIT licence. Written and maintained by Muhammad Sheharyar Butt.',

  'about.formats.allAvailable': 'Every format below is available in this build',
  'about.formats.missingOne': 'One format cannot be written by this build',
  'about.formats.missingMany': '{count} formats cannot be written by this build',
  'about.formats.note':
    'Availability shows what this build resolved at startup, so unavailable formats are greyed out. JPEG XL is bundled as WebAssembly libjxl.',
  'about.formats.column.format': 'Format',
  'about.formats.column.bestFor': 'Best for',
  'about.formats.column.capabilities': 'Capabilities',
  'about.formats.column.availability': 'This build',

  'about.capability.quality': 'Quality',
  'about.capability.lossless': 'Lossless',
  'about.capability.alpha': 'Alpha',
  'about.capability.animation': 'Animation',
  'about.capability.progressive': 'Progressive',
  'about.capability.chroma': 'Chroma',
  'about.capability.hdr': 'HDR',
  'about.capability.metadata': 'Metadata',
  'about.capability.effort': 'Effort {min} to {max}',
  'about.capability.gpuEncode': 'GPU encode',

  'about.availability.notReported': 'Not reported',
  'about.availability.reads': 'Reads',
  'about.availability.noDecoder': 'No decoder',
  'about.availability.writes': 'Writes',
  'about.availability.noEncoder': 'No encoder',

  'about.credits.intro':
    'These are the projects BICO depends on, at the versions running right now.',
  'about.credits.visit': 'Visit',
  'about.credits.versionUnknown': 'Version not reported',
  'about.credits.footer':
    'Ant Design icons, Inter and the Electron builder toolchain complete the list. All ship under permissive licences, as does BICO.',
  'about.credits.libvips':
    'The streaming image processing library every conversion actually runs through.',
  'about.credits.sharp': 'The Node binding that drives libvips from inside the worker threads.',
  'about.credits.electron': "Desktop runtime behind BICO's native window and filesystem access.",
  'about.credits.chromium': 'The engine that renders the interface and hosts the GPU lanes.',
  'about.credits.react': 'The component model the entire interface is written in.',
  'about.credits.antd': 'The component library and design tokens the interface is themed with.',
  'about.credits.webgpu': 'The compute layer the GPU lanes use for decode, resize and encode work.',
  'about.credits.plex':
    'Typeface used across the interface, Arabic included, under the SIL Open Font License.',
  'about.credits.gpuNone': 'No adapter detected on this machine',
  'about.credits.gpuOne': 'One adapter detected',
  'about.credits.gpuMany': '{count} adapters detected',

  /* ================================================================== */
  /* History                                                             */
  /* ================================================================== */

  'history.title': 'Run history',
  'history.action.refresh': 'Refresh',
  'history.action.seeFailures': 'See what failed',
  'history.clear.confirmTitle': 'Clear the run history?',
  'history.clear.confirmBody': 'Summaries are removed. Converted files are not touched.',
  'history.clear.confirmOk': 'Clear',
  'history.clear.confirmCancel': 'Keep',
  'history.toast.cleared': 'Run history cleared.',
  'history.toast.clearFailed': 'The history file could not be cleared.',
  'history.toast.noLocation': 'This run did not record an output location.',

  'history.empty':
    'No runs recorded yet. Finished conversions are logged here with savings, output folder and duration.',

  'history.summary.runs': 'Runs recorded',
  'history.summary.images': 'Images converted',
  'history.summary.saved': 'Total saved',

  'history.finishTimeUnknown': 'Finish time not recorded',
  'history.formatOriginal': 'Same as source',
  'history.preset': 'Preset {name}',
  'history.presetCustom': 'custom',

  'history.tag.processed': '{count} processed',
  'history.tag.failed': '{count} failed',
  'history.tag.skipped': '{count} skipped',
  'history.tag.stoppedEarly': 'Stopped early',
  'history.tag.onGpu': '{count} on GPU',
  'history.tag.onCpu': '{count} on CPU',

  'history.field.saved': 'Saved',
  'history.field.size': 'Size',
  'history.field.location': 'Location',
  'history.savedPercent': '({percent} percent)',
  'history.sizeChange': '{before} down to {after}',
  'history.notRecorded': 'Not recorded',

  'history.open.folder': 'Open output folder',
  'history.open.zip': 'Open the archive',
  'history.open.inPlace': 'Open the source folder',
  'history.open.report': 'Open the CSV report',

  'history.errors.titleOne': 'One file failed',
  'history.errors.titleMany': '{count} files failed',

  /* ================================================================== */
  /* Preview                                                             */
  /* ================================================================== */

  'preview.title': 'Live preview',
  'preview.empty': 'Select an image in the queue to preview how it will be converted.',
  'preview.dimensions': '{width} by {height} pixels',
  'preview.dimensionsPending': 'Dimensions are still being read',
  'preview.tag.alpha': 'Has transparency',
  'preview.tag.animated': 'Animated',

  'preview.error.title': 'This image could not be previewed',
  'preview.formatOriginal': 'Same as the source',

  'preview.fallback.title': 'Shown as {shown}, not {requested}',
  'preview.fallback.body':
    '{reason} Pixels below are accurate, but the sizes come from the substitute container, not the real format.',

  'preview.field.originalSize': 'Original size',
  'preview.field.estimatedOutput': 'Estimated output',
  'preview.field.change': 'Change',
  'preview.field.outputFormat': 'Output format',
  'preview.field.render': 'Preview render',

  'preview.change.smaller': '{percent} percent smaller',
  'preview.change.larger': '{percent} percent larger',
  'preview.renderDetail': '{width} by {height} in {duration}',

  'preview.estimateNote':
    'The preview renders at reduced resolution and extrapolates the size, so treat it as a guide, not an exact byte count.',
  'preview.rerendering': 'Re rendering with the settings you just changed.',

  /* ================================================================== */
  /* Watch folder                                                        */
  /* ================================================================== */

  'watch.title': 'Watch folder',
  'watch.formatOriginal': 'the source format',
  'watch.intro.title': 'Files dropped into the watched folder convert automatically.',
  'watch.intro.body':
    'Settings are captured when you press Start and stay fixed, so later files are written as {format} even if you change the sidebar.',

  'watch.action.choose': 'Choose',
  'watch.action.start': 'Start watching',
  'watch.action.stop': 'Stop',

  'watch.folder.label': 'Folder to watch',
  'watch.folder.hint': 'New images here are queued and converted one at a time.',
  'watch.folder.placeholder': 'No folder chosen yet',

  'watch.recursive.label': 'Include subfolders',
  'watch.recursive.hint': 'Also watches every folder inside the one above.',

  'watch.settle.label': 'Settle time',
  'watch.settle.hint': "How long a file's size must stay unchanged before it counts as finished.",

  'watch.move.label': 'Move originals to',
  'watch.move.hint': 'Each source file moves here once its converted copy exists.',
  'watch.move.placeholder': 'Leave the originals where they are',

  'watch.delete.label': 'Delete originals after converting',
  'watch.delete.hint': 'Permanently deletes each source file once its copy is written.',
  'watch.delete.hintMoving': 'Not available while originals are moved to another folder.',
  'watch.delete.confirmTitle': 'Delete each original after it is converted?',
  'watch.delete.confirmBody':
    'Each source file is deleted once its converted copy is written. There is no undo and nothing goes to the recycle bin.',
  'watch.delete.confirmOk': 'Delete originals',
  'watch.delete.confirmCancel': 'Keep originals',
  'watch.delete.warningTitle': 'Original files will be deleted',
  'watch.delete.warningBody':
    'Every image this watcher converts is deleted from the watched folder afterwards.',

  'watch.toast.needFolder': 'Choose a folder to watch first.',
  'watch.toast.needOutput': 'Choose an output folder in the sidebar before watching.',
  'watch.toast.started': 'Watching started.',
  'watch.toast.stopped': 'Watching stopped.',

  'watch.status.title': 'Status',
  'watch.status.state': 'State',
  'watch.status.running': 'Watching',
  'watch.status.idle': 'Idle',
  'watch.status.folder': 'Folder',
  'watch.status.noFolder': 'None chosen',
  'watch.status.seen': 'Files seen',
  'watch.status.processed': 'Files converted',
  'watch.status.lastEvent': 'Last event',
  'watch.status.noEvent': 'Nothing has happened yet',
  'watch.status.errorTitle': 'The watcher reported a problem',
  'watch.status.locked':
    'Settings are locked while watching. Stop first if you need to change them.'
} as const
