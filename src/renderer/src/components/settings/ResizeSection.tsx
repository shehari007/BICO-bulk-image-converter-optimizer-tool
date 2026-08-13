import { ColorPicker, InputNumber, Segmented, Select, Slider } from 'antd'
import { AimOutlined, ColumnWidthOutlined, ExpandOutlined } from '@ant-design/icons'
import type {
  FitMode,
  GravityPosition,
  ResizeKernel,
  ResizeSettings,
  ResizeStrategy
} from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { useT, type TranslationKey, type Translate } from '../../i18n'
import { SECTION_TONES } from '../Glyph'
import { Field, SectionHint, SwitchField } from './Field'

/**
 * Resizing.
 *
 * The strategy picker decides which inputs are even meaningful, so only those
 * are rendered. The sentence under them is the point of this panel: resize
 * options interact in ways that are easy to get wrong, and reading the outcome
 * back in plain English catches a bad combination before a thousand files do.
 */

const TONE = SECTION_TONES.resize

const STRATEGY_KEYS: { key: TranslationKey; value: ResizeStrategy }[] = [
  { key: 'settings.resize.strategy.none', value: 'none' },
  { key: 'settings.resize.strategy.exact', value: 'exact' },
  { key: 'settings.resize.strategy.width', value: 'width' },
  { key: 'settings.resize.strategy.height', value: 'height' },
  { key: 'settings.resize.strategy.longest', value: 'longest' },
  { key: 'settings.resize.strategy.shortest', value: 'shortest' },
  { key: 'settings.resize.strategy.percentage', value: 'percentage' },
  { key: 'settings.resize.strategy.megapixels', value: 'megapixels' }
]

const FIT_KEYS: { key: TranslationKey; value: FitMode }[] = [
  { key: 'settings.resize.fit.cover', value: 'cover' },
  { key: 'settings.resize.fit.contain', value: 'contain' },
  { key: 'settings.resize.fit.fill', value: 'fill' },
  { key: 'settings.resize.fit.inside', value: 'inside' },
  { key: 'settings.resize.fit.outside', value: 'outside' }
]

/** Anchors offered for a crop or a pad, including the two content aware ones. */
const POSITION_KEYS: { key: TranslationKey; value: GravityPosition }[] = [
  { key: 'settings.position.center', value: 'center' },
  { key: 'settings.position.north', value: 'north' },
  { key: 'settings.position.northeast', value: 'northeast' },
  { key: 'settings.position.east', value: 'east' },
  { key: 'settings.position.southeast', value: 'southeast' },
  { key: 'settings.position.south', value: 'south' },
  { key: 'settings.position.southwest', value: 'southwest' },
  { key: 'settings.position.west', value: 'west' },
  { key: 'settings.position.northwest', value: 'northwest' },
  { key: 'settings.position.entropy', value: 'entropy' },
  { key: 'settings.position.attention', value: 'attention' }
]

const KERNEL_KEYS: { key: TranslationKey; value: ResizeKernel }[] = [
  { key: 'settings.resize.kernel.lanczos3', value: 'lanczos3' },
  { key: 'settings.resize.kernel.lanczos2', value: 'lanczos2' },
  { key: 'settings.resize.kernel.mitchell', value: 'mitchell' },
  { key: 'settings.resize.kernel.cubic', value: 'cubic' },
  { key: 'settings.resize.kernel.nearest', value: 'nearest' }
]

const EXACT_OUTCOME: Record<FitMode, TranslationKey> = {
  cover: 'settings.resize.outcome.exact.cover',
  contain: 'settings.resize.outcome.exact.contain',
  fill: 'settings.resize.outcome.exact.fill',
  inside: 'settings.resize.outcome.exact.inside',
  outside: 'settings.resize.outcome.exact.outside'
}

function describeGuards(resize: ResizeSettings, t: Translate): string {
  if (resize.withoutEnlargement && resize.withoutReduction) {
    return t('settings.resize.guards.both')
  }
  if (resize.withoutEnlargement) return t('settings.resize.guards.noEnlarge')
  if (resize.withoutReduction) return t('settings.resize.guards.noReduce')
  return t('settings.resize.guards.free')
}

/** Plain English account of what the current settings will do to a batch. */
function describeResize(resize: ResizeSettings, t: Translate): string {
  const missing = t('settings.resize.outcome.missingTarget')
  let base: string

  switch (resize.strategy) {
    case 'none':
      return t('settings.resize.outcome.unchanged')
    case 'exact':
      if (resize.width === null || resize.height === null) return missing
      base = t(EXACT_OUTCOME[resize.fit], { width: resize.width, height: resize.height })
      break
    case 'width':
      if (resize.width === null) return missing
      base = t('settings.resize.outcome.width', { width: resize.width })
      break
    case 'height':
      if (resize.height === null) return missing
      base = t('settings.resize.outcome.height', { height: resize.height })
      break
    case 'longest':
      if (resize.width === null) return missing
      base = t('settings.resize.outcome.longest', { value: resize.width })
      break
    case 'shortest':
      if (resize.width === null) return missing
      base = t('settings.resize.outcome.shortest', { value: resize.width })
      break
    case 'percentage': {
      if (resize.percentage === 100) return t('settings.resize.outcome.unchanged')
      // A percentage only ever moves in one direction, so the only guard worth
      // mentioning is the one that would cancel the whole thing out.
      const shrinking = resize.percentage < 100
      const blocked = shrinking ? resize.withoutReduction : resize.withoutEnlargement
      if (!blocked) return t('settings.resize.outcome.percentage', { value: resize.percentage })
      return t(
        shrinking
          ? 'settings.resize.outcome.percentageBlockedReducing'
          : 'settings.resize.outcome.percentageBlockedEnlarging',
        { value: resize.percentage }
      )
    }
    case 'megapixels':
      base = t('settings.resize.outcome.megapixels', { value: resize.megapixels })
      break
    default:
      return missing
  }

  return `${base} ${describeGuards(resize, t)}`
}

const OUTCOME_STYLE: React.CSSProperties = {
  padding: '9px 11px',
  marginBottom: 14,
  borderRadius: 10,
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--bico-text)',
  background: 'color-mix(in srgb, var(--bico-accent) 10%, transparent)',
  border: '1px solid color-mix(in srgb, var(--bico-accent) 26%, transparent)'
}

const PAIR_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  minWidth: 0
}

export function ResizeSection(): React.JSX.Element {
  const resize = useAppStore((state) => state.settings.resize)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const t = useT()

  const setWidth = (width: number | null): void => patchSettings({ resize: { width } })
  const setHeight = (height: number | null): void => patchSettings({ resize: { height } })

  const usesWidthOnly =
    resize.strategy === 'width' || resize.strategy === 'longest' || resize.strategy === 'shortest'

  const edgeLabel =
    resize.strategy === 'longest'
      ? t('settings.resize.strategy.longest')
      : resize.strategy === 'shortest'
        ? t('settings.resize.strategy.shortest')
        : t('settings.resize.width.label')

  return (
    <div style={{ minWidth: 0 }}>
      <Field label={t('settings.resize.strategy.label')} icon={<ColumnWidthOutlined />} tone={TONE}>
        <Select<ResizeStrategy>
          value={resize.strategy}
          options={STRATEGY_KEYS.map((entry) => ({ value: entry.value, label: t(entry.key) }))}
          style={{ width: '100%' }}
          onChange={(strategy) => patchSettings({ resize: { strategy } })}
        />
      </Field>

      {resize.strategy === 'exact' ? (
        <Field label={t('settings.resize.target.label')} hint={t('settings.resize.target.hint')}>
          <div style={PAIR_STYLE}>
            <InputNumber<number>
              min={1}
              max={100000}
              value={resize.width}
              placeholder={t('settings.resize.width.placeholder')}
              aria-label={t('settings.resize.width.label')}
              style={{ flex: '1 1 96px', minWidth: 0 }}
              onChange={setWidth}
            />
            <InputNumber<number>
              min={1}
              max={100000}
              value={resize.height}
              placeholder={t('settings.resize.height.placeholder')}
              aria-label={t('settings.resize.height.label')}
              style={{ flex: '1 1 96px', minWidth: 0 }}
              onChange={setHeight}
            />
          </div>
        </Field>
      ) : null}

      {usesWidthOnly ? (
        <Field label={edgeLabel} hint={t('settings.resize.edge.hint')}>
          <InputNumber<number>
            min={1}
            max={100000}
            value={resize.width}
            placeholder={t('settings.resize.pixels.placeholder')}
            style={{ width: '100%' }}
            onChange={setWidth}
          />
        </Field>
      ) : null}

      {resize.strategy === 'height' ? (
        <Field label={t('settings.resize.height.label')} hint={t('settings.resize.edge.hint')}>
          <InputNumber<number>
            min={1}
            max={100000}
            value={resize.height}
            placeholder={t('settings.resize.pixels.placeholder')}
            style={{ width: '100%' }}
            onChange={setHeight}
          />
        </Field>
      ) : null}

      {resize.strategy === 'percentage' ? (
        <Field
          label={t('settings.resize.scale.label')}
          value={t('settings.value.percentWord', { value: resize.percentage })}
        >
          <Slider
            min={1}
            max={400}
            value={resize.percentage}
            marks={{ 100: '100' }}
            onChange={(percentage) => patchSettings({ resize: { percentage } })}
          />
        </Field>
      ) : null}

      {resize.strategy === 'megapixels' ? (
        <Field
          label={t('settings.resize.megapixels.label')}
          hint={t('settings.resize.megapixels.hint')}
        >
          <InputNumber<number>
            min={0.1}
            max={500}
            step={0.1}
            value={resize.megapixels}
            suffix={t('settings.resize.megapixels.suffix')}
            style={{ width: '100%' }}
            onChange={(megapixels) => patchSettings({ resize: { megapixels: megapixels ?? 1 } })}
          />
        </Field>
      ) : null}

      <div style={OUTCOME_STYLE}>{describeResize(resize, t)}</div>

      {resize.strategy === 'none' ? (
        <SectionHint>{t('settings.resize.locked')}</SectionHint>
      ) : (
        <>
          <Field
            label={t('settings.resize.fit.label')}
            icon={<ExpandOutlined />}
            tone={TONE}
            hint={t('settings.resize.fit.hint')}
          >
            <Segmented<FitMode>
              block
              size="small"
              value={resize.fit}
              options={FIT_KEYS.map((entry) => ({ value: entry.value, label: t(entry.key) }))}
              onChange={(fit) => patchSettings({ resize: { fit } })}
            />
          </Field>

          <Field
            label={t('settings.resize.position.label')}
            icon={<AimOutlined />}
            tone={TONE}
            hint={t('settings.resize.position.hint')}
          >
            <Select<GravityPosition>
              value={resize.position}
              options={POSITION_KEYS.map((entry) => ({ value: entry.value, label: t(entry.key) }))}
              style={{ width: '100%' }}
              onChange={(position) => patchSettings({ resize: { position } })}
            />
          </Field>

          <Field label={t('settings.resize.kernel.label')} hint={t('settings.resize.kernel.hint')}>
            <Select<ResizeKernel>
              value={resize.kernel}
              options={KERNEL_KEYS.map((entry) => ({ value: entry.value, label: t(entry.key) }))}
              style={{ width: '100%' }}
              onChange={(kernel) => patchSettings({ resize: { kernel } })}
            />
          </Field>

          <SwitchField
            label={t('settings.resize.noEnlarge.label')}
            hint={t('settings.resize.noEnlarge.hint')}
            checked={resize.withoutEnlargement}
            onChange={(withoutEnlargement) => patchSettings({ resize: { withoutEnlargement } })}
          />

          <SwitchField
            label={t('settings.resize.noReduce.label')}
            hint={t('settings.resize.noReduce.hint')}
            checked={resize.withoutReduction}
            onChange={(withoutReduction) => patchSettings({ resize: { withoutReduction } })}
          />

          <Field
            label={t('settings.resize.background.label')}
            hint={t('settings.resize.background.hint')}
          >
            <ColorPicker
              value={resize.background}
              format="hex"
              showText
              disabled={resize.fit !== 'contain'}
              onChange={(value) => patchSettings({ resize: { background: value.toHexString() } })}
            />
          </Field>
        </>
      )}
    </div>
  )
}
