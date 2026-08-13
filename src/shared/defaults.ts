import { DEFAULT_LANGUAGE } from './i18n/types'
import { DEFAULT_THEME_ID } from './themes'
import type { AppPreferences, ConversionSettings, WatchConfig } from './types'

/**
 * The settings a fresh install starts from.
 *
 * Every field is present, so code downstream never has to guard against a
 * missing property. Persisted settings are merged on top of this object, which
 * also means a new field added in a future version gets a sane value for users
 * upgrading from an older one.
 */
export const DEFAULT_SETTINGS: ConversionSettings = {
  format: 'webp',
  quality: 82,
  lossless: false,
  effort: 4,
  alphaQuality: 100,
  chromaSubsampling: '4:2:0',
  progressive: true,

  mozjpeg: true,
  trellisQuantisation: false,
  overshootDeringing: false,
  optimiseScans: false,

  pngCompressionLevel: 7,
  pngPalette: false,
  pngColours: 256,
  pngDither: 1,
  pngAdaptiveFiltering: false,

  nearLossless: false,
  smartSubsample: true,

  tiffCompression: 'lzw',
  tiffPredictor: 'horizontal',
  tiffPyramid: false,
  tiffBitdepth: 8,

  gifColours: 256,
  gifDither: 1,
  gifLoop: 0,

  animated: true,

  resize: {
    strategy: 'none',
    width: null,
    height: null,
    percentage: 100,
    megapixels: 4,
    fit: 'inside',
    position: 'center',
    kernel: 'lanczos3',
    withoutEnlargement: true,
    withoutReduction: false,
    background: '#00000000'
  },

  transform: {
    autoOrient: true,
    rotate: 0,
    flipVertical: false,
    flipHorizontal: false,
    crop: {
      enabled: false,
      mode: 'manual',
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      aspectRatio: 1,
      trimThreshold: 10
    },
    padding: 0,
    paddingColor: '#00000000'
  },

  adjust: {
    grayscale: false,
    invert: false,
    sepia: false,
    brightness: 1,
    saturation: 1,
    hue: 0,
    lightness: 0,
    contrast: 1,
    normalize: false,
    normalizeLower: 1,
    normalizeUpper: 99,
    clahe: false,
    claheWidth: 32,
    claheHeight: 32,
    claheMaxSlope: 3,
    gamma: false,
    gammaValue: 2.2,
    sharpen: false,
    sharpenSigma: 1,
    sharpenM1: 1,
    sharpenM2: 2,
    blur: false,
    blurSigma: 1,
    median: false,
    medianSize: 3,
    tint: false,
    tintColor: '#ffffff',
    flatten: false,
    flattenColor: '#ffffff'
  },

  watermark: {
    kind: 'none',
    text: '',
    fontSize: 32,
    fontFamily: 'Segoe UI',
    color: '#ffffff',
    imagePath: '',
    position: 'southeast',
    opacity: 60,
    scale: 20,
    marginX: 24,
    marginY: 24,
    tile: false,
    rotation: 0
  },

  metadata: {
    policy: 'strip',
    setDensity: false,
    density: 72,
    iccProfile: '',
    copyright: '',
    artist: ''
  },

  output: {
    target: 'folder',
    folder: '',
    zipPath: '',
    structure: 'flat',
    collision: 'rename',
    template: '{name}',
    caseTransform: 'none',
    sanitize: true,
    skipIfLarger: false,
    zipCompressionLevel: 6,
    writeReport: false
  },

  performance: {
    backend: 'auto',
    concurrency: 0,
    vipsConcurrency: 0,
    cacheMemoryMb: 256,
    maxPixels: 400_000_000,
    preferDiscreteGpu: true,
    useAllGpus: false,
    gpuAssistedEncode: true
  },

  smart: {
    sizeTarget: 'off',
    targetKb: 300,
    minQuality: 40,
    maxQuality: 95,
    autoFormat: false,
    autoPalette: false
  },

  variants: []
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'dark',
  themeId: DEFAULT_THEME_ID,
  language: DEFAULT_LANGUAGE,
  accent: '#4c8dff',
  compactUi: false,
  queueView: 'table',
  confirmBeforeRun: true,
  notifyOnComplete: true,
  openOutputWhenDone: false,
  taskbarProgress: true,
  minimiseToTray: false,
  autoCheckUpdates: true,
  welcomeSeenVersion: '',
  lastSettings: null,
  lastPresetId: 'balanced-web',
  sidebarWidth: 340
}

export const DEFAULT_WATCH: WatchConfig = {
  enabled: false,
  folder: '',
  recursive: true,
  settleMs: 1500,
  moveProcessedTo: '',
  deleteAfterProcess: false
}

/** Longest edge used when rendering the live preview. */
export const PREVIEW_MAX_EDGE = 1280

/** Thumbnail edge for the queue table and grid. */
export const THUMBNAIL_SIZE = 96

/** Above this pixel count an image never goes near a GPU lane. */
export const GPU_MAX_PIXELS = 40_000_000

/** Maximum entries kept in the run history file. */
export const HISTORY_LIMIT = 50
