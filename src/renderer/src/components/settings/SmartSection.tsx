import { Alert, InputNumber, Segmented, Slider } from 'antd'
import { BulbOutlined, CompressOutlined } from '@ant-design/icons'
import type { SizeTargetMode, SmartSettings } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { useFormatBytes, useT, type TranslationKey } from '../../i18n'
import { SECTION_TONES } from '../Glyph'
import { Field, SectionHint, SwitchField } from './Field'

const TONE = SECTION_TONES.smart

const MODE_HINT: Record<SizeTargetMode, TranslationKey> = {
  off: 'settings.smart.sizeTarget.offHint',
  'max-bytes': 'settings.smart.sizeTarget.maxHint',
  'target-bytes': 'settings.smart.sizeTarget.aimHint'
}

export function SmartSection(): React.JSX.Element {
  const smart = useAppStore((state) => state.settings.smart)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const t = useT()
  const formatBytes = useFormatBytes()

  const patch = (value: Partial<SmartSettings>): void => {
    patchSettings({ smart: value })
  }

  return (
    <div style={{ minWidth: 0 }}>
      <Field
        label={t('settings.smart.sizeTarget.label')}
        icon={<CompressOutlined />}
        tone={TONE}
        hint={t(MODE_HINT[smart.sizeTarget])}
      >
        <Segmented<SizeTargetMode>
          block
          size="small"
          value={smart.sizeTarget}
          onChange={(sizeTarget) => patch({ sizeTarget })}
          options={[
            {
              value: 'off',
              label: t('settings.smart.sizeTarget.off'),
              tooltip: t('settings.smart.sizeTarget.offTooltip')
            },
            {
              value: 'max-bytes',
              label: t('settings.smart.sizeTarget.max'),
              tooltip: t('settings.smart.sizeTarget.maxTooltip')
            },
            {
              value: 'target-bytes',
              label: t('settings.smart.sizeTarget.aim'),
              tooltip: t('settings.smart.sizeTarget.aimTooltip')
            }
          ]}
        />
      </Field>

      {smart.sizeTarget === 'off' ? null : (
        <>
          <Field
            label={t('settings.smart.budget.label')}
            hint={t('settings.smart.budget.hint', {
              size: formatBytes(smart.targetKb * 1024, smart.targetKb >= 1024 ? 1 : 0)
            })}
          >
            <InputNumber<number>
              min={1}
              max={100_000}
              step={50}
              value={smart.targetKb}
              suffix={t('unit.kb')}
              aria-label={t('settings.smart.budget.aria')}
              style={{ width: '100%' }}
              onChange={(targetKb) => patch({ targetKb: targetKb ?? 300 })}
            />
          </Field>

          <Field
            label={t('settings.smart.quality.label')}
            value={t('settings.value.range', {
              min: smart.minQuality,
              max: smart.maxQuality
            })}
            hint={t('settings.smart.quality.hint')}
          >
            <Slider
              range
              min={1}
              max={100}
              value={[smart.minQuality, smart.maxQuality]}
              onChange={(value: number[]) => {
                const [minQuality, maxQuality] = value
                if (minQuality === undefined || maxQuality === undefined) return
                patch({ minQuality, maxQuality })
              }}
            />
          </Field>

          <SectionHint>{t('settings.smart.searchNote')}</SectionHint>

          <Alert
            type="warning"
            showIcon
            title={t('settings.smart.slow.title')}
            description={t('settings.smart.slow.body')}
            style={{ marginBottom: 12 }}
          />
        </>
      )}

      <SwitchField
        label={t('settings.smart.autoFormat.label')}
        hint={t('settings.smart.autoFormat.hint')}
        icon={<BulbOutlined />}
        tone={TONE}
        checked={smart.autoFormat}
        onChange={(autoFormat) => patch({ autoFormat })}
      />

      <SwitchField
        label={t('settings.smart.autoPalette.label')}
        hint={t('settings.smart.autoPalette.hint')}
        checked={smart.autoPalette}
        onChange={(autoPalette) => patch({ autoPalette })}
      />
    </div>
  )
}
