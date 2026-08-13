import { Input, InputNumber, Segmented } from 'antd'
import { SafetyCertificateOutlined, TagsOutlined } from '@ant-design/icons'
import type { MetadataPolicy, MetadataSettings } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { useT, type TranslationKey } from '../../i18n'
import { SECTION_TONES } from '../Glyph'
import { Field, SectionHint, SwitchField } from './Field'

const TONE = SECTION_TONES.metadata

/**
 * One sentence per policy, written around what the user actually risks.
 *
 * Nobody cares about EXIF in the abstract. They care that a photo taken on a
 * phone carries the coordinates of the place it was taken, so every line here is
 * explicit about where the location data ends up.
 */
const POLICY_HINT: Record<MetadataPolicy, TranslationKey> = {
  strip: 'settings.metadata.policy.stripHint',
  keep: 'settings.metadata.policy.keepHint',
  'keep-icc': 'settings.metadata.policy.iccHint',
  'keep-copyright': 'settings.metadata.policy.rightsHint'
}

const POLICY_OPTIONS: { value: MetadataPolicy; label: TranslationKey; tooltip: TranslationKey }[] =
  [
    {
      value: 'strip',
      label: 'settings.metadata.policy.strip',
      tooltip: 'settings.metadata.policy.stripTooltip'
    },
    {
      value: 'keep',
      label: 'settings.metadata.policy.keep',
      tooltip: 'settings.metadata.policy.keepTooltip'
    },
    {
      value: 'keep-icc',
      label: 'settings.metadata.policy.icc',
      tooltip: 'settings.metadata.policy.iccTooltip'
    },
    {
      value: 'keep-copyright',
      label: 'settings.metadata.policy.rights',
      tooltip: 'settings.metadata.policy.rightsTooltip'
    }
  ]

export function MetadataSection(): React.JSX.Element {
  const metadata = useAppStore((state) => state.settings.metadata)
  const format = useAppStore((state) => state.settings.format)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const t = useT()

  const patch = (value: Partial<MetadataSettings>): void => {
    patchSettings({ metadata: value })
  }

  const stripped = metadata.policy === 'strip'

  /**
   * Resolution can only be written where it will actually survive.
   *
   * sharp writes the density through the metadata block, and turning that block
   * on forces every other tag to be kept as well. Honouring the setting under a
   * strip policy would therefore quietly put back the GPS coordinates the user
   * asked to remove, so it is refused instead. TIFF is the exception: the
   * resolution lives in its own header fields there and needs no metadata block.
   */
  const densityWritable = metadata.policy === 'keep' || format === 'tiff'
  const densityHint = densityWritable
    ? t('settings.metadata.density.hint')
    : t('settings.metadata.density.blocked')

  return (
    <div style={{ minWidth: 0 }}>
      <Field
        label={t('settings.metadata.policy.label')}
        icon={<SafetyCertificateOutlined />}
        tone={TONE}
        hint={t(POLICY_HINT[metadata.policy])}
      >
        <Segmented<MetadataPolicy>
          block
          size="small"
          value={metadata.policy}
          options={POLICY_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.label),
            tooltip: t(option.tooltip)
          }))}
          onChange={(policy) => patch({ policy })}
        />
      </Field>

      <SwitchField
        label={t('settings.metadata.density.label')}
        hint={densityHint}
        checked={metadata.setDensity && densityWritable}
        disabled={!densityWritable}
        onChange={(setDensity) => patch({ setDensity })}
      />

      <Field label={t('settings.metadata.resolution.label')}>
        <InputNumber<number>
          min={1}
          max={2400}
          step={1}
          disabled={!metadata.setDensity || !densityWritable}
          value={metadata.density}
          suffix={t('unit.dpi')}
          aria-label={t('settings.metadata.resolution.aria')}
          style={{ width: '100%' }}
          onChange={(density) => patch({ density: density ?? 72 })}
        />
      </Field>

      <Field
        label={t('settings.metadata.icc.label')}
        icon={<TagsOutlined />}
        tone={TONE}
        hint={t('settings.metadata.icc.hint')}
      >
        <Input
          value={metadata.iccProfile}
          allowClear
          placeholder={t('settings.metadata.icc.placeholder')}
          onChange={(event) => patch({ iccProfile: event.target.value })}
        />
      </Field>

      <Field label={t('settings.metadata.copyright.label')}>
        <Input
          value={metadata.copyright}
          disabled={stripped}
          maxLength={200}
          placeholder={t('settings.metadata.copyright.placeholder')}
          onChange={(event) => patch({ copyright: event.target.value })}
        />
      </Field>

      <Field label={t('settings.metadata.artist.label')}>
        <Input
          value={metadata.artist}
          disabled={stripped}
          maxLength={200}
          placeholder={t('settings.metadata.artist.placeholder')}
          onChange={(event) => patch({ artist: event.target.value })}
        />
      </Field>

      {stripped ? <SectionHint>{t('settings.metadata.strippedNote')}</SectionHint> : null}
    </div>
  )
}
