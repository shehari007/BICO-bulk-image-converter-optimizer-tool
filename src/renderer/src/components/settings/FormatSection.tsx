import { InputNumber, Segmented, Select, Slider, Tag } from 'antd'
import {
  ExperimentOutlined,
  FileImageOutlined,
  StarOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { FORMATS, OUTPUT_FORMAT_IDS, formatCapabilities } from '@shared/formats'
import { clamp } from '@shared/utils'
import type {
  ChromaSubsampling,
  ConversionSettings,
  FormatCapabilities,
  OutputFormat,
  TiffCompression
} from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { formatCopyKey, useT, type TranslationKey, type Translate } from '../../i18n'
import { SECTION_TONES } from '../Glyph'
import { Field, SectionHint, SwitchField } from './Field'

/**
 * The format picker and every encoder control that belongs to it.
 *
 * Which controls appear is decided entirely by the capability table in
 * shared/formats. A user who picks JPEG never sees an alpha slider, and one who
 * picks PNG never sees chroma subsampling, because neither codec has the
 * concept. Only the handful of genuinely per codec extras are keyed off the
 * format id itself.
 */

type FormatOptionType = {
  value: OutputFormat
  label: string
  description: string
  disabled?: boolean
}

const TONE = SECTION_TONES.format

/**
 * The tradeoffs worth seeing before committing to a codec. Each entry carries
 * both readings so the row states what the format cannot do rather than going
 * silent about it, which is the part that costs people a whole batch.
 */
const CAPABILITY_TAGS: {
  on: TranslationKey
  off: TranslationKey
  read: (caps: FormatCapabilities) => boolean
}[] = [
  {
    on: 'settings.format.caps.alpha.on',
    off: 'settings.format.caps.alpha.off',
    read: (caps) => caps.alpha
  },
  {
    on: 'settings.format.caps.animation.on',
    off: 'settings.format.caps.animation.off',
    read: (caps) => caps.animation
  },
  {
    on: 'settings.format.caps.lossless.on',
    off: 'settings.format.caps.lossless.off',
    read: (caps) => caps.lossless
  },
  {
    on: 'settings.format.caps.hdr.on',
    off: 'settings.format.caps.hdr.off',
    read: (caps) => caps.hdr
  },
  {
    on: 'settings.format.caps.metadata.on',
    off: 'settings.format.caps.metadata.off',
    read: (caps) => caps.metadata
  }
]

const TAG_BASE: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  lineHeight: '18px',
  borderColor: 'transparent'
}

const TAG_ON: React.CSSProperties = {
  ...TAG_BASE,
  background: 'color-mix(in srgb, var(--bico-success) 16%, transparent)',
  color: 'var(--bico-success)'
}

const TAG_OFF: React.CSSProperties = {
  ...TAG_BASE,
  background: 'color-mix(in srgb, var(--bico-text-muted) 16%, transparent)',
  color: 'var(--bico-text-muted)'
}

// Logical properties throughout, so the rule that marks a nested group sits on
// the reading edge in Arabic rather than staying pinned to the left.
const NESTED: React.CSSProperties = {
  marginBottom: 10,
  paddingInlineStart: 10,
  borderInlineStart: '1px solid var(--bico-border)'
}

const CHROMA_OPTIONS: { label: string; value: ChromaSubsampling }[] = [
  { label: '4:4:4', value: '4:4:4' },
  { label: '4:2:2', value: '4:2:2' },
  { label: '4:2:0', value: '4:2:0' }
]

type TiffPredictor = ConversionSettings['tiffPredictor']
type TiffBitdepth = ConversionSettings['tiffBitdepth']

const TIFF_BITDEPTH_OPTIONS: { label: string; value: TiffBitdepth }[] = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: '8', value: 8 }
]

/**
 * The writable format list, built fresh on every render.
 *
 * It is derived from the registry rather than written out here so that a codec
 * another release adds, JPEG 2000 among them, appears without this file being
 * touched.
 */
function buildFormatOptions(t: Translate): FormatOptionType[] {
  return [
    ...OUTPUT_FORMAT_IDS.map((id): FormatOptionType => {
      const caps = FORMATS[id]
      return {
        value: caps.id,
        label: caps.label,
        description: t(formatCopyKey(caps.id, 'tagline'))
      }
    }),
    {
      value: 'original',
      label: t('settings.format.original.label'),
      description: t('settings.format.original.tagline')
    }
  ]
}

/**
 * Compression schemes libvips can write into a TIFF.
 *
 * The lossless names are trademarks or acronyms and stay as written; only the
 * two that are ordinary English carry a key.
 */
function tiffCompressionOptions(t: Translate): { label: string; value: TiffCompression }[] {
  return [
    { label: 'LZW', value: 'lzw' },
    { label: 'Deflate', value: 'deflate' },
    { label: 'PackBits', value: 'packbits' },
    { label: 'ZSTD', value: 'zstd' },
    { label: 'WebP', value: 'webp' },
    { label: 'JPEG', value: 'jpeg' },
    { label: 'JPEG 2000', value: 'jp2k' },
    { label: t('settings.format.tiff.compression.ccitt'), value: 'ccittfax4' },
    { label: t('state.none'), value: 'none' }
  ]
}

function tiffPredictorOptions(t: Translate): { label: string; value: TiffPredictor }[] {
  return [
    { label: t('state.none'), value: 'none' },
    { label: t('settings.format.tiff.predictor.horizontal'), value: 'horizontal' },
    { label: t('settings.format.tiff.predictor.float'), value: 'float' }
  ]
}

export function FormatSection(): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const codecs = useAppStore((state) => state.system?.imaging.formats)
  const t = useT()

  /**
   * Which codecs the libvips build on this machine can actually write.
   *
   * HEIF depends on codecs that vary by platform, so it can be missing even
   * though the format itself is supported. Offering a codec this build cannot
   * write would let the user start a run that fails on every single file, so the
   * picker greys it out and says why instead. JPEG XL never appears here because
   * BICO ships that codec itself rather than relying on libvips.
   */
  const options = buildFormatOptions(t).map((option) => {
    if (option.value === 'original' || !codecs) return option
    const support = codecs[option.value]
    if (!support || support.output) return option
    return {
      ...option,
      disabled: true,
      description: t('settings.format.unavailable')
    }
  })

  const caps = formatCapabilities(settings.format)
  const losslessOn = caps !== null && caps.lossless && settings.lossless

  // Pulled out of the markup because the effort range is per codec and both the
  // clamped value and the end labels are derived from it.
  const effortRange = caps?.effort ?? null
  const effortValue = effortRange
    ? clamp(settings.effort, effortRange.min, effortRange.max)
    : settings.effort
  const effortMarks: Record<string, string> = effortRange
    ? {
        [String(effortRange.min)]: t('settings.format.effort.fast'),
        [String(effortRange.max)]: t('settings.format.effort.small')
      }
    : {}

  const handleFormat = (format: OutputFormat): void => {
    // Effort ranges are per codec, so a value carried over from the previous
    // format can land outside what the new one will accept.
    const next = formatCapabilities(format)
    const effort = next?.effort
      ? clamp(settings.effort, next.effort.min, next.effort.max)
      : settings.effort
    patchSettings({ format, effort })
  }

  return (
    <div style={{ minWidth: 0 }}>
      <Field label={t('settings.format.label')} icon={<FileImageOutlined />} tone={TONE}>
        <Select<OutputFormat, FormatOptionType>
          value={settings.format}
          onChange={handleFormat}
          options={options}
          style={{ width: '100%' }}
          listHeight={340}
          showSearch={{ optionFilterProp: 'label' }}
          optionRender={(option) => (
            <div style={{ minWidth: 0, paddingBlock: 2 }}>
              <div style={{ fontWeight: 550 }}>{option.data.label}</div>
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.4,
                  whiteSpace: 'normal',
                  color: 'var(--bico-text-muted)'
                }}
              >
                {option.data.description}
              </div>
            </div>
          )}
        />
      </Field>

      <SectionHint>
        {t(formatCopyKey(caps === null ? 'original' : caps.id, 'description'))}
      </SectionHint>

      {caps === null ? null : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
          {CAPABILITY_TAGS.map((entry) => {
            const supported = entry.read(caps)
            return (
              <Tag key={entry.on} style={supported ? TAG_ON : TAG_OFF}>
                {t(supported ? entry.on : entry.off)}
              </Tag>
            )
          })}
          <Tag style={caps.browserEncodable ? TAG_ON : TAG_OFF}>
            {t(
              caps.browserEncodable ? 'settings.format.caps.gpu.on' : 'settings.format.caps.gpu.off'
            )}
          </Tag>
        </div>
      )}

      {caps !== null && caps.quality ? (
        <Field
          label={t('settings.format.quality.label')}
          icon={<StarOutlined />}
          tone={TONE}
          value={settings.quality}
          hint={t('settings.format.quality.hint')}
        >
          <Slider
            min={1}
            max={100}
            value={settings.quality}
            disabled={losslessOn}
            onChange={(quality) => patchSettings({ quality })}
          />
        </Field>
      ) : null}

      {caps !== null && caps.lossless ? (
        <SwitchField
          label={t('settings.format.lossless.label')}
          hint={t('settings.format.lossless.hint')}
          checked={settings.lossless}
          onChange={(lossless) => patchSettings({ lossless })}
        />
      ) : null}

      {effortRange !== null ? (
        <Field
          label={t('settings.format.effort.label')}
          icon={<ThunderboltOutlined />}
          tone={TONE}
          value={effortValue}
          hint={t('settings.format.effort.hint')}
        >
          <Slider
            min={effortRange.min}
            max={effortRange.max}
            value={effortValue}
            marks={effortMarks}
            onChange={(effort) => patchSettings({ effort })}
          />
        </Field>
      ) : null}

      {caps !== null && caps.chroma ? (
        <Field label={t('settings.format.chroma.label')} hint={t('settings.format.chroma.hint')}>
          <Segmented<ChromaSubsampling>
            block
            size="small"
            value={settings.chromaSubsampling}
            options={CHROMA_OPTIONS}
            disabled={losslessOn}
            onChange={(chromaSubsampling) => patchSettings({ chromaSubsampling })}
          />
        </Field>
      ) : null}

      {caps !== null && caps.alpha ? (
        <Field
          label={t('settings.format.alphaQuality.label')}
          value={settings.alphaQuality}
          hint={t('settings.format.alphaQuality.hint')}
        >
          <Slider
            min={0}
            max={100}
            value={settings.alphaQuality}
            disabled={losslessOn}
            onChange={(alphaQuality) => patchSettings({ alphaQuality })}
          />
        </Field>
      ) : null}

      {caps !== null && caps.progressive ? (
        <SwitchField
          label={t('settings.format.progressive.label')}
          hint={t('settings.format.progressive.hint')}
          checked={settings.progressive}
          onChange={(progressive) => patchSettings({ progressive })}
        />
      ) : null}

      {caps !== null && caps.animation ? (
        <SwitchField
          label={t('settings.format.animated.label')}
          hint={t('settings.format.animated.hint')}
          checked={settings.animated}
          onChange={(animated) => patchSettings({ animated })}
        />
      ) : null}

      {settings.format === 'jpeg' ? (
        <>
          <div className="bico-section-title">{t('settings.format.jpeg.title')}</div>
          <SwitchField
            label={t('settings.format.jpeg.mozjpeg.label')}
            hint={t('settings.format.jpeg.mozjpeg.hint')}
            checked={settings.mozjpeg}
            onChange={(mozjpeg) => patchSettings({ mozjpeg })}
          />
          <SwitchField
            label={t('settings.format.jpeg.trellis.label')}
            hint={t('settings.format.jpeg.trellis.hint')}
            checked={settings.trellisQuantisation}
            disabled={!settings.mozjpeg}
            onChange={(trellisQuantisation) => patchSettings({ trellisQuantisation })}
          />
          <SwitchField
            label={t('settings.format.jpeg.overshoot.label')}
            hint={t('settings.format.jpeg.overshoot.hint')}
            checked={settings.overshootDeringing}
            disabled={!settings.mozjpeg}
            onChange={(overshootDeringing) => patchSettings({ overshootDeringing })}
          />
          <SwitchField
            label={t('settings.format.jpeg.scans.label')}
            hint={t('settings.format.jpeg.scans.hint')}
            checked={settings.optimiseScans}
            disabled={!settings.mozjpeg}
            onChange={(optimiseScans) => patchSettings({ optimiseScans })}
          />
        </>
      ) : null}

      {settings.format === 'png' ? (
        <>
          <div className="bico-section-title">{t('settings.format.png.title')}</div>
          <Field
            label={t('settings.format.png.compression.label')}
            value={settings.pngCompressionLevel}
            hint={t('settings.format.png.compression.hint')}
          >
            <Slider
              min={0}
              max={9}
              value={settings.pngCompressionLevel}
              onChange={(pngCompressionLevel) => patchSettings({ pngCompressionLevel })}
            />
          </Field>
          <SwitchField
            label={t('settings.format.png.palette.label')}
            hint={t('settings.format.png.palette.hint')}
            checked={settings.pngPalette}
            onChange={(pngPalette) => patchSettings({ pngPalette })}
          />
          {settings.pngPalette ? (
            <div style={NESTED}>
              <Field
                label={t('settings.format.png.colours.label')}
                value={settings.pngColours}
                hint={t('settings.format.png.colours.hint')}
              >
                <Slider
                  min={2}
                  max={256}
                  value={settings.pngColours}
                  onChange={(pngColours) => patchSettings({ pngColours })}
                />
              </Field>
              <Field
                label={t('settings.format.png.dither.label')}
                value={settings.pngDither.toFixed(2)}
                hint={t('settings.format.png.dither.hint')}
              >
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.pngDither}
                  onChange={(pngDither) => patchSettings({ pngDither })}
                />
              </Field>
            </div>
          ) : null}
          <SwitchField
            label={t('settings.format.png.adaptive.label')}
            hint={t('settings.format.png.adaptive.hint')}
            checked={settings.pngAdaptiveFiltering}
            onChange={(pngAdaptiveFiltering) => patchSettings({ pngAdaptiveFiltering })}
          />
        </>
      ) : null}

      {settings.format === 'webp' ? (
        <>
          <div className="bico-section-title">{t('settings.format.webp.title')}</div>
          <SwitchField
            label={t('settings.format.webp.nearLossless.label')}
            hint={t('settings.format.webp.nearLossless.hint')}
            checked={settings.nearLossless}
            onChange={(nearLossless) => patchSettings({ nearLossless })}
          />
          <SwitchField
            label={t('settings.format.webp.smartSubsample.label')}
            hint={t('settings.format.webp.smartSubsample.hint')}
            checked={settings.smartSubsample}
            onChange={(smartSubsample) => patchSettings({ smartSubsample })}
          />
        </>
      ) : null}

      {settings.format === 'tiff' ? (
        <>
          <div className="bico-section-title">{t('settings.format.tiff.title')}</div>
          <Field
            label={t('settings.format.tiff.compression.label')}
            hint={t('settings.format.tiff.compression.hint')}
          >
            <Select<TiffCompression>
              value={settings.tiffCompression}
              options={tiffCompressionOptions(t)}
              style={{ width: '100%' }}
              onChange={(tiffCompression) => patchSettings({ tiffCompression })}
            />
          </Field>
          <Field
            label={t('settings.format.tiff.predictor.label')}
            hint={t('settings.format.tiff.predictor.hint')}
          >
            <Select<TiffPredictor>
              value={settings.tiffPredictor}
              options={tiffPredictorOptions(t)}
              style={{ width: '100%' }}
              onChange={(tiffPredictor) => patchSettings({ tiffPredictor })}
            />
          </Field>
          <Field
            label={t('settings.format.tiff.bitdepth.label')}
            hint={t('settings.format.tiff.bitdepth.hint')}
          >
            <Segmented<TiffBitdepth>
              block
              size="small"
              value={settings.tiffBitdepth}
              options={TIFF_BITDEPTH_OPTIONS}
              onChange={(tiffBitdepth) => patchSettings({ tiffBitdepth })}
            />
          </Field>
          <SwitchField
            label={t('settings.format.tiff.pyramid.label')}
            hint={t('settings.format.tiff.pyramid.hint')}
            checked={settings.tiffPyramid}
            onChange={(tiffPyramid) => patchSettings({ tiffPyramid })}
          />
        </>
      ) : null}

      {settings.format === 'gif' ? (
        <>
          <div className="bico-section-title">{t('settings.format.gif.title')}</div>
          <Field
            label={t('settings.format.gif.colours.label')}
            value={settings.gifColours}
            hint={t('settings.format.gif.colours.hint')}
          >
            <Slider
              min={2}
              max={256}
              value={settings.gifColours}
              onChange={(gifColours) => patchSettings({ gifColours })}
            />
          </Field>
          <Field
            label={t('settings.format.gif.dither.label')}
            value={settings.gifDither.toFixed(2)}
            hint={t('settings.format.gif.dither.hint')}
          >
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={settings.gifDither}
              onChange={(gifDither) => patchSettings({ gifDither })}
            />
          </Field>
          <Field
            label={t('settings.format.gif.loop.label')}
            hint={t('settings.format.gif.loop.hint')}
          >
            <InputNumber<number>
              min={0}
              max={65535}
              value={settings.gifLoop}
              style={{ width: '100%' }}
              onChange={(gifLoop) => patchSettings({ gifLoop: gifLoop ?? 0 })}
            />
          </Field>
        </>
      ) : null}

      {settings.format === 'jxl' ? (
        <>
          <div className="bico-section-title">
            <ExperimentOutlined style={{ marginInlineEnd: 6 }} />
            {t('settings.format.jxl.title')}
          </div>
          <SectionHint>{t('settings.format.jxl.note')}</SectionHint>
        </>
      ) : null}
    </div>
  )
}
