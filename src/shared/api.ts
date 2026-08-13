import type { LifetimeStats } from './stats'
import type {
  AddFilesOptions,
  AddFilesResult,
  AppPreferences,
  ChromiumGpuReport,
  ConversionSettings,
  ConvertRequest,
  ExifEntry,
  GpuStatus,
  GpuTaskRequest,
  GpuTaskResult,
  HistoryEntry,
  JobUpdate,
  LogRecord,
  PickResult,
  Preset,
  PreviewRequest,
  PreviewResult,
  ProbeResult,
  RunProgress,
  RunSummary,
  SystemInfo,
  ThumbnailResult,
  UpdateInfo,
  WatchConfig,
  WatchStatus
} from './types'

/** Removes a previously registered listener. */
export type Unsubscribe = () => void

/**
 * The surface the preload bridge exposes on `window.bico`.
 *
 * Nothing else is reachable from the renderer. There is no Node integration
 * and no remote module, so this interface is the complete list of privileged
 * operations the UI is able to perform.
 */
export interface BicoApi {
  readonly system: {
    info(): Promise<SystemInfo>
    gpuReport(): Promise<ChromiumGpuReport>
    openExternal(url: string): Promise<boolean>
    openPath(target: string): Promise<boolean>
    revealPath(target: string): Promise<void>
    copyText(text: string): Promise<void>
    relaunch(): Promise<void>
  }

  readonly dialog: {
    pickFiles(): Promise<PickResult>
    pickFolders(): Promise<PickResult>
    pickOutputFolder(): Promise<PickResult>
    pickZipPath(defaultName: string): Promise<PickResult>
    pickImage(): Promise<PickResult>
    pickJson(): Promise<PickResult>
    saveJson(defaultName: string, contents: string): Promise<PickResult>
  }

  readonly files: {
    add(paths: string[], options: AddFilesOptions): Promise<AddFilesResult>
    probe(fileId: string): Promise<ProbeResult | null>
    thumbnail(fileId: string, size: number): Promise<ThumbnailResult | null>
    exif(fileId: string): Promise<ExifEntry[]>
    sourceUrl(fileId: string): Promise<string>
    /** Drops files from the import registry so the same paths can be added again. */
    release(fileIds: string[]): Promise<void>
    clear(): Promise<void>
  }

  readonly convert: {
    start(request: ConvertRequest): Promise<string>
    pause(): Promise<void>
    resume(): Promise<void>
    cancel(): Promise<void>
    estimate(fileIds: string[], settings: ConversionSettings): Promise<number>
  }

  readonly preview: {
    render(request: PreviewRequest): Promise<PreviewResult | null>
  }

  readonly presets: {
    list(): Promise<Preset[]>
    save(preset: Preset): Promise<Preset[]>
    remove(id: string): Promise<Preset[]>
    importFromFile(): Promise<Preset[]>
    exportToFile(id: string): Promise<boolean>
  }

  readonly prefs: {
    load(): Promise<AppPreferences>
    save(patch: Partial<AppPreferences>): Promise<AppPreferences>
  }

  readonly history: {
    list(): Promise<HistoryEntry[]>
    clear(): Promise<void>
  }

  readonly stats: {
    read(): Promise<LifetimeStats>
    /** Erases every lifetime total and returns the emptied record. */
    reset(): Promise<LifetimeStats>
  }

  readonly watch: {
    start(config: WatchConfig, settings: ConversionSettings): Promise<WatchStatus>
    stop(): Promise<WatchStatus>
    status(): Promise<WatchStatus>
  }

  readonly updates: {
    check(): Promise<UpdateInfo>
    download(): Promise<UpdateInfo>
    install(): Promise<void>
  }

  readonly window: {
    minimise(): Promise<void>
    toggleMaximise(): Promise<boolean>
    close(): Promise<void>
    isMaximised(): Promise<boolean>
  }

  /** Renderer to main, used by the GPU lanes to report capability and results. */
  readonly gpu: {
    publishStatus(status: GpuStatus): void
    postResult(result: GpuTaskResult): void
  }

  readonly on: {
    jobUpdate(cb: (update: JobUpdate) => void): Unsubscribe
    runProgress(cb: (progress: RunProgress) => void): Unsubscribe
    runComplete(cb: (summary: RunSummary) => void): Unsubscribe
    log(cb: (record: LogRecord) => void): Unsubscribe
    updateState(cb: (info: UpdateInfo) => void): Unsubscribe
    watchStatus(cb: (status: WatchStatus) => void): Unsubscribe
    windowState(cb: (maximised: boolean) => void): Unsubscribe
    menuCommand(cb: (command: string) => void): Unsubscribe
    openFiles(cb: (paths: string[]) => void): Unsubscribe
    gpuTask(cb: (task: GpuTaskRequest) => void): Unsubscribe
  }

  readonly ready: () => void
}
