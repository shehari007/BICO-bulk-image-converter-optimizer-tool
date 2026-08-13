/**
 * The single source of truth for every value that crosses a process boundary.
 *
 * The main process, the preload bridge, the sharp workers and the React
 * renderer all compile against this file. Changing a field here surfaces as a
 * compile error in every process that reads it, which is the whole point of
 * keeping the contract in one place.
 */

import type { LanguageCode } from './i18n/types'

/* ================================================================== */
/* Formats                                                             */
/* ================================================================== */

/** Every container BICO can write. `original` keeps each file in its own format. */
export type OutputFormat =
  'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif' | 'heif' | 'jxl' | 'jp2' | 'original'

/** Containers BICO can read. Superset of the writable list. */
export type InputFormat =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'avif'
  | 'tiff'
  | 'gif'
  | 'heif'
  | 'jxl'
  | 'jp2'
  | 'svg'
  | 'raw'
  | 'unknown'

export type ChromaSubsampling = '4:4:4' | '4:2:2' | '4:2:0'

export type TiffCompression =
  'none' | 'jpeg' | 'deflate' | 'packbits' | 'ccittfax4' | 'lzw' | 'webp' | 'zstd' | 'jp2k'

/** What a format is physically able to do, used to hide impossible controls. */
export interface FormatCapabilities {
  readonly id: OutputFormat
  readonly label: string
  readonly extension: string
  readonly mimeType: string
  readonly quality: boolean
  readonly lossless: boolean
  readonly alpha: boolean
  readonly animation: boolean
  readonly progressive: boolean
  readonly effort: { readonly min: number; readonly max: number; readonly default: number } | null
  readonly chroma: boolean
  readonly metadata: boolean
  readonly hdr: boolean
  /** Rough bytes-per-pixel at quality 80, used for the pre run size estimate. */
  readonly estimatedBpp: number
  /** True when Chromium itself can encode this format inside a canvas. */
  readonly browserEncodable: boolean
}

/* ================================================================== */
/* Conversion settings                                                 */
/* ================================================================== */

export type ResizeStrategy =
  'none' | 'exact' | 'width' | 'height' | 'longest' | 'shortest' | 'percentage' | 'megapixels'

export type FitMode = 'cover' | 'contain' | 'fill' | 'inside' | 'outside'

export type ResizeKernel = 'nearest' | 'cubic' | 'mitchell' | 'lanczos2' | 'lanczos3'

export type GravityPosition =
  | 'center'
  | 'north'
  | 'northeast'
  | 'east'
  | 'southeast'
  | 'south'
  | 'southwest'
  | 'west'
  | 'northwest'
  | 'entropy'
  | 'attention'

export interface ResizeSettings {
  strategy: ResizeStrategy
  width: number | null
  height: number | null
  percentage: number
  megapixels: number
  fit: FitMode
  position: GravityPosition
  kernel: ResizeKernel
  /** Never scale an image up past its native size. */
  withoutEnlargement: boolean
  /** Never scale an image down past the requested box. */
  withoutReduction: boolean
  /** Background used by `contain`, expressed as #rrggbb or #rrggbbaa. */
  background: string
}

export type RotateAngle = 0 | 90 | 180 | 270

export interface CropSettings {
  enabled: boolean
  mode: 'manual' | 'aspect' | 'trim'
  left: number
  top: number
  width: number
  height: number
  /** Aspect ratio as width / height, for example 1.7777 for 16 by 9. */
  aspectRatio: number
  /** Tolerance for `trim`, 0 to 100. */
  trimThreshold: number
}

export interface TransformSettings {
  /** Honour the EXIF orientation flag before anything else touches the pixels. */
  autoOrient: boolean
  rotate: RotateAngle
  flipVertical: boolean
  flipHorizontal: boolean
  crop: CropSettings
  /** Uniform border added after resize, in pixels. */
  padding: number
  paddingColor: string
}

export interface AdjustSettings {
  grayscale: boolean
  invert: boolean
  sepia: boolean
  brightness: number
  saturation: number
  hue: number
  lightness: number
  contrast: number
  /** Stretch levels so the darkest pixel is black and the brightest is white. */
  normalize: boolean
  normalizeLower: number
  normalizeUpper: number
  /** Contrast Limited Adaptive Histogram Equalisation. */
  clahe: boolean
  claheWidth: number
  claheHeight: number
  claheMaxSlope: number
  gamma: boolean
  gammaValue: number
  sharpen: boolean
  sharpenSigma: number
  sharpenM1: number
  sharpenM2: number
  blur: boolean
  blurSigma: number
  median: boolean
  medianSize: number
  tint: boolean
  tintColor: string
  /** Flatten transparency onto a solid colour, required by JPEG. */
  flatten: boolean
  flattenColor: string
}

export type WatermarkKind = 'none' | 'text' | 'image'

export interface WatermarkSettings {
  kind: WatermarkKind
  text: string
  fontSize: number
  fontFamily: string
  color: string
  imagePath: string
  position: GravityPosition
  /** 0 to 100. */
  opacity: number
  /** Watermark width as a percentage of the output width. */
  scale: number
  marginX: number
  marginY: number
  tile: boolean
  rotation: number
}

export type MetadataPolicy = 'strip' | 'keep' | 'keep-icc' | 'keep-copyright'

export interface MetadataSettings {
  policy: MetadataPolicy
  /** Overwrite the density recorded in the output, useful for print work. */
  setDensity: boolean
  density: number
  /** Attach a named or file based ICC profile on the way out. */
  iccProfile: string
  copyright: string
  artist: string
}

export type OutputTarget = 'folder' | 'zip' | 'in-place'
export type OutputStructure = 'flat' | 'mirror' | 'by-format' | 'by-date'
export type CollisionPolicy = 'rename' | 'overwrite' | 'skip'
export type CaseTransform = 'none' | 'lower' | 'upper' | 'kebab' | 'snake'

export interface OutputSettings {
  target: OutputTarget
  folder: string
  zipPath: string
  structure: OutputStructure
  collision: CollisionPolicy
  /**
   * Filename template. Supported tokens:
   * {name} {ext} {format} {index} {total} {width} {height} {quality}
   * {preset} {date} {time} {parent} {variant} {random}
   */
  template: string
  caseTransform: CaseTransform
  /** Replace characters that are illegal on Windows and macOS. */
  sanitize: boolean
  /** Skip writing an output that ends up larger than its source. */
  skipIfLarger: boolean
  /** Compression level applied to the ZIP container itself, 0 to 9. */
  zipCompressionLevel: number
  /** Write a CSV report of every file next to the output. */
  writeReport: boolean
}

/** One extra rendition produced from the same decode, for responsive image sets. */
export interface VariantSpec {
  id: string
  enabled: boolean
  label: string
  /** Null means inherit the primary format. */
  format: OutputFormat | null
  /** Null means inherit the primary quality. */
  quality: number | null
  strategy: Extract<ResizeStrategy, 'none' | 'width' | 'height' | 'longest' | 'percentage'>
  value: number
  suffix: string
}

export type ProcessingBackend = 'auto' | 'gpu' | 'cpu'

export interface PerformanceSettings {
  backend: ProcessingBackend
  /** CPU worker threads. 0 means pick from the core count. */
  concurrency: number
  /** libvips threads inside each worker. 0 means let libvips decide. */
  vipsConcurrency: number
  /** libvips operation cache ceiling in megabytes. */
  cacheMemoryMb: number
  /** Refuse files above this pixel count instead of exhausting memory. */
  maxPixels: number
  /** Prefer the discrete adapter when more than one is present. */
  preferDiscreteGpu: boolean
  /** Run one GPU lane per distinct adapter instead of only the preferred one. */
  useAllGpus: boolean
  /** Hand raw pixels back to sharp for formats Chromium cannot encode. */
  gpuAssistedEncode: boolean
}

export type SizeTargetMode = 'off' | 'max-bytes' | 'target-bytes'

export interface SmartSettings {
  /** Binary search the quality slider until the output fits a byte budget. */
  sizeTarget: SizeTargetMode
  targetKb: number
  /** Lowest quality the search is allowed to fall back to. */
  minQuality: number
  maxQuality: number
  /** Choose the format per file from its content, overriding the picker. */
  autoFormat: boolean
  /** Drop to a palette when the image has few enough distinct colours. */
  autoPalette: boolean
}

/** The complete description of one conversion run. */
export interface ConversionSettings {
  format: OutputFormat
  quality: number
  lossless: boolean
  effort: number
  alphaQuality: number
  chromaSubsampling: ChromaSubsampling
  progressive: boolean
  /** JPEG specific. */
  mozjpeg: boolean
  trellisQuantisation: boolean
  overshootDeringing: boolean
  optimiseScans: boolean
  /** PNG specific. */
  pngCompressionLevel: number
  pngPalette: boolean
  pngColours: number
  pngDither: number
  pngAdaptiveFiltering: boolean
  /** WebP specific. */
  nearLossless: boolean
  smartSubsample: boolean
  /** TIFF specific. */
  tiffCompression: TiffCompression
  tiffPredictor: 'none' | 'horizontal' | 'float'
  tiffPyramid: boolean
  tiffBitdepth: 1 | 2 | 4 | 8
  /** GIF specific. */
  gifColours: number
  gifDither: number
  gifLoop: number
  /** Animation. */
  animated: boolean

  resize: ResizeSettings
  transform: TransformSettings
  adjust: AdjustSettings
  watermark: WatermarkSettings
  metadata: MetadataSettings
  output: OutputSettings
  performance: PerformanceSettings
  smart: SmartSettings
  variants: VariantSpec[]
}

/* ================================================================== */
/* Presets                                                             */
/* ================================================================== */

export interface Preset {
  id: string
  name: string
  description: string
  icon: string
  /** Built in presets ship with the app and cannot be deleted. */
  builtin: boolean
  /** Partial so a preset only overrides what it cares about. */
  settings: DeepPartial<ConversionSettings>
  createdAt: number
  updatedAt: number
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K]
}

/* ================================================================== */
/* Files and probing                                                   */
/* ================================================================== */

export interface SourceFile {
  id: string
  path: string
  name: string
  /** Directory containing the file. */
  dir: string
  /** Lowercase extension without the dot. */
  ext: string
  /** Path relative to the folder the user dropped, drives `mirror` output. */
  relPath: string
  size: number
  mtimeMs: number
}

export interface ProbeResult {
  width: number
  height: number
  format: InputFormat
  space: string
  channels: number
  depth: string
  density: number
  hasAlpha: boolean
  hasProfile: boolean
  isAnimated: boolean
  pages: number
  orientation: number
  isProgressive: boolean
}

export interface ExifEntry {
  group: string
  tag: string
  value: string
}

export interface ThumbnailResult {
  /** A data URL sized for the queue table. */
  dataUrl: string
  width: number
  height: number
}

/* ================================================================== */
/* Runs, jobs and progress                                             */
/* ================================================================== */

export type JobState = 'queued' | 'running' | 'done' | 'failed' | 'skipped' | 'cancelled'

export type RunState = 'idle' | 'running' | 'paused' | 'finishing' | 'done' | 'cancelled'

export type BackendUsed = 'cpu' | 'gpu'

export interface ConvertRequest {
  fileIds: string[]
  settings: ConversionSettings
  /** Name of the preset in effect, used by the {preset} filename token. */
  presetName: string
}

export interface JobOutput {
  path: string
  variant: string
  bytes: number
  width: number
  height: number
}

export interface JobUpdate {
  runId: string
  fileId: string
  index: number
  total: number
  state: JobState
  backend: BackendUsed
  /** Human readable adapter or worker that handled this file. */
  device: string
  originalSize: number
  outputSize: number
  durationMs: number
  outputs: JobOutput[]
  error: string | null
}

export interface RunProgress {
  runId: string
  state: RunState
  completed: number
  failed: number
  skipped: number
  total: number
  percent: number
  bytesIn: number
  bytesOut: number
  /** Megabytes of source data processed per second. */
  throughputMbps: number
  imagesPerSecond: number
  etaMs: number
  elapsedMs: number
  activeDevices: string[]
}

export interface RunError {
  fileId: string
  fileName: string
  message: string
}

export interface RunSummary {
  runId: string
  startedAt: number
  finishedAt: number
  durationMs: number
  total: number
  processed: number
  failed: number
  skipped: number
  bytesIn: number
  bytesOut: number
  savedBytes: number
  savedPercent: number
  format: OutputFormat
  presetName: string
  outputTarget: OutputTarget
  outputLocation: string
  reportPath: string | null
  gpuCount: number
  cpuCount: number
  cancelled: boolean
  errors: RunError[]
}

/* ================================================================== */
/* Live preview                                                        */
/* ================================================================== */

export interface PreviewRequest {
  fileId: string
  settings: ConversionSettings
  /** Longest edge of the rendered preview, keeps the round trip cheap. */
  maxEdge: number
}

/**
 * Set when the requested encoder was unavailable and the preview had to be
 * written in another container, so the byte counts alongside it are not
 * measurements of the format the user asked for.
 */
export interface PreviewFallback {
  /** The container the preview bytes were actually written in. */
  format: OutputFormat
  /** Why the requested encoder could not be used. */
  reason: string
}

export interface PreviewResult {
  /** Encoded in the target format so the user judges real artefacts. */
  dataUrl: string
  originalDataUrl: string
  width: number
  height: number
  originalBytes: number
  /** Extrapolated from the preview render back to full resolution. */
  estimatedBytes: number
  encodedBytes: number
  durationMs: number
  format: OutputFormat
  /** Null when the preview really is in `format`. */
  fallback: PreviewFallback | null
}

/* ================================================================== */
/* GPU                                                                 */
/* ================================================================== */

export type GpuAdapterKind = 'discrete' | 'integrated' | 'cpu' | 'unknown'

export interface GpuAdapterInfo {
  id: string
  vendor: string
  architecture: string
  device: string
  description: string
  kind: GpuAdapterKind
  isFallbackAdapter: boolean
  maxTextureDimension: number
  maxBufferSizeMb: number
  /** True when this adapter has a live lane processing images. */
  active: boolean
}

export interface GpuStatus {
  /** navigator.gpu resolved at least one adapter. */
  supported: boolean
  /** GPU work is currently allowed by settings and by capability probing. */
  enabled: boolean
  adapters: GpuAdapterInfo[]
  /** Populated when GPU support was refused, explains why. */
  reason: string
  /** Images completed on GPU lanes this session. */
  processed: number
  /** Images that started on GPU and had to fall back to sharp. */
  fallbacks: number
}

/** Raw Chromium adapter report, shown verbatim in the diagnostics panel. */
export interface ChromiumGpuReport {
  vendor: string
  device: string
  driver: string
  deviceString: string
  featureStatus: Record<string, string>
  raw: string
}

/* ================================================================== */
/* GPU lane protocol (main asks the renderer to do GPU work)           */
/* ================================================================== */

export type GpuRoute = 'full' | 'assist'

export interface GpuTaskRequest {
  taskId: string
  runId: string
  fileId: string
  /** A bico-src URL the GPU worker can fetch without touching Node fs. */
  sourceUrl: string
  route: GpuRoute
  settings: ConversionSettings
  /** Adapter lane to run on, chosen by the scheduler. */
  laneId: string
}

export interface GpuTaskSuccess {
  taskId: string
  ok: true
  route: GpuRoute
  /** Present when `route` is `full`, already encoded in the target format. */
  encoded: ArrayBuffer | null
  /** Present when `route` is `assist`, premultiplied straight RGBA. */
  pixels: ArrayBuffer | null
  width: number
  height: number
  channels: 4
  device: string
  durationMs: number
}

export interface GpuTaskFailure {
  taskId: string
  ok: false
  device: string
  error: string
}

export type GpuTaskResult = GpuTaskSuccess | GpuTaskFailure

/* ================================================================== */
/* Worker protocol (main to sharp worker threads)                      */
/* ================================================================== */

export interface WorkerJobRequest {
  jobId: string
  file: SourceFile
  settings: ConversionSettings
  presetName: string
  index: number
  total: number
  /** Set when the GPU already produced the pixels, so the worker only encodes. */
  prepared: {
    pixels: ArrayBuffer
    width: number
    height: number
    channels: 4
  } | null
  /**
   * Set when a GPU lane completed the encode as well, which happens for the
   * formats Chromium can write natively. The worker then only has to resolve
   * the output name and put the bytes where they belong, so the image never
   * crosses IPC as raw pixels.
   */
  preEncoded: {
    data: ArrayBuffer
    width: number
    height: number
  } | null
}

export interface WorkerJobResponse {
  jobId: string
  ok: boolean
  outputs: JobOutput[]
  originalSize: number
  outputSize: number
  durationMs: number
  skipped: boolean
  error: string | null
  /**
   * Populated only when the run targets a ZIP. The worker hands the encoded
   * bytes back instead of writing them, because a single writer in the main
   * process owns the archive and appends entries as they arrive.
   */
  buffers: { name: string; data: ArrayBuffer }[]
}

/** Reply to a WorkerPreviewRequest. */
export interface WorkerPreviewResponse {
  jobId: string
  ok: boolean
  dataUrl: string
  originalDataUrl: string
  width: number
  height: number
  encodedBytes: number
  originalBytes: number
  estimatedBytes: number
  durationMs: number
  error: string | null
  /** Null when the preview really is in the requested format. */
  fallback: PreviewFallback | null
}

/** Messages the pool sends into a worker thread. */
export type WorkerInbound =
  | { kind: 'job'; payload: WorkerJobRequest }
  | { kind: 'preview'; payload: WorkerPreviewRequest }
  | { kind: 'configure'; payload: { vipsConcurrency: number; cacheMemoryMb: number } }
  | { kind: 'shutdown' }

/** Messages a worker thread sends back to the pool. */
export type WorkerOutbound =
  | { kind: 'ready'; payload: { sharp: string; libvips: string } }
  | { kind: 'job'; payload: WorkerJobResponse }
  | { kind: 'preview'; payload: WorkerPreviewResponse }

export interface WorkerPreviewRequest {
  jobId: string
  path: string
  settings: ConversionSettings
  maxEdge: number
}

/* ================================================================== */
/* Watch folder                                                        */
/* ================================================================== */

export interface WatchConfig {
  enabled: boolean
  folder: string
  recursive: boolean
  /** Milliseconds of quiet time before a newly seen file is picked up. */
  settleMs: number
  /** Move each source file here once it has been converted. */
  moveProcessedTo: string
  deleteAfterProcess: boolean
}

export interface WatchStatus {
  running: boolean
  folder: string
  seen: number
  processed: number
  lastEvent: string
  error: string
}

/* ================================================================== */
/* History and persisted app state                                     */
/* ================================================================== */

export interface HistoryEntry {
  id: string
  summary: RunSummary
}

export type ThemeMode = 'dark' | 'light' | 'system'
export type QueueView = 'table' | 'grid'

export interface AppPreferences {
  /** Light, dark, or follow the operating system. */
  theme: ThemeMode
  /** Id from the theme registry, applied within the resolved light or dark base. */
  themeId: string
  /** Interface language. Arabic also flips the layout to right to left. */
  language: LanguageCode
  accent: string
  compactUi: boolean
  queueView: QueueView
  /** Show the summary of what is about to happen before a run starts. */
  confirmBeforeRun: boolean
  /** Raise a system notification when a run finishes. */
  notifyOnComplete: boolean
  /** Open the output folder as soon as a run finishes. */
  openOutputWhenDone: boolean
  /** Drive the taskbar or dock progress indicator during a run. */
  taskbarProgress: boolean
  /** Keep running in the tray when the window is closed. */
  minimiseToTray: boolean
  autoCheckUpdates: boolean
  /**
   * Version whose welcome screen has been dismissed.
   *
   * A version rather than a boolean, so the screen returns once after an
   * upgrade to show what changed, which is the only time it has anything new
   * to say. Empty means it has never been dismissed.
   */
  welcomeSeenVersion: string
  lastSettings: ConversionSettings | null
  lastPresetId: string
  sidebarWidth: number
}

export interface WindowState {
  x: number | null
  y: number | null
  width: number
  height: number
  maximised: boolean
}

/* ================================================================== */
/* System information                                                  */
/* ================================================================== */

export interface SystemInfo {
  app: {
    name: string
    version: string
    packaged: boolean
    buildDate: string
    locale: string
  }
  runtime: {
    electron: string
    chrome: string
    node: string
    v8: string
    abi: string
  }
  os: {
    // Spelled out rather than reusing NodeJS.Platform, because the renderer
    // compiles this file without the Node type definitions loaded.
    platform: 'win32' | 'darwin' | 'linux' | string
    arch: string
    release: string
    version: string
    cpuModel: string
    cpuCores: number
    totalMemoryMb: number
    freeMemoryMb: number
  }
  imaging: {
    sharp: string
    libvips: string
    simd: boolean
    concurrency: number
    /** Which codecs the bundled libvips was compiled with. */
    formats: Record<string, { input: boolean; output: boolean }>
  }
  paths: {
    userData: string
    logs: string
    temp: string
    presets: string
  }
}

/* ================================================================== */
/* Updates                                                             */
/* ================================================================== */

export type UpdateState =
  'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export interface UpdateInfo {
  state: UpdateState
  version: string
  releaseNotes: string
  percent: number
  error: string
  /**
   * Whether this platform can only be told about an update rather than apply it.
   *
   * Installing an update on macOS goes through Squirrel, which refuses to
   * replace an application that is not signed with an Apple Developer ID, and
   * the updater there also expects a zip rather than the disk image BICO ships.
   * Checking needs neither, so the Mac build still reports a new version and
   * then sends the user to the download page to do it by hand.
   */
  manualDownload: boolean
  /** Where to send someone who has to fetch the update themselves. */
  releaseUrl: string
}

/* ================================================================== */
/* Logging                                                             */
/* ================================================================== */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogRecord {
  level: LogLevel
  scope: string
  message: string
  time: number
}

/* ================================================================== */
/* Results returned by dialogs                                         */
/* ================================================================== */

export interface PickResult {
  cancelled: boolean
  paths: string[]
}

export interface AddFilesOptions {
  /** Walk into subdirectories when a folder is dropped. */
  recursive: boolean
  /** Ignore files smaller than this many bytes, filters out stray icons. */
  minBytes: number
}

export interface AddFilesResult {
  files: SourceFile[]
  /** Paths that were rejected, with the reason. */
  rejected: { path: string; reason: string }[]
  scannedDirs: number
  durationMs: number
}
