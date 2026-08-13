import { useState } from 'react'
import { Collapse, Tag } from 'antd'
import {
  AppstoreOutlined,
  BgColorsOutlined,
  BulbOutlined,
  ColumnWidthOutlined,
  DashboardOutlined,
  FileImageOutlined,
  FolderOpenOutlined,
  HighlightOutlined,
  RotateRightOutlined,
  TagsOutlined
} from '@ant-design/icons'
import { DEFAULT_SETTINGS } from '@shared/defaults'
import { FORMATS } from '@shared/formats'
import type {
  AdjustSettings,
  ConversionSettings,
  MetadataSettings,
  OutputSettings,
  PerformanceSettings,
  ResizeSettings,
  SmartSettings,
  TransformSettings,
  VariantSpec,
  WatermarkSettings
} from '@shared/types'
import { useAppStore } from '../store/useAppStore'
import { useT, type Translate } from '../i18n'
import { Glyph, SECTION_TONES, type GlyphTone } from './Glyph'
import { PresetBar } from './PresetBar'
import { FormatSection } from './settings/FormatSection'
import { ResizeSection } from './settings/ResizeSection'
import { TransformSection } from './settings/TransformSection'
import { AdjustSection } from './settings/AdjustSection'
import { WatermarkSection } from './settings/WatermarkSection'
import { MetadataSection } from './settings/MetadataSection'
import { OutputSection } from './settings/OutputSection'
import { VariantsSection } from './settings/VariantsSection'
import { SmartSection } from './settings/SmartSection'
import { PerformanceSection } from './settings/PerformanceSection'

/**
 * The settings column.
 *
 * An accordion rather than ten open panels: the full settings surface is far
 * taller than any window, and keeping one section open at a time means the
 * scroll position stays meaningful. Each header carries a summary of what its
 * section is doing so the whole configuration can be read without opening any
 * of them.
 *
 * Every header also carries a tinted glyph in the tone its section owns, so the
 * closed accordion reads as a colour coded list. Finding the watermark controls
 * becomes recognising the amber tile rather than reading ten labels.
 */

/** Keeps a header badge short by naming the first thing and counting the rest. */
function summarise(parts: string[], t: Translate): string | null {
  const head = parts[0]
  if (head === undefined) return null
  return parts.length > 1
    ? t('settings.summary.more', { first: head, count: parts.length - 1 })
    : head
}

function formatSummary(settings: ConversionSettings, t: Translate): string {
  if (settings.format === 'original') return t('settings.summary.format.original')
  const caps = FORMATS[settings.format]
  if (caps.lossless && settings.lossless) {
    return t('settings.summary.format.lossless', { format: caps.label })
  }
  if (caps.quality) {
    return t('settings.summary.format.quality', {
      format: caps.label,
      quality: settings.quality
    })
  }
  return caps.label
}

function resizeSummary(resize: ResizeSettings, t: Translate): string | null {
  switch (resize.strategy) {
    case 'none':
      return null
    case 'exact':
      return resize.width !== null && resize.height !== null
        ? t('settings.summary.resize.exact', { width: resize.width, height: resize.height })
        : t('settings.summary.resize.exactUnset')
    case 'width':
      return resize.width === null
        ? t('settings.summary.resize.widthUnset')
        : t('settings.summary.resize.width', { value: resize.width })
    case 'height':
      return resize.height === null
        ? t('settings.summary.resize.heightUnset')
        : t('settings.summary.resize.height', { value: resize.height })
    case 'longest':
      return resize.width === null
        ? t('settings.summary.resize.longestUnset')
        : t('settings.summary.resize.longest', { value: resize.width })
    case 'shortest':
      return resize.width === null
        ? t('settings.summary.resize.shortestUnset')
        : t('settings.summary.resize.shortest', { value: resize.width })
    case 'percentage':
      return resize.percentage === 100
        ? null
        : t('settings.summary.resize.percentage', { value: resize.percentage })
    case 'megapixels':
      return t('settings.summary.resize.megapixels', { value: resize.megapixels })
    default:
      return null
  }
}

function transformSummary(transform: TransformSettings, t: Translate): string | null {
  const parts: string[] = []
  if (transform.rotate !== 0) {
    parts.push(t('settings.summary.transform.rotated', { angle: transform.rotate }))
  }
  if (transform.flipHorizontal && transform.flipVertical) {
    parts.push(t('settings.summary.transform.flippedBoth'))
  } else if (transform.flipHorizontal) parts.push(t('settings.summary.transform.mirrored'))
  else if (transform.flipVertical) parts.push(t('settings.summary.transform.flipped'))
  if (transform.crop.enabled) parts.push(t('settings.summary.transform.cropped'))
  if (transform.padding > 0) {
    parts.push(t('settings.summary.transform.border', { value: transform.padding }))
  }
  if (!transform.autoOrient) parts.push(t('settings.summary.transform.exifIgnored'))
  return summarise(parts, t)
}

function adjustSummary(adjust: AdjustSettings, t: Translate): string | null {
  const defaults = DEFAULT_SETTINGS.adjust
  const switches = [
    adjust.grayscale,
    adjust.invert,
    adjust.sepia,
    adjust.tint,
    adjust.flatten,
    adjust.gamma,
    adjust.normalize,
    adjust.clahe,
    adjust.sharpen,
    adjust.blur,
    adjust.median
  ]
  const moved = [
    adjust.brightness !== defaults.brightness,
    adjust.saturation !== defaults.saturation,
    adjust.contrast !== defaults.contrast,
    adjust.hue !== defaults.hue,
    adjust.lightness !== defaults.lightness
  ]

  const count = switches.filter(Boolean).length + moved.filter(Boolean).length
  if (count === 0) return null
  // The interpolation helper carries no plural rules, so the singular is its
  // own key and the call site picks.
  return count === 1
    ? t('settings.summary.adjust.activeOne')
    : t('settings.summary.adjust.active', { count })
}

function watermarkSummary(watermark: WatermarkSettings, t: Translate): string | null {
  if (watermark.kind === 'none') return null
  return watermark.kind === 'text'
    ? t('settings.summary.watermark.text')
    : t('settings.summary.watermark.image')
}

function metadataSummary(metadata: MetadataSettings, t: Translate): string | null {
  const parts: string[] = []
  if (metadata.policy === 'keep') parts.push(t('settings.summary.metadata.keepAll'))
  if (metadata.policy === 'keep-icc') parts.push(t('settings.summary.metadata.keepProfile'))
  if (metadata.policy === 'keep-copyright') {
    parts.push(t('settings.summary.metadata.keepCopyright'))
  }
  if (metadata.setDensity) {
    parts.push(t('settings.summary.metadata.density', { value: metadata.density }))
  }
  if (metadata.iccProfile) parts.push(t('settings.summary.metadata.customProfile'))
  if (metadata.copyright || metadata.artist) parts.push(t('settings.summary.metadata.attributed'))
  return summarise(parts, t)
}

function outputSummary(output: OutputSettings, t: Translate): string | null {
  const parts: string[] = []
  if (output.target === 'zip') parts.push(t('settings.summary.output.zip'))
  if (output.target === 'in-place') parts.push(t('settings.summary.output.inPlace'))
  if (output.structure === 'mirror') parts.push(t('settings.summary.output.mirror'))
  if (output.structure === 'by-format') parts.push(t('settings.summary.output.byFormat'))
  if (output.structure === 'by-date') parts.push(t('settings.summary.output.byDate'))
  if (output.template !== DEFAULT_SETTINGS.output.template) {
    parts.push(t('settings.summary.output.customNames'))
  }
  if (output.collision === 'overwrite') parts.push(t('settings.summary.output.overwrites'))
  if (output.collision === 'skip') parts.push(t('settings.summary.output.skipsExisting'))
  if (output.caseTransform !== 'none') parts.push(t('settings.summary.output.caseChanged'))
  if (output.skipIfLarger) parts.push(t('settings.summary.output.skipsGrowth'))
  if (output.writeReport) parts.push(t('settings.summary.output.report'))
  return summarise(parts, t)
}

function variantsSummary(variants: VariantSpec[], t: Translate): string | null {
  const enabled = variants.filter((variant) => variant.enabled).length
  if (enabled === 0) return null
  return enabled === 1
    ? t('settings.summary.variants.enabledOne')
    : t('settings.summary.variants.enabled', { count: enabled })
}

function smartSummary(smart: SmartSettings, t: Translate): string | null {
  const parts: string[] = []
  if (smart.sizeTarget === 'max-bytes') {
    parts.push(t('settings.summary.smart.under', { value: smart.targetKb }))
  }
  if (smart.sizeTarget === 'target-bytes') {
    parts.push(t('settings.summary.smart.about', { value: smart.targetKb }))
  }
  if (smart.autoFormat) parts.push(t('settings.summary.smart.autoFormat'))
  if (smart.autoPalette) parts.push(t('settings.summary.smart.autoPalette'))
  return summarise(parts, t)
}

function performanceSummary(performance: PerformanceSettings, t: Translate): string | null {
  const defaults = DEFAULT_SETTINGS.performance
  const parts: string[] = []
  if (performance.backend === 'gpu') parts.push(t('settings.summary.performance.gpuOnly'))
  if (performance.backend === 'cpu') parts.push(t('settings.summary.performance.cpuOnly'))
  if (performance.concurrency > 0) {
    parts.push(
      performance.concurrency === 1
        ? t('settings.summary.performance.workerOne')
        : t('settings.summary.performance.workers', { count: performance.concurrency })
    )
  }
  if (performance.useAllGpus) parts.push(t('settings.summary.performance.everyGpu'))
  if (!performance.gpuAssistedEncode) parts.push(t('settings.summary.performance.noGpuAssist'))
  if (performance.cacheMemoryMb !== defaults.cacheMemoryMb) {
    parts.push(t('settings.summary.performance.cache', { value: performance.cacheMemoryMb }))
  }
  return summarise(parts, t)
}

const BADGE_STYLE: React.CSSProperties = {
  margin: 0,
  flex: '0 0 auto',
  maxWidth: '48%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 11,
  borderColor: 'transparent',
  background: 'color-mix(in srgb, var(--bico-accent) 16%, transparent)',
  color: 'var(--bico-accent)'
}

const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  minWidth: 0
}

const HEADER_NAME: React.CSSProperties = {
  flex: '1 1 auto',
  fontSize: 13,
  fontWeight: 600
}

function sectionLabel(
  icon: React.ReactNode,
  tone: GlyphTone,
  name: string,
  badge: string | null
): React.JSX.Element {
  return (
    <div style={HEADER_STYLE}>
      <Glyph icon={icon} tone={tone} size="md" />
      <span className="bico-truncate" style={HEADER_NAME}>
        {name}
      </span>
      {badge === null ? null : <Tag style={BADGE_STYLE}>{badge}</Tag>}
    </div>
  )
}

export function SettingsSidebar(): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const t = useT()

  // Which section is open is a property of this view, not of the user's saved
  // preferences, so it stays in local state and resets with the component.
  const [openKey, setOpenKey] = useState('format')

  const items = [
    {
      key: 'format',
      label: sectionLabel(
        <FileImageOutlined />,
        SECTION_TONES.format,
        t('settings.section.format'),
        formatSummary(settings, t)
      ),
      children: <FormatSection />
    },
    {
      key: 'resize',
      label: sectionLabel(
        <ColumnWidthOutlined />,
        SECTION_TONES.resize,
        t('settings.section.resize'),
        resizeSummary(settings.resize, t)
      ),
      children: <ResizeSection />
    },
    {
      key: 'transform',
      label: sectionLabel(
        <RotateRightOutlined />,
        SECTION_TONES.transform,
        t('settings.section.transform'),
        transformSummary(settings.transform, t)
      ),
      children: <TransformSection />
    },
    {
      key: 'adjust',
      label: sectionLabel(
        <BgColorsOutlined />,
        SECTION_TONES.adjust,
        t('settings.section.adjust'),
        adjustSummary(settings.adjust, t)
      ),
      children: <AdjustSection />
    },
    {
      key: 'watermark',
      label: sectionLabel(
        <HighlightOutlined />,
        SECTION_TONES.watermark,
        t('settings.section.watermark'),
        watermarkSummary(settings.watermark, t)
      ),
      children: <WatermarkSection />
    },
    {
      key: 'metadata',
      label: sectionLabel(
        <TagsOutlined />,
        SECTION_TONES.metadata,
        t('settings.section.metadata'),
        metadataSummary(settings.metadata, t)
      ),
      children: <MetadataSection />
    },
    {
      key: 'output',
      label: sectionLabel(
        <FolderOpenOutlined />,
        SECTION_TONES.output,
        t('settings.section.output'),
        outputSummary(settings.output, t)
      ),
      children: <OutputSection />
    },
    {
      key: 'variants',
      label: sectionLabel(
        <AppstoreOutlined />,
        SECTION_TONES.variants,
        t('settings.section.variants'),
        variantsSummary(settings.variants, t)
      ),
      children: <VariantsSection />
    },
    {
      key: 'smart',
      label: sectionLabel(
        <BulbOutlined />,
        SECTION_TONES.smart,
        t('settings.section.smart'),
        smartSummary(settings.smart, t)
      ),
      children: <SmartSection />
    },
    {
      key: 'performance',
      label: sectionLabel(
        <DashboardOutlined />,
        SECTION_TONES.performance,
        t('settings.section.performance'),
        performanceSummary(settings.performance, t)
      ),
      children: <PerformanceSection />
    }
  ]

  return (
    <>
      <div
        style={{
          flex: '0 0 auto',
          padding: '10px 12px',
          borderBottom: '1px solid var(--bico-border)'
        }}
      >
        <PresetBar />
      </div>

      <div className="bico-sidebar-scroll">
        <Collapse
          accordion
          expandIconPlacement="end"
          activeKey={openKey === '' ? [] : [openKey]}
          onChange={(keys) => setOpenKey(keys[0] ?? '')}
          items={items}
        />
      </div>
    </>
  )
}
