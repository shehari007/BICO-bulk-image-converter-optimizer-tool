/**
 * The command surfaces: the toolbar, the stat strip, the status bar, the
 * command palette and the run summary.
 *
 * Counts never rely on the interpolation helper to pick a plural, because it has
 * no plural rules on purpose. Wherever the wording changes with a number there
 * are two keys and the call site chooses, which leaves the decision with the
 * translator rather than with a regular expression.
 */
export const toolbar = {
  'toolbar.panel.stats': 'Statistics',
  'toolbar.panel.preferences': 'Preferences and diagnostics',
  'toolbar.settings': 'Settings',
  'toolbar.settings.tooltip': 'Presets, watch folder, history, appearance and diagnostics',
  'toolbar.actions.aria': 'Primary actions',
  'toolbar.theme.cycle': 'Appearance: {theme}',
  /* ================================================================ */
  /* Toolbar                                                           */
  /* ================================================================ */

  'toolbar.logoAlt': 'The BICO application icon',
  'toolbar.version': 'v{version}',
  'toolbar.sidebar.hide': 'Hide the settings panel',
  'toolbar.sidebar.show': 'Show the settings panel',

  'toolbar.addImages': 'Add Images',
  'toolbar.addImages.tooltip': 'Pick single images to add to the queue',
  'toolbar.addFolder': 'Add Folder',
  'toolbar.addFolder.tooltip': 'Pick a folder and add every image inside it',

  'toolbar.start': 'Start Conversion',
  'toolbar.start.tooltip': 'Convert everything in the queue with the current settings',
  'toolbar.pause': 'Pause',
  'toolbar.pause.tooltip': 'Stop taking new images once the ones in flight have finished',
  'toolbar.resume': 'Resume',
  'toolbar.resume.tooltip': 'Carry on from where the run was paused',
  'toolbar.cancel': 'Cancel',
  'toolbar.cancel.tooltip': 'Stop the run. Files already written are kept',

  'toolbar.more': 'More tools',

  'toolbar.panel.preview': 'Live preview',
  'toolbar.panel.presets': 'Presets',
  'toolbar.panel.watch': 'Watch folder',
  'toolbar.panel.history': 'Run history',
  'toolbar.panel.diagnostics': 'Diagnostics',
  'toolbar.panel.about': 'About BICO',

  'toolbar.theme.dark': 'Dark theme',
  'toolbar.theme.light': 'Light theme',
  'toolbar.theme.system': 'Theme follows the system',
  'toolbar.theme.change': 'Change the theme',
  'toolbar.theme.tooltip': '{theme}. Click to change it.',

  'toolbar.confirm.title': 'Start the conversion',
  'toolbar.confirm.one': 'One image will be converted to {format}.',
  'toolbar.confirm.many': '{count} images will be converted to {format}.',
  'toolbar.confirm.oneOriginal': 'One image will be converted, keeping its own format.',
  'toolbar.confirm.manyOriginal': '{count} images will be converted, each keeping its own format.',
  'toolbar.confirm.ok': 'Start',
  'toolbar.confirm.cancel': 'Not yet',

  'toolbar.progress.aria': 'Conversion progress, {percent} percent complete',

  /* ================================================================ */
  /* Stat strip                                                        */
  /* ================================================================ */

  'stats.queued.one': 'Image queued',
  'stats.queued.many': 'Images queued',
  'stats.sourceSize': 'Source size',
  'stats.targetFormat.original': 'Original',
  'stats.targetFormat.originalTagline': 'Every file keeps its own format',
  'stats.targetFormat.originalHint': 'No container change is applied.',
  'stats.throughput.value': '{rate} MB/s',
  'stats.throughput.label': '{duration} remaining',
  'stats.estimate.label': 'Estimated output',
  'stats.estimate.pending': 'Estimating',
  'stats.estimate.smaller': '{percent}% smaller',
  'stats.estimate.larger': '{percent}% larger',

  /* ================================================================ */
  /* Status bar                                                        */
  /* ================================================================ */

  'statusbar.gpu.probing': 'Checking graphics support',
  'statusbar.gpu.probingDetail': 'BICO is still probing the available adapters.',
  'statusbar.gpu.unavailable': 'GPU unavailable, {reason}',
  'statusbar.gpu.unavailableReason': 'no compatible adapter was found',
  'statusbar.gpu.unavailableDetail': 'Every image will be processed on the CPU pipeline.',
  'statusbar.gpu.idle': 'GPU idle, {reason}',
  'statusbar.gpu.idleReason': 'acceleration is switched off in settings',
  'statusbar.gpu.idleDetail':
    'Change the processing backend in the performance settings to use it.',
  'statusbar.gpu.active': 'GPU acceleration on {device}',
  'statusbar.gpu.genericAdapter': 'graphics adapter',
  'statusbar.gpu.activeDetail':
    '{processed} images completed on GPU lanes, {fallbacks} fell back to the CPU.',
  'statusbar.gpu.openDiagnostics': 'Open the diagnostics panel',

  'statusbar.workers.one': 'One worker thread',
  'statusbar.workers.many': '{count} worker threads',
  'statusbar.workers.detail': 'CPU worker threads available to the conversion pool.',
  'statusbar.working': 'Working: {devices}',
  'statusbar.working.detail': 'Every lane currently holding an image.',

  'statusbar.output.folder': 'Folder',
  'statusbar.output.archive': 'Archive',
  'statusbar.output.inPlace': 'In place, each file is rewritten beside its source',
  'statusbar.output.inPlaceDetail':
    'Each source file is replaced by its converted version. Nothing is copied elsewhere.',
  'statusbar.output.label': '{label}:',
  'statusbar.output.revealHint': '{path}. Click to show in the file manager.',
  'statusbar.output.noArchive': 'No archive chosen yet',
  'statusbar.output.noFolder': 'No output folder chosen yet',
  'statusbar.output.noneDetail':
    'Choose a destination in the output section before starting a run.',

  'statusbar.rate.throughput': '{rate} MB/s',
  'statusbar.rate.throughputDetail': 'Source megabytes read per second across every lane.',
  'statusbar.rate.images': '{rate} images/s',
  'statusbar.rate.imagesDetail': 'Images finished per second across every lane.',

  /* ================================================================ */
  /* Command palette                                                   */
  /* ================================================================ */

  'palette.search.placeholder': 'Search commands, panels and presets',
  'palette.search.aria': 'Search commands',
  'palette.list.aria': 'Commands',
  'palette.empty': 'No command matches that search.',
  'palette.empty.hint': 'Try a shorter word or part of a preset name.',
  'palette.hint.move': 'Up and down to move',
  'palette.hint.run': 'Enter to run',
  'palette.hint.close': 'Escape to close',

  'palette.section.files': 'Files',
  'palette.section.conversion': 'Conversion',
  'palette.section.panels': 'Panels',
  'palette.section.appearance': 'Appearance',
  'palette.section.presets': 'Presets',
  'palette.section.help': 'Help',

  'palette.command.addFiles': 'Add images',
  'palette.command.addFiles.keywords': 'import open pictures photos browse',
  'palette.command.addFolder': 'Add a folder of images',
  'palette.command.addFolder.keywords': 'import directory recursive tree',
  'palette.command.outputFolder': 'Choose the output folder',
  'palette.command.outputFolder.keywords': 'destination save where target directory',
  'palette.command.outputZip': 'Write the output to a ZIP archive',
  'palette.command.outputZip.keywords': 'zip archive compress bundle package',
  'palette.command.removeSelected': 'Remove the selected image',
  'palette.command.removeSelected.keywords': 'delete drop discard row',
  'palette.command.clearQueue': 'Clear the queue',
  'palette.command.clearQueue.keywords': 'empty reset remove all start over',
  'palette.command.start': 'Start converting',
  'palette.command.start.keywords': 'run go begin process batch',
  'palette.command.pause': 'Pause or resume the run',
  'palette.command.pause.keywords': 'hold continue suspend',
  'palette.command.cancel': 'Cancel the run',
  'palette.command.cancel.keywords': 'stop abort halt',
  'palette.command.panelPreview': 'Open the live preview',
  'palette.command.panelPreview.keywords': 'compare before after wipe quality check',
  'palette.command.panelPresets': 'Manage presets',
  'palette.command.panelPresets.keywords': 'library saved recipes profiles',
  'palette.command.panelWatch': 'Configure the watch folder',
  'palette.command.panelWatch.keywords': 'hot folder automatic monitor drop',
  'palette.command.panelHistory': 'Open the run history',
  'palette.command.panelHistory.keywords': 'past previous log results',
  'palette.command.panelDiagnostics': 'Open diagnostics',
  'palette.command.panelDiagnostics.keywords': 'system gpu logs support troubleshooting',
  'palette.command.panelAbout': 'About BICO',
  'palette.command.panelAbout.keywords': 'version credits licence',
  'palette.command.themeDark': 'Use the dark theme',
  'palette.command.themeDark.keywords': 'night colour scheme',
  'palette.command.themeLight': 'Use the light theme',
  'palette.command.themeLight.keywords': 'day bright colour scheme',
  'palette.command.themeSystem': 'Match the system theme',
  'palette.command.themeSystem.keywords': 'auto os follow colour scheme',
  'palette.command.viewTable': 'Show the queue as a table',
  'palette.command.viewTable.keywords': 'list rows columns detail',
  'palette.command.viewGrid': 'Show the queue as a grid',
  'palette.command.viewGrid.keywords': 'thumbnails cards tiles gallery',
  'palette.command.toggleSidebar': 'Toggle the settings sidebar',
  'palette.command.toggleSidebar.keywords': 'hide show panel collapse',
  'palette.command.help': 'Open the BICO project page',
  'palette.command.help.keywords': 'documentation github readme support issues',
  'palette.command.applyPreset': 'Apply preset: {name}',

  /* ================================================================ */
  /* Run summary                                                       */
  /* ================================================================ */

  'summary.title': 'Run summary',
  'summary.result.cancelled': 'Run cancelled',
  'summary.result.partial': 'Finished with some failures',
  'summary.result.success': 'All images converted',
  'summary.format.original': 'their original format',
  'summary.subtitle.cancelled': 'Stopped after {processed} of {total} images.',
  'summary.subtitle.partial': '{processed} of {total} images written as {format}, {failed} failed.',
  'summary.subtitle.success': '{processed} images written as {format} in {duration}.',

  'summary.tile.converted': 'Converted',
  'summary.tile.failed': 'Failed',
  'summary.tile.skipped': 'Skipped',
  'summary.tile.totalTime': 'Total time',
  'summary.tile.averagePerImage': 'Average per image',
  'summary.tile.sizeBefore': 'Size before',
  'summary.tile.sizeAfter': 'Size after',
  'summary.tile.saved': 'Saved',
  'summary.tile.savedPercent': 'Saved percent',
  'summary.tile.savedPercentValue': '{percent} percent',

  'summary.lanes.title': 'Where the work happened',
  'summary.lanes.empty': 'No images completed, so there is nothing to split.',
  'summary.lanes.aria': '{gpu} images on GPU lanes and {cpu} on CPU workers',
  'summary.lanes.gpu': 'GPU {count} images, {percent} percent',
  'summary.lanes.cpu': 'CPU {count} images, {percent} percent',

  'summary.output.title': 'Output',
  'summary.output.unknown': 'The output location was not recorded for this run.',
  'summary.output.openReport': 'Open the CSV report',

  'summary.errors.one': 'One image could not be converted',
  'summary.errors.many': '{count} images could not be converted',
  'summary.errors.copy': 'Copy all failures',
  'summary.errors.copied': 'Copied every failure to the clipboard.'
} as const
