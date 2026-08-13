import { message } from 'antd'
import { importPaths, thumbnailLoader } from './store/bridge'
import { useAppStore } from './store/useAppStore'
import { formatNumber, translate } from './i18n'

/**
 * Every user intent that more than one surface can trigger.
 *
 * The toolbar, the application menu, the command palette and the keyboard
 * shortcuts all reach the same function here rather than each reimplementing
 * the flow, so a change to what "start a conversion" means only has to be made
 * once.
 */

/** The dictionary carries no plural rules, so the count picks the key. */
function addedMessage(count: number): string {
  return translate(count === 1 ? 'shell.import.added.one' : 'shell.import.added.many', {
    count: formatNumber(count)
  })
}

export async function pickAndAddFiles(): Promise<void> {
  const picked = await window.bico.dialog.pickFiles()
  if (picked.cancelled) return
  const count = await importPaths(picked.paths)
  void message.success(addedMessage(count))
}

export async function pickAndAddFolder(): Promise<void> {
  const picked = await window.bico.dialog.pickFolders()
  if (picked.cancelled) return
  const count = await importPaths(picked.paths)
  if (count === 0) void message.info(translate('shell.import.folderEmpty'))
  else void message.success(addedMessage(count))
}

export async function pickOutputFolder(): Promise<void> {
  const picked = await window.bico.dialog.pickOutputFolder()
  const folder = picked.paths[0]
  if (picked.cancelled || !folder) return
  useAppStore.getState().patchSettings({ output: { folder, target: 'folder' } })
}

export async function pickZipPath(): Promise<void> {
  const picked = await window.bico.dialog.pickZipPath('bico-output.zip')
  const zipPath = picked.paths[0]
  if (picked.cancelled || !zipPath) return
  useAppStore.getState().patchSettings({ output: { zipPath, target: 'zip' } })
}

export function clearQueue(): void {
  thumbnailLoader.reset()
  useAppStore.getState().clearQueue()
}

/**
 * Validates the run before handing it to the main process.
 *
 * Catching a missing output folder here rather than in the scheduler means the
 * user gets a single sentence instead of an exception dialog, and no partial
 * archive is created before the problem is noticed.
 */
export async function startConversion(): Promise<void> {
  const state = useAppStore.getState()
  const { items, settings } = state

  if (items.length === 0) {
    void message.warning(translate('shell.convert.empty'))
    return
  }

  if (settings.output.target === 'folder' && !settings.output.folder) {
    void message.warning(translate('shell.convert.needsFolder'))
    await pickOutputFolder()
    return
  }

  if (settings.output.target === 'zip' && !settings.output.zipPath) {
    await pickZipPath()
    if (!useAppStore.getState().settings.output.zipPath) return
  }

  const preset = state.presets.find((candidate) => candidate.id === state.activePresetId)

  state.resetJobStates()

  try {
    await window.bico.convert.start({
      fileIds: items.map((item) => item.file.id),
      settings: useAppStore.getState().settings,
      presetName: state.presetDirty ? 'custom' : (preset?.name ?? 'custom')
    })
  } catch (error) {
    void message.error(error instanceof Error ? error.message : String(error))
  }
}

export async function togglePause(): Promise<void> {
  const progress = useAppStore.getState().progress
  if (!progress) return
  if (progress.state === 'paused') await window.bico.convert.resume()
  else if (progress.state === 'running') await window.bico.convert.pause()
}

export async function cancelConversion(): Promise<void> {
  await window.bico.convert.cancel()
  void message.warning(translate('shell.convert.cancelling'))
}

export function removeSelected(): void {
  const { selectedId, removeItems } = useAppStore.getState()
  if (selectedId) removeItems([selectedId])
}

export async function openExternal(url: string): Promise<void> {
  await window.bico.system.openExternal(url)
}
