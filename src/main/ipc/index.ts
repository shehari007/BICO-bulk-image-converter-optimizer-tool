import { app, clipboard, dialog, ipcMain, shell } from 'electron'
import type { BrowserWindow } from 'electron'
import { writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { EVENT, INVOKE, SEND } from '@shared/channels'
import { DEFAULT_PREFERENCES, PREVIEW_MAX_EDGE, THUMBNAIL_SIZE } from '@shared/defaults'
import { READABLE_EXTENSIONS } from '@shared/formats'
import { errorMessage, uid } from '@shared/utils'
import { estimateRunBytes } from '../services/estimate'
import { addPaths, clearFiles, getFile, getFiles, removeFiles, sourceUrl } from '../services/files'
import { clearInspectionCaches, exifFor, probeFile, thumbnailFor } from '../services/inspect'
import { gpuBridge } from '../services/gpu-bridge'
import { clearHistory, listHistory, recordRun } from '../services/history'
import { createLogger, onLog } from '../services/logger'
import {
  deletePreset,
  exportPreset,
  importPresets,
  listPresets,
  savePreset
} from '../services/presets'
import { scheduler } from '../services/scheduler'
import { readStats, recordStats, resetStats } from '../services/stats'
import { JsonStore } from '../services/store'
import { collectGpuReport, collectSystemInfo } from '../services/sysinfo'
import {
  checkForUpdates,
  currentUpdateState,
  downloadUpdate,
  installUpdate,
  onUpdateState
} from '../services/updater'
import { folderWatcher } from '../services/watcher'
import { notifyComplete, setHideOnClose, updateTrayProgress } from '../tray'
import { setTaskbarProgress } from '../window'
import type { WorkerPool } from '../services/pool'
import type {
  AddFilesOptions,
  AppPreferences,
  ConversionSettings,
  ConvertRequest,
  GpuStatus,
  GpuTaskResult,
  PickResult,
  Preset,
  PreviewRequest,
  PreviewResult,
  RunSummary,
  WatchConfig
} from '@shared/types'

const log = createLogger('ipc')

const prefsStore = new JsonStore<AppPreferences>('preferences.json', DEFAULT_PREFERENCES)

const IMAGE_FILTERS = [
  { name: 'Images', extensions: [...READABLE_EXTENSIONS] },
  { name: 'All Files', extensions: ['*'] }
]

const CANCELLED: PickResult = { cancelled: true, paths: [] }

/**
 * Registers every handler the renderer can reach.
 *
 * Handlers are deliberately thin. Anything with real logic lives in a service so
 * it can be reasoned about without an Electron window in the picture, and so the
 * watch folder can drive the same code path as a button click.
 */
export function registerIpc(window: BrowserWindow, pool: WorkerPool): void {
  const send = (channel: string, payload: unknown): void => {
    if (!window.isDestroyed()) window.webContents.send(channel, payload)
  }

  /* ================================================================ */
  /* System                                                            */
  /* ================================================================ */

  ipcMain.handle(INVOKE.systemInfo, async () => {
    const info = await collectSystemInfo()
    const poolInfo = pool.poolInfo
    // The pool knows the real sharp build in use, which is more trustworthy
    // than a second import in the main process.
    return {
      ...info,
      imaging: {
        ...info.imaging,
        sharp: poolInfo.sharp !== 'unknown' ? poolInfo.sharp : info.imaging.sharp,
        libvips: poolInfo.libvips !== 'unknown' ? poolInfo.libvips : info.imaging.libvips
      }
    }
  })

  ipcMain.handle(INVOKE.systemGpuReport, () => collectGpuReport())

  ipcMain.handle(INVOKE.systemOpenExternal, async (_event, url: string) => {
    // Only http and https are ever handed to the shell. Allowing arbitrary
    // schemes here is how a link turns into command execution on Windows.
    if (!/^https?:\/\//i.test(url)) return false
    await shell.openExternal(url)
    return true
  })

  ipcMain.handle(INVOKE.systemOpenPath, async (_event, target: string) => {
    const result = await shell.openPath(target)
    return result === ''
  })

  ipcMain.handle(INVOKE.systemRevealPath, (_event, target: string) => {
    shell.showItemInFolder(target)
  })

  ipcMain.handle(INVOKE.systemCopyText, (_event, text: string) => {
    clipboard.writeText(text)
  })

  ipcMain.handle(INVOKE.systemRelaunch, () => {
    app.relaunch()
    app.exit(0)
  })

  /* ================================================================ */
  /* Dialogs                                                           */
  /* ================================================================ */

  ipcMain.handle(INVOKE.dialogPickFiles, async (): Promise<PickResult> => {
    const result = await dialog.showOpenDialog(window, {
      title: 'Add images',
      buttonLabel: 'Add',
      properties: ['openFile', 'multiSelections', 'dontAddToRecent'],
      filters: IMAGE_FILTERS
    })
    return result.canceled ? CANCELLED : { cancelled: false, paths: result.filePaths }
  })

  ipcMain.handle(INVOKE.dialogPickFolders, async (): Promise<PickResult> => {
    const result = await dialog.showOpenDialog(window, {
      title: 'Add a folder of images',
      buttonLabel: 'Add folder',
      properties: ['openDirectory', 'multiSelections', 'dontAddToRecent']
    })
    return result.canceled ? CANCELLED : { cancelled: false, paths: result.filePaths }
  })

  ipcMain.handle(INVOKE.dialogPickOutputFolder, async (): Promise<PickResult> => {
    const result = await dialog.showOpenDialog(window, {
      title: 'Choose an output folder',
      buttonLabel: 'Use this folder',
      properties: ['openDirectory', 'createDirectory']
    })
    return result.canceled ? CANCELLED : { cancelled: false, paths: result.filePaths }
  })

  ipcMain.handle(
    INVOKE.dialogPickZipPath,
    async (_event, defaultName: string): Promise<PickResult> => {
      const result = await dialog.showSaveDialog(window, {
        title: 'Save the archive as',
        defaultPath: defaultName || 'bico-output.zip',
        filters: [{ name: 'ZIP archive', extensions: ['zip'] }]
      })
      return result.canceled || !result.filePath
        ? CANCELLED
        : { cancelled: false, paths: [result.filePath] }
    }
  )

  ipcMain.handle(INVOKE.dialogPickImage, async (): Promise<PickResult> => {
    const result = await dialog.showOpenDialog(window, {
      title: 'Choose a watermark image',
      properties: ['openFile', 'dontAddToRecent'],
      filters: [{ name: 'Images', extensions: ['png', 'webp', 'jpg', 'jpeg', 'svg'] }]
    })
    return result.canceled ? CANCELLED : { cancelled: false, paths: result.filePaths }
  })

  ipcMain.handle(INVOKE.dialogPickJson, async (): Promise<PickResult> => {
    const result = await dialog.showOpenDialog(window, {
      title: 'Import presets',
      properties: ['openFile', 'dontAddToRecent'],
      filters: [{ name: 'BICO presets', extensions: ['json'] }]
    })
    return result.canceled ? CANCELLED : { cancelled: false, paths: result.filePaths }
  })

  ipcMain.handle(
    INVOKE.dialogSaveJson,
    async (_event, defaultName: string, contents: string): Promise<PickResult> => {
      const result = await dialog.showSaveDialog(window, {
        title: 'Export',
        defaultPath: defaultName,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })
      if (result.canceled || !result.filePath) return CANCELLED
      await writeFile(result.filePath, contents, 'utf8')
      return { cancelled: false, paths: [result.filePath] }
    }
  )

  /* ================================================================ */
  /* Files                                                             */
  /* ================================================================ */

  ipcMain.handle(INVOKE.filesAdd, (_event, paths: string[], options: AddFilesOptions) =>
    addPaths(paths, options)
  )

  ipcMain.handle(INVOKE.filesProbe, async (_event, fileId: string) => {
    const file = getFile(fileId)
    return file ? probeFile(file) : null
  })

  ipcMain.handle(INVOKE.filesThumbnail, async (_event, fileId: string, size: number) => {
    const file = getFile(fileId)
    return file ? thumbnailFor(file, size || THUMBNAIL_SIZE) : null
  })

  ipcMain.handle(INVOKE.filesExif, async (_event, fileId: string) => {
    const file = getFile(fileId)
    return file ? exifFor(file) : []
  })

  ipcMain.handle(INVOKE.filesSourceUrl, (_event, fileId: string) =>
    getFile(fileId) ? sourceUrl(fileId) : ''
  )

  // The registry rejects a path it has already seen, so removing a file from the
  // queue has to release it here too. Without this, clearing the queue and
  // dropping the same folder back in would import nothing at all.
  ipcMain.handle(INVOKE.filesRelease, (_event, fileIds: string[]) => {
    removeFiles(fileIds)
  })

  ipcMain.handle(INVOKE.filesClear, () => {
    clearFiles()
    clearInspectionCaches()
  })

  /* ================================================================ */
  /* Conversion                                                        */
  /* ================================================================ */

  ipcMain.handle(INVOKE.convertStart, async (_event, request: ConvertRequest) => {
    await pool.reconfigure({
      size: request.settings.performance.concurrency,
      vipsConcurrency: request.settings.performance.vipsConcurrency,
      cacheMemoryMb: request.settings.performance.cacheMemoryMb
    })
    return scheduler.start(request)
  })

  ipcMain.handle(INVOKE.convertPause, () => scheduler.pause())
  ipcMain.handle(INVOKE.convertResume, () => scheduler.resume())
  ipcMain.handle(INVOKE.convertCancel, () => scheduler.cancel())

  ipcMain.handle(
    INVOKE.convertEstimate,
    async (_event, fileIds: string[], settings: ConversionSettings) => {
      const files = getFiles(fileIds)
      const measured = await Promise.all(
        files.map(async (file) => {
          const probe = await probeFile(file)
          return {
            bytes: file.size,
            pixels: probe ? probe.width * probe.height : 0
          }
        })
      )
      return estimateRunBytes(measured, settings)
    }
  )

  /* ================================================================ */
  /* Preview                                                           */
  /* ================================================================ */

  ipcMain.handle(
    INVOKE.previewRender,
    async (_event, request: PreviewRequest): Promise<PreviewResult | null> => {
      const file = getFile(request.fileId)
      if (!file) return null

      try {
        const response = await pool.preview({
          jobId: uid('preview'),
          path: file.path,
          settings: request.settings,
          maxEdge: request.maxEdge || PREVIEW_MAX_EDGE
        })

        if (!response.ok) {
          log.debug(`preview failed for ${file.name}: ${response.error ?? 'unknown'}`)
          return null
        }

        return {
          dataUrl: response.dataUrl,
          originalDataUrl: response.originalDataUrl,
          width: response.width,
          height: response.height,
          originalBytes: response.originalBytes || file.size,
          estimatedBytes: response.estimatedBytes,
          encodedBytes: response.encodedBytes,
          durationMs: response.durationMs,
          format: request.settings.format,
          // Non null when the worker could not encode the requested format and
          // substituted another one, so the panel can label the readout rather
          // than presenting a PNG byte count as if it were an AVIF.
          fallback: response.fallback
        }
      } catch (error) {
        log.debug(`preview threw for ${file.name}: ${errorMessage(error)}`)
        return null
      }
    }
  )

  /* ================================================================ */
  /* Presets and preferences                                           */
  /* ================================================================ */

  ipcMain.handle(INVOKE.presetsList, () => listPresets())
  ipcMain.handle(INVOKE.presetsSave, (_event, preset: Preset) => savePreset(preset))
  ipcMain.handle(INVOKE.presetsDelete, (_event, id: string) => deletePreset(id))

  ipcMain.handle(INVOKE.presetsImport, async () => {
    const picked = await dialog.showOpenDialog(window, {
      title: 'Import presets',
      properties: ['openFile', 'dontAddToRecent'],
      filters: [{ name: 'BICO presets', extensions: ['json'] }]
    })
    const path = picked.canceled ? undefined : picked.filePaths[0]
    if (!path) return listPresets()
    return importPresets(path)
  })

  ipcMain.handle(INVOKE.presetsExport, async (_event, id: string) => {
    const preset = listPresets().find((candidate) => candidate.id === id)
    if (!preset) return false

    const picked = await dialog.showSaveDialog(window, {
      title: 'Export preset',
      defaultPath: `${preset.name.replace(/[^\w -]+/g, '')}.json`,
      filters: [{ name: 'BICO presets', extensions: ['json'] }]
    })
    if (picked.canceled || !picked.filePath) return false
    return exportPreset(id, picked.filePath)
  })

  ipcMain.handle(INVOKE.prefsLoad, () => prefsStore.read())
  ipcMain.handle(INVOKE.prefsSave, (_event, patch: Partial<AppPreferences>) =>
    prefsStore.merge(patch)
  )

  /* ================================================================ */
  /* History                                                           */
  /* ================================================================ */

  ipcMain.handle(INVOKE.historyList, () => listHistory())
  ipcMain.handle(INVOKE.historyClear, () => clearHistory())

  /* ================================================================ */
  /* Lifetime statistics                                               */
  /* ================================================================ */

  ipcMain.handle(INVOKE.statsRead, () => readStats())
  ipcMain.handle(INVOKE.statsReset, () => resetStats())

  /* ================================================================ */
  /* Watch folder                                                      */
  /* ================================================================ */

  ipcMain.handle(INVOKE.watchStart, (_event, config: WatchConfig, settings: ConversionSettings) =>
    folderWatcher.start(config, settings)
  )
  ipcMain.handle(INVOKE.watchStop, () => folderWatcher.stop())
  ipcMain.handle(INVOKE.watchStatus, () => folderWatcher.getStatus())

  /* ================================================================ */
  /* Updates                                                           */
  /* ================================================================ */

  ipcMain.handle(INVOKE.updateCheck, () => checkForUpdates())
  ipcMain.handle(INVOKE.updateDownload, () => downloadUpdate())
  ipcMain.handle(INVOKE.updateInstall, () => installUpdate())

  /* ================================================================ */
  /* Window controls                                                   */
  /* ================================================================ */

  ipcMain.handle(INVOKE.windowMinimise, () => window.minimize())
  ipcMain.handle(INVOKE.windowMaximise, () => {
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
    return window.isMaximized()
  })
  ipcMain.handle(INVOKE.windowClose, () => window.close())
  ipcMain.handle(INVOKE.windowIsMaximised, () => window.isMaximized())

  /* ================================================================ */
  /* Renderer pushes                                                   */
  /* ================================================================ */

  ipcMain.on(SEND.gpuStatus, (_event, status: GpuStatus) => {
    gpuBridge.publishStatus(status)
  })

  ipcMain.on(SEND.gpuTaskResult, (_event, result: GpuTaskResult) => {
    gpuBridge.settle(result)
  })

  ipcMain.on(SEND.rendererReady, () => {
    gpuBridge.attach(window.webContents)
    send(EVENT.updateState, currentUpdateState())
  })

  /* ================================================================ */
  /* Outbound event wiring                                             */
  /* ================================================================ */

  const prefs = prefsStore.read()

  // The tray reads this rather than importing the preference store, which would
  // be a cycle: the store belongs to the IPC layer and the IPC layer drives the
  // tray.
  setHideOnClose(() => prefsStore.read().minimiseToTray)

  scheduler.bind(pool, {
    onJob: (update) => send(EVENT.jobUpdate, update),
    onProgress: (progress) => {
      send(EVENT.runProgress, progress)
      updateTrayProgress(progress)
      if (prefsStore.read().taskbarProgress) {
        setTaskbarProgress(window, progress.state === 'running' ? progress.percent / 100 : -1)
      }
    },
    onComplete: (summary: RunSummary) => {
      recordRun(summary)
      // The history keeps the last fifty runs, this keeps the totals that
      // outlive them, so both have to be fed from the same event.
      recordStats(summary)
      setTaskbarProgress(window, -1)
      notifyComplete(summary, prefsStore.read().notifyOnComplete)
      send(EVENT.runComplete, summary)
    }
  })

  const disposers = [
    onLog((record) => send(EVENT.log, record)),
    onUpdateState((info) => send(EVENT.updateState, info)),
    folderWatcher.onStatus((status) => send(EVENT.watchStatus, status))
  ]

  window.on('closed', () => {
    for (const dispose of disposers) dispose()
    gpuBridge.detach()
  })

  if (prefs.autoCheckUpdates) {
    // Delayed so the check never competes with the first paint.
    setTimeout(() => void checkForUpdates(), 8000)
  }
}

/** Files handed to the app by the shell, for example via "Open with". */
export function forwardOpenedFiles(window: BrowserWindow, paths: readonly string[]): void {
  const images = paths.filter((path) => {
    const ext = basename(path).split('.').pop()?.toLowerCase() ?? ''
    return (READABLE_EXTENSIONS as readonly string[]).includes(ext)
  })
  if (images.length === 0) return
  if (!window.isDestroyed()) window.webContents.send(EVENT.openFiles, images)
}
