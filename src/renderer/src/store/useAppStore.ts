import { create } from 'zustand'
import {
  DEFAULT_PREFERENCES,
  DEFAULT_SETTINGS,
  DEFAULT_WATCH,
  THUMBNAIL_SIZE
} from '@shared/defaults'
import { BUILTIN_PRESETS, DEFAULT_PRESET_ID } from '@shared/presets'
import { cloneDeep, deepMerge } from '@shared/utils'
import type {
  AppPreferences,
  ConversionSettings,
  DeepPartial,
  GpuStatus,
  JobUpdate,
  Preset,
  ProbeResult,
  RunProgress,
  RunSummary,
  SourceFile,
  SystemInfo,
  WatchConfig,
  WatchStatus
} from '@shared/types'

/** One row in the queue: the imported file plus everything learned about it. */
export interface QueueItem {
  file: SourceFile
  thumbnail: string | null
  probe: ProbeResult | null
  state: JobUpdate['state']
  backend: JobUpdate['backend'] | null
  device: string
  outputSize: number
  durationMs: number
  error: string | null
}

export type PanelId =
  | 'about'
  | 'diagnostics'
  | 'history'
  | 'presets'
  | 'preview'
  | 'watch'
  | 'palette'
  | 'summary'
  | 'stats'
  | null

interface AppState {
  /* Queue */
  items: QueueItem[]
  selectedId: string | null

  /* Settings and presets */
  settings: ConversionSettings
  presets: Preset[]
  activePresetId: string
  /** True once the user changes anything after applying a preset. */
  presetDirty: boolean

  /* Preferences */
  prefs: AppPreferences
  /**
   * True once preferences have been read from disk.
   *
   * Anything that decides whether to show itself based on a stored preference
   * has to wait for this, or it briefly renders against the defaults.
   */
  prefsLoaded: boolean

  /* Run state */
  progress: RunProgress | null
  summary: RunSummary | null

  /* Environment */
  gpu: GpuStatus | null
  system: SystemInfo | null

  /* Watch folder */
  watchConfig: WatchConfig
  watchStatus: WatchStatus | null

  /* UI */
  openPanel: PanelId
  sidebarOpen: boolean

  /* Actions */
  addFiles(files: SourceFile[]): void
  removeItems(ids: string[]): void
  clearQueue(): void
  select(id: string | null): void
  setThumbnail(id: string, dataUrl: string | null): void
  setProbe(id: string, probe: ProbeResult | null): void
  applyJobUpdate(update: JobUpdate): void
  resetJobStates(): void

  patchSettings(patch: DeepPartial<ConversionSettings>): void
  replaceSettings(settings: ConversionSettings): void
  applyPreset(preset: Preset): void
  setPresets(presets: Preset[]): void

  setPrefs(prefs: AppPreferences): void
  patchPrefs(patch: Partial<AppPreferences>): void

  setProgress(progress: RunProgress | null): void
  setSummary(summary: RunSummary | null): void

  setGpu(status: GpuStatus | null): void
  setSystem(info: SystemInfo | null): void

  patchWatchConfig(patch: Partial<WatchConfig>): void
  setWatchStatus(status: WatchStatus | null): void

  setPanel(panel: PanelId): void
  setSidebarOpen(open: boolean): void
}

const initialPreset = BUILTIN_PRESETS.find((preset) => preset.id === DEFAULT_PRESET_ID)

/**
 * Every piece of shared UI state lives here.
 *
 * A single flat store rather than a tree of contexts, because almost every panel
 * reads the settings object and React context would rerender all of them on any
 * change. zustand lets each component subscribe to the exact slice it needs.
 */
export const useAppStore = create<AppState>((set) => ({
  items: [],
  selectedId: null,

  settings: initialPreset
    ? deepMerge(cloneDeep(DEFAULT_SETTINGS), initialPreset.settings)
    : cloneDeep(DEFAULT_SETTINGS),
  presets: BUILTIN_PRESETS,
  activePresetId: DEFAULT_PRESET_ID,
  presetDirty: false,

  prefs: DEFAULT_PREFERENCES,
  prefsLoaded: false,

  progress: null,
  summary: null,

  gpu: null,
  system: null,

  watchConfig: DEFAULT_WATCH,
  watchStatus: null,

  openPanel: null,
  sidebarOpen: true,

  addFiles: (files) =>
    set((state) => {
      const known = new Set(state.items.map((item) => item.file.id))
      const fresh = files
        .filter((file) => !known.has(file.id))
        .map<QueueItem>((file) => ({
          file,
          thumbnail: null,
          probe: null,
          state: 'queued',
          backend: null,
          device: '',
          outputSize: 0,
          durationMs: 0,
          error: null
        }))

      if (fresh.length === 0) return state

      const items = [...state.items, ...fresh]
      return {
        items,
        // Selecting the first import gives the preview panel something to show
        // without the user having to click a row first.
        selectedId: state.selectedId ?? fresh[0]?.file.id ?? null
      }
    }),

  /**
   * Removing from the queue also releases the file in the main process.
   *
   * The import registry refuses a path it has already seen, so dropping a row
   * here without telling it would make that file impossible to add again for the
   * rest of the session. The side effect lives inside the action rather than at
   * the call sites because there are several of them and one that forgets is a
   * bug nobody would think to look for.
   */
  removeItems: (ids) =>
    set((state) => {
      const drop = new Set(ids)
      const items = state.items.filter((item) => !drop.has(item.file.id))
      const selectedId =
        state.selectedId && drop.has(state.selectedId)
          ? (items[0]?.file.id ?? null)
          : state.selectedId

      void window.bico.files.release([...ids])
      return { items, selectedId }
    }),

  clearQueue: () => {
    void window.bico.files.clear()
    set({ items: [], selectedId: null, progress: null, summary: null })
  },

  select: (id) => set({ selectedId: id }),

  setThumbnail: (id, dataUrl) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.file.id === id ? { ...item, thumbnail: dataUrl } : item
      )
    })),

  setProbe: (id, probe) =>
    set((state) => ({
      items: state.items.map((item) => (item.file.id === id ? { ...item, probe } : item))
    })),

  applyJobUpdate: (update) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.file.id === update.fileId
          ? {
              ...item,
              state: update.state,
              backend: update.backend,
              device: update.device,
              outputSize: update.outputSize,
              durationMs: update.durationMs,
              error: update.error
            }
          : item
      )
    })),

  resetJobStates: () =>
    set((state) => ({
      items: state.items.map((item) => ({
        ...item,
        state: 'queued',
        backend: null,
        device: '',
        outputSize: 0,
        durationMs: 0,
        error: null
      })),
      summary: null
    })),

  patchSettings: (patch) =>
    set((state) => ({
      settings: deepMerge(state.settings, patch),
      presetDirty: true
    })),

  replaceSettings: (settings) => set({ settings, presetDirty: true }),

  applyPreset: (preset) =>
    set(() => ({
      // A preset always starts from the defaults rather than from whatever was
      // on screen. Layering it on top of the current settings would leak the
      // previous preset's watermark or crop into the new one.
      settings: deepMerge(cloneDeep(DEFAULT_SETTINGS), preset.settings),
      activePresetId: preset.id,
      presetDirty: false
    })),

  setPresets: (presets) => set({ presets }),

  setPrefs: (prefs) => set({ prefs, prefsLoaded: true }),
  patchPrefs: (patch) => set((state) => ({ prefs: { ...state.prefs, ...patch } })),

  setProgress: (progress) => set({ progress }),
  setSummary: (summary) => set({ summary }),

  setGpu: (gpu) => set({ gpu }),
  setSystem: (system) => set({ system }),

  patchWatchConfig: (patch) =>
    set((state) => ({ watchConfig: { ...state.watchConfig, ...patch } })),
  setWatchStatus: (watchStatus) => set({ watchStatus }),

  setPanel: (openPanel) => set({ openPanel }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen })
}))

/** Thumbnail size the queue requests, exported so the grid matches the table. */
export const QUEUE_THUMBNAIL_SIZE = THUMBNAIL_SIZE
