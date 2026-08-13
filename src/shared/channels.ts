/**
 * Every IPC channel name used by the app.
 *
 * Keeping them in a frozen object means a typo becomes a compile error rather
 * than a message that silently never arrives. Channels are grouped by the
 * direction they travel in.
 */

/** Renderer calls, main answers. Always used with ipcRenderer.invoke. */
export const INVOKE = {
  systemInfo: 'system:info',
  systemGpuReport: 'system:gpu-report',
  systemOpenExternal: 'system:open-external',
  systemOpenPath: 'system:open-path',
  systemRevealPath: 'system:reveal-path',
  systemCopyText: 'system:copy-text',
  systemRelaunch: 'system:relaunch',

  dialogPickFiles: 'dialog:pick-files',
  dialogPickFolders: 'dialog:pick-folders',
  dialogPickOutputFolder: 'dialog:pick-output-folder',
  dialogPickZipPath: 'dialog:pick-zip-path',
  dialogPickImage: 'dialog:pick-image',
  dialogPickJson: 'dialog:pick-json',
  dialogSaveJson: 'dialog:save-json',

  filesAdd: 'files:add',
  filesProbe: 'files:probe',
  filesThumbnail: 'files:thumbnail',
  filesExif: 'files:exif',
  filesSourceUrl: 'files:source-url',
  filesRelease: 'files:release',
  filesClear: 'files:clear',

  convertStart: 'convert:start',
  convertPause: 'convert:pause',
  convertResume: 'convert:resume',
  convertCancel: 'convert:cancel',
  convertEstimate: 'convert:estimate',

  previewRender: 'preview:render',

  presetsList: 'presets:list',
  presetsSave: 'presets:save',
  presetsDelete: 'presets:delete',
  presetsImport: 'presets:import',
  presetsExport: 'presets:export',

  prefsLoad: 'prefs:load',
  prefsSave: 'prefs:save',

  historyList: 'history:list',
  historyClear: 'history:clear',

  statsRead: 'stats:read',
  statsReset: 'stats:reset',

  watchStart: 'watch:start',
  watchStop: 'watch:stop',
  watchStatus: 'watch:status',

  updateCheck: 'update:check',
  updateDownload: 'update:download',
  updateInstall: 'update:install',

  windowMinimise: 'window:minimise',
  windowMaximise: 'window:maximise',
  windowClose: 'window:close',
  windowIsMaximised: 'window:is-maximised'
} as const

/** Main pushes, renderer listens. */
export const EVENT = {
  jobUpdate: 'event:job-update',
  runProgress: 'event:run-progress',
  runComplete: 'event:run-complete',
  log: 'event:log',
  updateState: 'event:update-state',
  watchStatus: 'event:watch-status',
  windowState: 'event:window-state',
  menuCommand: 'event:menu-command',
  openFiles: 'event:open-files',
  gpuTask: 'event:gpu-task'
} as const

/** Renderer pushes, main listens. Fire and forget. */
export const SEND = {
  gpuStatus: 'send:gpu-status',
  gpuTaskResult: 'send:gpu-task-result',
  rendererReady: 'send:renderer-ready'
} as const

export type InvokeChannel = (typeof INVOKE)[keyof typeof INVOKE]
export type EventChannel = (typeof EVENT)[keyof typeof EVENT]
export type SendChannel = (typeof SEND)[keyof typeof SEND]

/** Custom scheme the GPU worker fetches source images through. */
export const SOURCE_PROTOCOL = 'bico-src'
