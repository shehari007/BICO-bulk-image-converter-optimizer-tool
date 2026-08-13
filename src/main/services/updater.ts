import { app } from 'electron'
import { errorMessage } from '@shared/utils'
import { createLogger } from './logger'
import type { UpdateInfo } from '@shared/types'
import type { autoUpdater as AutoUpdater } from 'electron-updater'

const log = createLogger('updater')

type UpdateListener = (info: UpdateInfo) => void

const listeners = new Set<UpdateListener>()

/**
 * Where someone is sent when they have to fetch the update themselves.
 *
 * The latest release rather than a tag built from the version string, because
 * that link is correct whatever tagging convention a release is cut with.
 */
const RELEASE_PAGE =
  'https://github.com/shehari007/BICO-bulk-image-converter-optimizer-tool/releases/latest'

/**
 * macOS is told about updates but does not apply them.
 *
 * Squirrel, which is what Electron uses to swap the application bundle, refuses
 * to touch a build that is not signed with an Apple Developer ID, and the
 * updater expects a zip while BICO ships a disk image. Checking is an ordinary
 * download of a manifest and a version comparison, so that part works, and it
 * is worth keeping: knowing a new version exists is most of the value.
 */
const MANUAL_DOWNLOAD = process.platform === 'darwin'

let state: UpdateInfo = {
  state: 'idle',
  version: '',
  releaseNotes: '',
  percent: 0,
  error: '',
  manualDownload: MANUAL_DOWNLOAD,
  releaseUrl: RELEASE_PAGE
}

let wired = false

export function onUpdateState(listener: UpdateListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function currentUpdateState(): UpdateInfo {
  return { ...state }
}

function push(patch: Partial<UpdateInfo>): void {
  state = { ...state, ...patch }
  const snapshot = currentUpdateState()
  for (const listener of listeners) {
    try {
      listener(snapshot)
    } catch {
      // A failing listener must not break the update flow.
    }
  }
}

/**
 * electron-updater is imported lazily and only when packaged.
 *
 * In development there is no code signature and no published feed, so loading
 * it at startup would log a confusing error on every launch and slow the boot
 * for no benefit.
 */
async function getUpdater(): Promise<typeof AutoUpdater | null> {
  if (!app.isPackaged) return null

  try {
    const { autoUpdater } = await import('electron-updater')

    if (!wired) {
      wired = true
      autoUpdater.autoDownload = false
      // Nothing is ever downloaded on macOS, so there is nothing to install on
      // quit either. Leaving it on would invite Squirrel to act on a build it
      // cannot verify.
      autoUpdater.autoInstallOnAppQuit = !MANUAL_DOWNLOAD

      autoUpdater.on('checking-for-update', () => push({ state: 'checking', error: '' }))
      autoUpdater.on('update-available', (info) => {
        push({
          state: 'available',
          version: info.version,
          releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : ''
        })
      })
      autoUpdater.on('update-not-available', () => push({ state: 'not-available' }))
      autoUpdater.on('download-progress', (progress) => {
        push({ state: 'downloading', percent: progress.percent })
      })
      autoUpdater.on('update-downloaded', (info) => {
        push({ state: 'downloaded', version: info.version, percent: 100 })
      })
      autoUpdater.on('error', (error) => {
        log.warn(`update check failed: ${errorMessage(error)}`)
        push({ state: 'error', error: errorMessage(error) })
      })
    }

    return autoUpdater
  } catch (error) {
    log.warn(`electron-updater is unavailable: ${errorMessage(error)}`)
    return null
  }
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  const updater = await getUpdater()
  if (!updater) {
    push({
      state: 'not-available',
      error: app.isPackaged ? '' : 'updates are only checked in packaged builds'
    })
    return currentUpdateState()
  }

  try {
    await updater.checkForUpdates()
  } catch (error) {
    push({ state: 'error', error: errorMessage(error) })
  }
  return currentUpdateState()
}

export async function downloadUpdate(): Promise<UpdateInfo> {
  // Guarded here as well as in the interface, because the renderer is not the
  // only thing that can reach this and a download that cannot be installed
  // would sit at a hundred percent forever.
  if (MANUAL_DOWNLOAD) return currentUpdateState()

  const updater = await getUpdater()
  if (!updater) return currentUpdateState()

  try {
    push({ state: 'downloading', percent: 0 })
    await updater.downloadUpdate()
  } catch (error) {
    push({ state: 'error', error: errorMessage(error) })
  }
  return currentUpdateState()
}

export async function installUpdate(): Promise<void> {
  const updater = await getUpdater()
  if (!updater) return
  // Quitting through the updater rather than app.quit() so the installer runs
  // after every window has closed cleanly.
  updater.quitAndInstall(false, true)
}
