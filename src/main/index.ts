import { BrowserWindow, app, dialog } from 'electron'
import { join } from 'node:path'
import { errorMessage } from '@shared/utils'
import { registerIpc, forwardOpenedFiles } from './ipc'
import { buildMenu } from './menu'
import { registerSourceProtocol, registerSourceScheme } from './protocol'
import { WorkerPool } from './services/pool'
import { createLogger, flushLogs } from './services/logger'
import { scheduler } from './services/scheduler'
import { folderWatcher } from './services/watcher'
import { allowQuit, destroyTray, installTray } from './tray'
import { createMainWindow } from './window'

const log = createLogger('main')

let mainWindow: BrowserWindow | null = null
let pool: WorkerPool | null = null

/** Paths passed on the command line before the window exists. */
const queuedOpenPaths: string[] = []

// Must be called before the app is ready, so it sits at module scope.
registerSourceScheme()

/**
 * A second launch focuses the existing window instead of starting a new copy.
 *
 * This matters more than usual here: two instances would run two worker pools
 * against the same cores and each would be roughly half as fast.
 */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    forwardOpenedFiles(
      mainWindow,
      argv.slice(1).filter((arg) => !arg.startsWith('-'))
    )
  })
}

if (process.platform === 'win32') {
  // Without this the taskbar groups the app under the Electron icon and
  // notifications show up attributed to electron.exe.
  app.setAppUserModelId('com.shehari.bico')
}

/**
 * Ask Chromium for the discrete adapter.
 *
 * On a laptop with switchable graphics the GPU process defaults to the
 * integrated chip to save power, which would leave the discrete card idle even
 * though the whole point of the GPU pipeline is to use it. The renderer can
 * still enumerate both adapters afterwards.
 */
app.commandLine.appendSwitch('force_high_performance_gpu')
app.commandLine.appendSwitch('enable-features', 'Vulkan,CanvasOopRasterization')

/**
 * Opt in remote debugging for the end to end tests.
 *
 * Gated behind an environment variable and refused in packaged builds, because
 * an open DevTools port in a shipped application is a way into the renderer.
 */
if (!app.isPackaged && process.env.BICO_REMOTE_DEBUG) {
  app.commandLine.appendSwitch('remote-debugging-port', process.env.BICO_REMOTE_DEBUG)
}

app.on('open-file', (event, path) => {
  event.preventDefault()
  if (mainWindow) forwardOpenedFiles(mainWindow, [path])
  else queuedOpenPaths.push(path)
})

async function bootstrap(): Promise<void> {
  registerSourceProtocol()

  pool = new WorkerPool()
  const window = createMainWindow()
  mainWindow = window

  buildMenu(window)
  registerIpc(window, pool)
  installTray(window)

  if (process.env.ELECTRON_RENDERER_URL) {
    await window.loadURL(process.env.ELECTRON_RENDERER_URL)
    window.webContents.openDevTools({ mode: 'detach' })
  } else {
    await window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  const startupPaths = [
    ...queuedOpenPaths,
    ...process.argv.slice(app.isPackaged ? 1 : 2).filter((arg) => !arg.startsWith('-'))
  ]
  if (startupPaths.length > 0) {
    window.webContents.once('did-finish-load', () => {
      forwardOpenedFiles(window, startupPaths)
    })
  }

  window.on('closed', () => {
    mainWindow = null
  })

  // Waiting for the pool means the About panel can report the real sharp and
  // libvips versions the first time it is opened, rather than "unknown".
  void pool.whenReady().then(() => {
    log.info(`sharp ${pool?.poolInfo.sharp} with libvips ${pool?.poolInfo.libvips} is ready`)
  })
}

app
  .whenReady()
  .then(bootstrap)
  .catch((error) => {
    log.error('startup failed', error)
    dialog.showErrorBox('BICO could not start', errorMessage(error))
    app.quit()
  })

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) void bootstrap()
})

app.on('window-all-closed', () => {
  // With the tray installed and close to tray enabled the window is hidden
  // rather than destroyed, so this only fires on a genuine close.
  if (process.platform !== 'darwin') app.quit()
})

let shuttingDown = false

app.on('before-quit', (event) => {
  allowQuit()
  if (shuttingDown) return
  // A run in flight owns an open archive handle. Quitting without closing it
  // leaves a corrupt zip on disk, so the quit is deferred until it drains.
  if (!scheduler.isRunning) {
    shuttingDown = true
    void teardown()
    return
  }

  event.preventDefault()
  shuttingDown = true
  scheduler.cancel()
  void scheduler
    .waitForIdle()
    .catch(() => undefined)
    .then(teardown)
})

async function teardown(): Promise<void> {
  folderWatcher.stop()
  destroyTray()
  await pool?.destroy().catch(() => undefined)
  await flushLogs()
  app.exit(0)
}

process.on('uncaughtException', (error) => {
  log.error('uncaught exception in the main process', error)
})

process.on('unhandledRejection', (reason) => {
  log.error('unhandled rejection in the main process', reason)
})
