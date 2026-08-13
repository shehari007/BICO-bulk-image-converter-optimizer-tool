import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron'
import { EVENT, INVOKE, SEND } from '@shared/channels'
import type { BicoApi, Unsubscribe } from '@shared/api'
import type {
  AddFilesOptions,
  AppPreferences,
  ConversionSettings,
  ConvertRequest,
  GpuStatus,
  GpuTaskResult,
  Preset,
  PreviewRequest,
  WatchConfig
} from '@shared/types'

/**
 * Wraps a main to renderer channel in a subscription that can be torn down.
 *
 * React effects mount and unmount constantly during development with fast
 * refresh, and without the returned disposer every remount would stack another
 * listener until the emitter warning fires and events run many times over.
 */
function subscribe<T>(channel: string, callback: (payload: T) => void): Unsubscribe {
  const handler = (_event: IpcRendererEvent, payload: T): void => callback(payload)
  ipcRenderer.on(channel, handler)
  return () => {
    ipcRenderer.removeListener(channel, handler)
  }
}

const api: BicoApi = {
  system: {
    info: () => ipcRenderer.invoke(INVOKE.systemInfo),
    gpuReport: () => ipcRenderer.invoke(INVOKE.systemGpuReport),
    openExternal: (url: string) => ipcRenderer.invoke(INVOKE.systemOpenExternal, url),
    openPath: (target: string) => ipcRenderer.invoke(INVOKE.systemOpenPath, target),
    revealPath: (target: string) => ipcRenderer.invoke(INVOKE.systemRevealPath, target),
    copyText: (text: string) => ipcRenderer.invoke(INVOKE.systemCopyText, text),
    relaunch: () => ipcRenderer.invoke(INVOKE.systemRelaunch)
  },

  dialog: {
    pickFiles: () => ipcRenderer.invoke(INVOKE.dialogPickFiles),
    pickFolders: () => ipcRenderer.invoke(INVOKE.dialogPickFolders),
    pickOutputFolder: () => ipcRenderer.invoke(INVOKE.dialogPickOutputFolder),
    pickZipPath: (defaultName: string) => ipcRenderer.invoke(INVOKE.dialogPickZipPath, defaultName),
    pickImage: () => ipcRenderer.invoke(INVOKE.dialogPickImage),
    pickJson: () => ipcRenderer.invoke(INVOKE.dialogPickJson),
    saveJson: (defaultName: string, contents: string) =>
      ipcRenderer.invoke(INVOKE.dialogSaveJson, defaultName, contents)
  },

  files: {
    add: (paths: string[], options: AddFilesOptions) =>
      ipcRenderer.invoke(INVOKE.filesAdd, paths, options),
    probe: (fileId: string) => ipcRenderer.invoke(INVOKE.filesProbe, fileId),
    thumbnail: (fileId: string, size: number) =>
      ipcRenderer.invoke(INVOKE.filesThumbnail, fileId, size),
    exif: (fileId: string) => ipcRenderer.invoke(INVOKE.filesExif, fileId),
    sourceUrl: (fileId: string) => ipcRenderer.invoke(INVOKE.filesSourceUrl, fileId),
    release: (fileIds: string[]) => ipcRenderer.invoke(INVOKE.filesRelease, fileIds),
    clear: () => ipcRenderer.invoke(INVOKE.filesClear)
  },

  convert: {
    start: (request: ConvertRequest) => ipcRenderer.invoke(INVOKE.convertStart, request),
    pause: () => ipcRenderer.invoke(INVOKE.convertPause),
    resume: () => ipcRenderer.invoke(INVOKE.convertResume),
    cancel: () => ipcRenderer.invoke(INVOKE.convertCancel),
    estimate: (fileIds: string[], settings: ConversionSettings) =>
      ipcRenderer.invoke(INVOKE.convertEstimate, fileIds, settings)
  },

  preview: {
    render: (request: PreviewRequest) => ipcRenderer.invoke(INVOKE.previewRender, request)
  },

  presets: {
    list: () => ipcRenderer.invoke(INVOKE.presetsList),
    save: (preset: Preset) => ipcRenderer.invoke(INVOKE.presetsSave, preset),
    remove: (id: string) => ipcRenderer.invoke(INVOKE.presetsDelete, id),
    importFromFile: () => ipcRenderer.invoke(INVOKE.presetsImport),
    exportToFile: (id: string) => ipcRenderer.invoke(INVOKE.presetsExport, id)
  },

  prefs: {
    load: () => ipcRenderer.invoke(INVOKE.prefsLoad),
    save: (patch: Partial<AppPreferences>) => ipcRenderer.invoke(INVOKE.prefsSave, patch)
  },

  history: {
    list: () => ipcRenderer.invoke(INVOKE.historyList),
    clear: () => ipcRenderer.invoke(INVOKE.historyClear)
  },

  stats: {
    read: () => ipcRenderer.invoke(INVOKE.statsRead),
    reset: () => ipcRenderer.invoke(INVOKE.statsReset)
  },

  watch: {
    start: (config: WatchConfig, settings: ConversionSettings) =>
      ipcRenderer.invoke(INVOKE.watchStart, config, settings),
    stop: () => ipcRenderer.invoke(INVOKE.watchStop),
    status: () => ipcRenderer.invoke(INVOKE.watchStatus)
  },

  updates: {
    check: () => ipcRenderer.invoke(INVOKE.updateCheck),
    download: () => ipcRenderer.invoke(INVOKE.updateDownload),
    install: () => ipcRenderer.invoke(INVOKE.updateInstall)
  },

  window: {
    minimise: () => ipcRenderer.invoke(INVOKE.windowMinimise),
    toggleMaximise: () => ipcRenderer.invoke(INVOKE.windowMaximise),
    close: () => ipcRenderer.invoke(INVOKE.windowClose),
    isMaximised: () => ipcRenderer.invoke(INVOKE.windowIsMaximised)
  },

  gpu: {
    publishStatus: (status: GpuStatus) => ipcRenderer.send(SEND.gpuStatus, status),
    postResult: (result: GpuTaskResult) => {
      // The encoded bytes or raw pixels are the payload here. Electron's
      // serialiser copies ArrayBuffers rather than transferring them, so the
      // GPU worker deliberately keeps these as small as the route allows.
      ipcRenderer.send(SEND.gpuTaskResult, result)
    }
  },

  on: {
    jobUpdate: (cb) => subscribe(EVENT.jobUpdate, cb),
    runProgress: (cb) => subscribe(EVENT.runProgress, cb),
    runComplete: (cb) => subscribe(EVENT.runComplete, cb),
    log: (cb) => subscribe(EVENT.log, cb),
    updateState: (cb) => subscribe(EVENT.updateState, cb),
    watchStatus: (cb) => subscribe(EVENT.watchStatus, cb),
    windowState: (cb) => subscribe(EVENT.windowState, cb),
    menuCommand: (cb) => subscribe(EVENT.menuCommand, cb),
    openFiles: (cb) => subscribe(EVENT.openFiles, cb),
    gpuTask: (cb) => subscribe(EVENT.gpuTask, cb)
  },

  ready: () => ipcRenderer.send(SEND.rendererReady)
}

/**
 * Recovers real filesystem paths from a drag and drop event.
 *
 * `File.path` was removed in Electron 32, so a dropped folder can no longer be
 * read from the DataTransfer directly. `webUtils.getPathForFile` is the
 * supported replacement and only exists in the preload, which is why the
 * renderer gets a narrow helper rather than the whole module.
 */
const dropSupport = {
  pathsFor(files: readonly File[]): string[] {
    const paths: string[] = []
    for (const file of files) {
      try {
        const path = webUtils.getPathForFile(file)
        if (path) paths.push(path)
      } catch {
        // A synthetic File object has no backing path, which is fine to skip.
      }
    }
    return paths
  }
}

contextBridge.exposeInMainWorld('bico', api)
contextBridge.exposeInMainWorld('bicoDrop', dropSupport)

export type BicoDropSupport = typeof dropSupport
