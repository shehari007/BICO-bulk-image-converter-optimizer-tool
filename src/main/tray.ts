import { Menu, Notification, Tray, app, nativeImage } from 'electron'
import { join } from 'node:path'
import { EVENT } from '@shared/channels'
import { formatBytes, formatDuration } from '@shared/utils'
import { createLogger } from './services/logger'
import { folderWatcher } from './services/watcher'
import type { BrowserWindow } from 'electron'
import type { RunProgress, RunSummary } from '@shared/types'

const log = createLogger('tray')

let tray: Tray | null = null
let target: BrowserWindow | null = null
let latest: RunProgress | null = null

/**
 * The tray icon lives next to the packaged binary rather than inside the asar,
 * because a native image cannot be read from an archive.
 */
function iconPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'resources', 'tray.png')
    : join(app.getAppPath(), 'resources', 'tray.png')
}

function buildMenu(): Menu {
  const watch = folderWatcher.getStatus()

  const running = latest !== null && (latest.state === 'running' || latest.state === 'paused')
  const progressLabel = running
    ? `${latest?.completed ?? 0} of ${latest?.total ?? 0} converted, ${Math.round(latest?.percent ?? 0)} percent`
    : 'Idle'

  return Menu.buildFromTemplate([
    { label: 'BICO', enabled: false },
    { label: progressLabel, enabled: false },
    ...(watch.running ? [{ label: `Watching ${watch.folder}`, enabled: false } as const] : []),
    { type: 'separator' },
    { label: 'Show window', click: () => reveal() },
    ...(running
      ? [
          {
            label: latest?.state === 'paused' ? 'Resume conversion' : 'Pause conversion',
            click: () => send('pause')
          },
          { label: 'Cancel conversion', click: () => send('cancel') }
        ]
      : [{ label: 'Add images', click: () => send('add-files') }]),
    { type: 'separator' },
    {
      label: 'Quit BICO',
      click: () => {
        // The tray is what keeps the app alive with no window, so quitting from
        // here has to be unconditional.
        allowQuit()
        app.quit()
      }
    }
  ])
}

function send(command: string): void {
  reveal()
  if (target && !target.isDestroyed()) target.webContents.send(EVENT.menuCommand, command)
}

function reveal(): void {
  if (!target || target.isDestroyed()) return
  if (target.isMinimized()) target.restore()
  target.show()
  target.focus()
}

let quitting = false

export function allowQuit(): void {
  quitting = true
}

export function isQuitting(): boolean {
  return quitting
}

/**
 * Installs the tray and the close to tray behaviour.
 *
 * This exists mostly for the hot folder: a watch that only runs while a window
 * is open is not automation, it is a window you are not allowed to close.
 */
export function installTray(window: BrowserWindow): void {
  target = window

  try {
    const image = nativeImage.createFromPath(iconPath())
    if (image.isEmpty()) {
      log.warn('the tray icon could not be loaded, running without a tray')
      return
    }

    // macOS renders the tray icon at 16 points and expects a template image so
    // it inverts correctly against a light or dark menu bar.
    const scaled = image.resize({ width: 16, height: 16 })
    if (process.platform === 'darwin') scaled.setTemplateImage(true)

    tray = new Tray(scaled)
    tray.setToolTip('BICO')
    tray.setContextMenu(buildMenu())
    tray.on('double-click', reveal)
  } catch (error) {
    log.warn(`the tray could not be created: ${String(error)}`)
    return
  }

  window.on('close', (event) => {
    if (quitting || !tray) return
    // Only intercept when the user asked for it, otherwise closing the window
    // would look like the app had hung.
    if (!shouldHideOnClose()) return
    event.preventDefault()
    window.hide()
  })

  folderWatcher.onStatus(() => refresh())
}

type HideDecider = () => boolean

let shouldHideOnClose: HideDecider = () => false

/** Lets the IPC layer supply the current preference without a circular import. */
export function setHideOnClose(decider: HideDecider): void {
  shouldHideOnClose = decider
}

export function updateTrayProgress(progress: RunProgress): void {
  latest = progress
  if (!tray) return

  const label =
    progress.state === 'running'
      ? `BICO: ${Math.round(progress.percent)} percent, ${progress.completed} of ${progress.total}`
      : 'BICO'
  tray.setToolTip(label)
  refresh()
}

function refresh(): void {
  if (!tray) return
  try {
    tray.setContextMenu(buildMenu())
  } catch {
    // The tray can vanish during shutdown, which is not worth reporting.
  }
}

/** Raises the completion notification, if the user asked for one. */
export function notifyComplete(summary: RunSummary, enabled: boolean): void {
  latest = null
  refresh()

  if (!enabled || !Notification.isSupported()) return

  const saved = summary.savedBytes > 0 ? formatBytes(summary.savedBytes) : 'nothing'
  const body =
    summary.failed > 0
      ? `${summary.processed} converted, ${summary.failed} failed, in ${formatDuration(summary.durationMs)}.`
      : `${summary.processed} images in ${formatDuration(summary.durationMs)}, saving ${saved}.`

  try {
    const notification = new Notification({
      title: summary.cancelled ? 'Conversion stopped' : 'Conversion complete',
      body,
      icon: iconPath(),
      silent: false
    })
    notification.on('click', reveal)
    notification.show()
  } catch (error) {
    log.debug(`notification failed: ${String(error)}`)
  }
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
  target = null
}
