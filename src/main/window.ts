import { BrowserWindow, app, screen, shell } from 'electron'
import { join } from 'node:path'
import { EVENT } from '@shared/channels'
import { clamp } from '@shared/utils'
import { JsonStore } from './services/store'
import { createLogger } from './services/logger'
import type { WindowState } from '@shared/types'

const log = createLogger('window')

const DEFAULT_STATE: WindowState = {
  x: null,
  y: null,
  width: 1440,
  height: 900,
  maximised: false
}

const stateStore = new JsonStore<WindowState>('window-state.json', DEFAULT_STATE)

/**
 * Restores the saved geometry, but only if it still lands on a connected
 * display.
 *
 * Someone who undocks a laptop would otherwise get a window positioned on a
 * monitor that no longer exists, which on Windows means an app that launches
 * completely off screen with no way to drag it back.
 */
function restoreBounds(): WindowState {
  const saved = stateStore.read()
  if (saved.x === null || saved.y === null) return saved

  const displays = screen.getAllDisplays()
  const visible = displays.some((display) => {
    const area = display.workArea
    return (
      saved.x !== null &&
      saved.y !== null &&
      saved.x + saved.width > area.x &&
      saved.y + saved.height > area.y &&
      saved.x < area.x + area.width &&
      saved.y < area.y + area.height
    )
  })

  if (!visible) {
    log.info('saved window position is off screen, centring instead')
    return { ...saved, x: null, y: null }
  }

  return saved
}

/** Platform names as people actually say them, not as Node reports them. */
function platformLabel(): string {
  switch (process.platform) {
    case 'win32':
      return 'Windows'
    case 'darwin':
      return 'macOS'
    case 'linux':
      return 'Linux'
    default:
      return process.platform
  }
}

/** Architecture names people recognise from a download page. */
function archLabel(): string {
  switch (process.arch) {
    case 'x64':
      return 'x64'
    case 'arm64':
      return 'arm64'
    case 'ia32':
      return 'x86'
    default:
      return process.arch
  }
}

/**
 * The window title carries the product name and the build identity.
 *
 * The short name alone tells a new user nothing, and an alt tab list full of
 * four letter acronyms is not helpful. Spelling the product out costs a few
 * characters and answers what the window is. The version and architecture
 * follow, so a bug report that starts with a screenshot already says which
 * build produced it.
 */
export function windowTitle(): string {
  return `BICO ${app.getVersion()} | Bulk Image Converter and Optimizer | ${platformLabel()} ${archLabel()}`
}

export function createMainWindow(): BrowserWindow {
  const saved = restoreBounds()
  const primary = screen.getPrimaryDisplay().workAreaSize

  const window = new BrowserWindow({
    width: clamp(saved.width, 900, primary.width),
    height: clamp(saved.height, 620, primary.height),
    ...(saved.x !== null && saved.y !== null ? { x: saved.x, y: saved.y } : {}),
    // The layout collapses the sidebar into a drawer below 900 pixels, so the
    // window can legitimately go much narrower than v2 allowed.
    minWidth: 720,
    minHeight: 560,
    show: false,
    title: windowTitle(),
    backgroundColor: '#0b0e14',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // The renderer has no Node access at all. Everything privileged goes
      // through the typed bridge in the preload, which is the single reason
      // this app can accept a dropped folder without also handing the page the
      // ability to read the rest of the disk.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      spellcheck: false
    }
  })

  // The document title would otherwise win. The build identity in the title bar
  // is more useful to a bug report than anything the page would put there.
  window.on('page-title-updated', (event) => event.preventDefault())

  if (saved.maximised) window.maximize()

  window.once('ready-to-show', () => {
    window.show()
    if (!saved.maximised && saved.x === null) window.center()
  })

  const persist = (): void => {
    if (window.isDestroyed()) return
    const maximised = window.isMaximized()
    // Normal bounds are read rather than current bounds, so restoring a window
    // that was closed while maximised gives back a usable size.
    const bounds = window.getNormalBounds()
    stateStore.write({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      maximised
    })
  }

  window.on('resize', persist)
  window.on('move', persist)
  window.on('close', () => {
    persist()
    stateStore.flush()
  })

  const broadcastState = (): void => {
    if (!window.isDestroyed()) window.webContents.send(EVENT.windowState, window.isMaximized())
  }
  window.on('maximize', broadcastState)
  window.on('unmaximize', broadcastState)
  window.on('enter-full-screen', broadcastState)
  window.on('leave-full-screen', broadcastState)

  // Anything that tries to open a new window is a link, so it goes to the real
  // browser instead of spawning an unsandboxed Electron window.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  window.webContents.on('will-navigate', (event, url) => {
    // Taken from the address the renderer was actually loaded from rather than
    // a port written out a second time here, which would silently stop matching
    // the moment the dev server moved.
    const devServer = process.env.ELECTRON_RENDERER_URL
    const isDevServer = devServer !== undefined && url.startsWith(devServer)
    const isLocalFile = url.startsWith('file://')
    if (!isDevServer && !isLocalFile) {
      event.preventDefault()
      if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    }
  })

  window.webContents.on('render-process-gone', (_event, details) => {
    log.error(`renderer process gone: ${details.reason} (exit code ${details.exitCode})`)
  })

  return window
}

/** Drives the Windows and macOS taskbar progress indicator during a run. */
export function setTaskbarProgress(window: BrowserWindow | null, fraction: number): void {
  if (!window || window.isDestroyed()) return
  // A negative value clears the indicator, which is what the end of a run wants.
  window.setProgressBar(fraction >= 1 || fraction < 0 ? -1 : fraction)
}
