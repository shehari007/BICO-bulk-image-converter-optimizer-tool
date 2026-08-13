import { readFile, writeFile } from 'node:fs/promises'
import { BUILTIN_PRESETS } from '@shared/presets'
import { errorMessage, uid } from '@shared/utils'
import { JsonStore } from './store'
import { createLogger } from './logger'
import type { Preset } from '@shared/types'

const log = createLogger('presets')

interface PresetFile {
  presets: Preset[]
}

const store = new JsonStore<PresetFile>('presets.json', { presets: [] })

/**
 * Built in presets are never persisted.
 *
 * Only user presets go on disk, so shipping a corrected built in preset in a
 * later release actually reaches existing installs instead of being shadowed by
 * a stale copy in their user data folder.
 */
export function listPresets(): Preset[] {
  return [...BUILTIN_PRESETS, ...store.read().presets]
}

export function savePreset(preset: Preset): Preset[] {
  const now = Date.now()
  const existing = store.read().presets

  // Editing a built in preset saves a copy rather than overwriting it, which is
  // the behaviour every settings UI with locked defaults is expected to have.
  const isBuiltin = BUILTIN_PRESETS.some((candidate) => candidate.id === preset.id)
  const id = isBuiltin ? uid('preset') : preset.id || uid('preset')

  const record: Preset = {
    ...preset,
    id,
    builtin: false,
    // The name arrives already decided. Inventing a suffix here would write an
    // English word into a file that outlives the session, in an app whose
    // interface may be running in Turkish or Arabic, and the main process has
    // no dictionary to translate it with.
    name: preset.name,
    createdAt: preset.createdAt || now,
    updatedAt: now
  }

  const at = existing.findIndex((candidate) => candidate.id === id)
  const next =
    at >= 0
      ? existing.map((candidate, i) => (i === at ? record : candidate))
      : [...existing, record]

  store.write({ presets: next })
  store.flush()
  return listPresets()
}

export function deletePreset(id: string): Preset[] {
  const remaining = store.read().presets.filter((preset) => preset.id !== id)
  store.write({ presets: remaining })
  store.flush()
  return listPresets()
}

/**
 * Reads a preset bundle exported from another install.
 *
 * Imported ids are regenerated so a shared file can never overwrite a preset the
 * user already has under the same id, and anything that does not look like a
 * preset is dropped rather than trusted.
 */
export async function importPresets(path: string): Promise<Preset[]> {
  const raw = await readFile(path, 'utf8')
  const parsed: unknown = JSON.parse(raw)

  const candidates: unknown[] = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as PresetFile).presets)
      ? (parsed as PresetFile).presets
      : [parsed]

  const now = Date.now()
  const accepted: Preset[] = []

  for (const candidate of candidates) {
    if (typeof candidate !== 'object' || candidate === null) continue
    const record = candidate as Partial<Preset>
    if (
      typeof record.name !== 'string' ||
      typeof record.settings !== 'object' ||
      record.settings === null
    ) {
      continue
    }
    accepted.push({
      id: uid('preset'),
      name: record.name,
      description: typeof record.description === 'string' ? record.description : '',
      icon: typeof record.icon === 'string' ? record.icon : 'setting',
      builtin: false,
      settings: record.settings,
      createdAt: now,
      updatedAt: now
    })
  }

  if (accepted.length === 0) {
    throw new Error('that file did not contain any recognisable presets')
  }

  const existing = store.read().presets
  store.write({ presets: [...existing, ...accepted] })
  store.flush()
  log.info(`imported ${accepted.length} presets from ${path}`)
  return listPresets()
}

export async function exportPreset(id: string, path: string): Promise<boolean> {
  const preset = listPresets().find((candidate) => candidate.id === id)
  if (!preset) return false

  try {
    await writeFile(path, JSON.stringify({ presets: [preset] }, null, 2), 'utf8')
    return true
  } catch (error) {
    log.error(`could not export preset ${id}`, errorMessage(error))
    return false
  }
}
