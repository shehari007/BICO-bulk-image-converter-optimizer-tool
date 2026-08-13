import type { Preset } from './types'

/**
 * Presets that ship with the app.
 *
 * Each one is a partial override of `DEFAULT_SETTINGS`, so a preset only has to
 * state what makes it different. `builtin` presets cannot be deleted, but the
 * user can duplicate one, adjust it and save the result as their own.
 */
export const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'balanced-web',
    name: 'Balanced Web',
    description:
      'WebP at quality 82 capped to 2560px on the long edge. The default answer for almost any website.',
    icon: 'global',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'webp',
      quality: 82,
      effort: 4,
      smartSubsample: true,
      lossless: false,
      resize: { strategy: 'longest', width: 2560, withoutEnlargement: true },
      metadata: { policy: 'strip' },
      output: { template: '{name}' }
    }
  },
  {
    id: 'maximum-compression',
    name: 'Maximum Compression',
    description:
      'AVIF at quality 52 with high encoder effort. The smallest files BICO can produce, at the cost of encode time.',
    icon: 'compress',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'avif',
      quality: 52,
      effort: 7,
      chromaSubsampling: '4:2:0',
      resize: { strategy: 'longest', width: 2048, withoutEnlargement: true },
      metadata: { policy: 'strip' }
    }
  },
  {
    id: 'photo-jpeg',
    name: 'Photography JPEG',
    description:
      'MozJPEG at quality 90 with full chroma and a progressive scan order. Keeps the colour profile so prints match the screen.',
    icon: 'camera',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'jpeg',
      quality: 90,
      mozjpeg: true,
      trellisQuantisation: true,
      overshootDeringing: true,
      optimiseScans: true,
      progressive: true,
      chromaSubsampling: '4:4:4',
      metadata: { policy: 'keep-icc' },
      resize: { strategy: 'none' }
    }
  },
  {
    id: 'responsive-set',
    name: 'Responsive Image Set',
    description:
      'One source in, four WebP renditions out at 480, 960, 1440 and 1920 wide, named ready for a srcset attribute.',
    icon: 'responsive',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'webp',
      quality: 80,
      effort: 4,
      resize: { strategy: 'width', width: 1920, withoutEnlargement: true },
      metadata: { policy: 'strip' },
      output: { template: '{name}' },
      variants: [
        {
          id: 'v480',
          enabled: true,
          label: 'Small',
          format: null,
          quality: null,
          strategy: 'width',
          value: 480,
          suffix: '-480w'
        },
        {
          id: 'v960',
          enabled: true,
          label: 'Medium',
          format: null,
          quality: null,
          strategy: 'width',
          value: 960,
          suffix: '-960w'
        },
        {
          id: 'v1440',
          enabled: true,
          label: 'Large',
          format: null,
          quality: null,
          strategy: 'width',
          value: 1440,
          suffix: '-1440w'
        }
      ]
    }
  },
  {
    id: 'modern-with-fallback',
    name: 'AVIF plus JPEG Fallback',
    description:
      'Writes an AVIF as the primary output and a JPEG alongside it, so a picture element can serve either.',
    icon: 'layers',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'avif',
      quality: 60,
      effort: 5,
      resize: { strategy: 'longest', width: 2048, withoutEnlargement: true },
      metadata: { policy: 'strip' },
      variants: [
        {
          id: 'fallback-jpeg',
          enabled: true,
          label: 'JPEG fallback',
          format: 'jpeg',
          quality: 84,
          strategy: 'none',
          value: 0,
          suffix: '-fallback'
        }
      ]
    }
  },
  {
    id: 'thumbnails',
    name: 'Square Thumbnails',
    description:
      'Crops to a 512 by 512 square using attention based cropping, so faces and subjects stay in frame.',
    icon: 'crop',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'webp',
      quality: 78,
      effort: 4,
      resize: {
        strategy: 'exact',
        width: 512,
        height: 512,
        fit: 'cover',
        position: 'attention',
        withoutEnlargement: false
      },
      metadata: { policy: 'strip' },
      output: { template: '{name}-thumb' }
    }
  },
  {
    id: 'social-post',
    name: 'Social Post',
    description:
      'JPEG at quality 88 capped to 1440px. Matches what Instagram, X and LinkedIn re encode to anyway.',
    icon: 'share',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'jpeg',
      quality: 88,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:2:0',
      resize: { strategy: 'longest', width: 1440, withoutEnlargement: true },
      metadata: { policy: 'strip' }
    }
  },
  {
    id: 'email-budget',
    name: 'Email Size Budget',
    description:
      'Searches the quality slider per image until each JPEG lands under 400 KB, so a batch never bounces off an attachment limit.',
    icon: 'mail',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'jpeg',
      quality: 85,
      mozjpeg: true,
      progressive: true,
      resize: { strategy: 'longest', width: 2048, withoutEnlargement: true },
      metadata: { policy: 'strip' },
      smart: { sizeTarget: 'max-bytes', targetKb: 400, minQuality: 45, maxQuality: 92 }
    }
  },
  {
    id: 'print-archive',
    name: 'Print Archive',
    description:
      'Lossless LZW TIFF at 300 DPI with every metadata field preserved. The format print shops ask for.',
    icon: 'printer',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'tiff',
      tiffCompression: 'lzw',
      tiffPredictor: 'horizontal',
      quality: 100,
      resize: { strategy: 'none' },
      metadata: { policy: 'keep', setDensity: true, density: 300 }
    }
  },
  {
    id: 'lossless-ui',
    name: 'Lossless UI Assets',
    description:
      'Maximum effort PNG with adaptive filtering. Pixel exact output for icons, logos and screenshots.',
    icon: 'appstore',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'png',
      effort: 10,
      pngCompressionLevel: 9,
      pngAdaptiveFiltering: true,
      pngPalette: false,
      resize: { strategy: 'none' },
      metadata: { policy: 'strip' }
    }
  },
  {
    id: 'palette-flat-art',
    name: 'Palette Flat Artwork',
    description:
      'Quantises to a 128 colour PNG palette. Cuts flat illustration and screenshot sizes by more than half with no visible change.',
    icon: 'bgcolors',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'png',
      pngPalette: true,
      pngColours: 128,
      pngDither: 0.6,
      pngCompressionLevel: 9,
      effort: 9,
      metadata: { policy: 'strip' }
    }
  },
  {
    id: 'gpu-fast-batch',
    name: 'GPU Fast Batch',
    description:
      'Low encoder effort and every GPU lane enabled. Built for clearing thousands of files quickly rather than for the last byte.',
    icon: 'thunderbolt',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'webp',
      quality: 80,
      effort: 1,
      resize: { strategy: 'longest', width: 2048, withoutEnlargement: true },
      metadata: { policy: 'strip' },
      performance: { backend: 'gpu', useAllGpus: true, gpuAssistedEncode: true }
    }
  },
  {
    id: 'watermark-proof',
    name: 'Watermarked Proof',
    description:
      'Half size JPEG with a tiled text watermark across it. For sending client proofs that are not worth stealing.',
    icon: 'safety',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'jpeg',
      quality: 78,
      mozjpeg: true,
      resize: { strategy: 'percentage', percentage: 50 },
      metadata: { policy: 'strip' },
      watermark: {
        kind: 'text',
        text: 'PROOF',
        fontSize: 48,
        color: '#ffffff',
        opacity: 35,
        position: 'center',
        tile: true,
        rotation: -30
      }
    }
  },
  {
    id: 'document-scan',
    name: 'Document Scan Cleanup',
    description:
      'Grayscale, level stretched and sharpened, then written as a compact PNG. Turns phone photos of paper into something readable.',
    icon: 'filetext',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'png',
      pngPalette: true,
      pngColours: 32,
      pngCompressionLevel: 9,
      effort: 9,
      adjust: {
        grayscale: true,
        normalize: true,
        normalizeLower: 5,
        normalizeUpper: 95,
        sharpen: true,
        sharpenSigma: 1.4,
        contrast: 1.15
      },
      transform: { autoOrient: true },
      metadata: { policy: 'strip' }
    }
  },
  {
    id: 'jxl-archive',
    name: 'JPEG XL Archive',
    description:
      'Near transparent JPEG XL at distance 0.6 with metadata kept. A long term storage format that outperforms AVIF on detail.',
    icon: 'database',
    builtin: true,
    createdAt: 0,
    updatedAt: 0,
    settings: {
      format: 'jxl',
      quality: 93,
      effort: 6,
      resize: { strategy: 'none' },
      metadata: { policy: 'keep' }
    }
  }
]

export const DEFAULT_PRESET_ID = 'balanced-web'
