import { Button, ColorPicker, InputNumber, Segmented, Slider } from 'antd'
import { BorderOuterOutlined, ExpandAltOutlined, RotateRightOutlined } from '@ant-design/icons'
import type { CropSettings, RotateAngle } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { useT, type TranslationKey } from '../../i18n'
import { SECTION_TONES } from '../Glyph'
import { Field, SectionHint, SwitchField } from './Field'

/**
 * Geometry that is not resizing: orientation, rotation, mirroring and cropping.
 *
 * Everything here runs before the resize step, so the numbers the crop group
 * asks for are in source pixels rather than output pixels. The order matters
 * enough that the copy says so wherever a control could be read either way.
 */

type CropMode = CropSettings['mode']

const TONE = SECTION_TONES.transform

const CROP_MODE_KEYS: { key: TranslationKey; value: CropMode }[] = [
  { key: 'settings.transform.crop.mode.manual', value: 'manual' },
  { key: 'settings.transform.crop.mode.aspect', value: 'aspect' },
  { key: 'settings.transform.crop.mode.trim', value: 'trim' }
]

/** Ratios people actually ask for, expressed the way the setting stores them. */
const ASPECT_PRESETS: { label: string; value: number }[] = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '21:9', value: 21 / 9 },
  { label: '3:4', value: 3 / 4 },
  { label: '2:3', value: 2 / 3 },
  { label: '9:16', value: 9 / 16 }
]

const NESTED: React.CSSProperties = {
  marginBottom: 10,
  paddingInlineStart: 10,
  borderInlineStart: '1px solid var(--bico-border)'
}

const PAIR_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  minWidth: 0
}

const CHIPS_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  minWidth: 0
}

export function TransformSection(): React.JSX.Element {
  const transform = useAppStore((state) => state.settings.transform)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const t = useT()

  const crop = transform.crop

  const patchCrop = (patch: Partial<CropSettings>): void => {
    patchSettings({ transform: { crop: patch } })
  }

  // The angle labels are digits, so they need no dictionary entry; only the
  // neutral choice is a word.
  const rotateOptions: { label: string; value: RotateAngle }[] = [
    { label: t('state.none'), value: 0 },
    { label: '90', value: 90 },
    { label: '180', value: 180 },
    { label: '270', value: 270 }
  ]

  return (
    <div style={{ minWidth: 0 }}>
      <SwitchField
        label={t('settings.transform.autoOrient.label')}
        hint={t('settings.transform.autoOrient.hint')}
        checked={transform.autoOrient}
        onChange={(autoOrient) => patchSettings({ transform: { autoOrient } })}
      />

      <Field
        label={t('settings.transform.rotate.label')}
        icon={<RotateRightOutlined />}
        tone={TONE}
        hint={t('settings.transform.rotate.hint')}
      >
        <Segmented<RotateAngle>
          block
          size="small"
          value={transform.rotate}
          options={rotateOptions}
          onChange={(rotate) => patchSettings({ transform: { rotate } })}
        />
      </Field>

      <SwitchField
        label={t('settings.transform.flipVertical.label')}
        hint={t('settings.transform.flipVertical.hint')}
        checked={transform.flipVertical}
        onChange={(flipVertical) => patchSettings({ transform: { flipVertical } })}
      />

      <SwitchField
        label={t('settings.transform.flipHorizontal.label')}
        hint={t('settings.transform.flipHorizontal.hint')}
        checked={transform.flipHorizontal}
        onChange={(flipHorizontal) => patchSettings({ transform: { flipHorizontal } })}
      />

      <div className="bico-section-title">{t('settings.transform.crop.title')}</div>

      <SwitchField
        label={t('settings.transform.crop.enable.label')}
        hint={t('settings.transform.crop.enable.hint')}
        icon={<ExpandAltOutlined />}
        tone={TONE}
        checked={crop.enabled}
        onChange={(enabled) => patchCrop({ enabled })}
      />

      {crop.enabled ? (
        <div style={NESTED}>
          <Field label={t('settings.transform.crop.mode.label')}>
            <Segmented<CropMode>
              block
              size="small"
              value={crop.mode}
              options={CROP_MODE_KEYS.map((entry) => ({
                value: entry.value,
                label: t(entry.key)
              }))}
              onChange={(mode) => patchCrop({ mode })}
            />
          </Field>

          {crop.mode === 'manual' ? (
            <>
              <SectionHint>{t('settings.transform.crop.manual.hint')}</SectionHint>
              <Field label={t('settings.transform.crop.offset.label')}>
                <div style={PAIR_STYLE}>
                  <InputNumber<number>
                    min={0}
                    max={100000}
                    value={crop.left}
                    prefix={t('settings.axis.x')}
                    aria-label={t('settings.axis.x')}
                    style={{ flex: '1 1 88px', minWidth: 0 }}
                    onChange={(left) => patchCrop({ left: left ?? 0 })}
                  />
                  <InputNumber<number>
                    min={0}
                    max={100000}
                    value={crop.top}
                    prefix={t('settings.axis.y')}
                    aria-label={t('settings.axis.y')}
                    style={{ flex: '1 1 88px', minWidth: 0 }}
                    onChange={(top) => patchCrop({ top: top ?? 0 })}
                  />
                </div>
              </Field>
              <Field
                label={t('settings.transform.crop.size.label')}
                hint={t('settings.transform.crop.size.hint')}
              >
                <div style={PAIR_STYLE}>
                  <InputNumber<number>
                    min={0}
                    max={100000}
                    value={crop.width}
                    prefix={t('settings.axis.width')}
                    aria-label={t('settings.resize.width.label')}
                    style={{ flex: '1 1 88px', minWidth: 0 }}
                    onChange={(width) => patchCrop({ width: width ?? 0 })}
                  />
                  <InputNumber<number>
                    min={0}
                    max={100000}
                    value={crop.height}
                    prefix={t('settings.axis.height')}
                    aria-label={t('settings.resize.height.label')}
                    style={{ flex: '1 1 88px', minWidth: 0 }}
                    onChange={(height) => patchCrop({ height: height ?? 0 })}
                  />
                </div>
              </Field>
            </>
          ) : null}

          {crop.mode === 'aspect' ? (
            <>
              <SectionHint>{t('settings.transform.crop.aspect.hint')}</SectionHint>
              <Field label={t('settings.transform.crop.ratios.label')}>
                <div style={CHIPS_STYLE}>
                  {ASPECT_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      size="small"
                      type={
                        Math.abs(crop.aspectRatio - preset.value) < 0.005 ? 'primary' : 'default'
                      }
                      onClick={() => patchCrop({ aspectRatio: preset.value })}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </Field>
              <Field
                label={t('settings.transform.crop.ratio.label')}
                value={crop.aspectRatio.toFixed(3)}
                hint={t('settings.transform.crop.ratio.hint')}
              >
                <InputNumber<number>
                  min={0.1}
                  max={10}
                  step={0.01}
                  value={crop.aspectRatio}
                  style={{ width: '100%' }}
                  onChange={(aspectRatio) => patchCrop({ aspectRatio: aspectRatio ?? 1 })}
                />
              </Field>
            </>
          ) : null}

          {crop.mode === 'trim' ? (
            <>
              <SectionHint>{t('settings.transform.crop.trim.hint')}</SectionHint>
              <Field
                label={t('settings.transform.crop.tolerance.label')}
                value={crop.trimThreshold}
                hint={t('settings.transform.crop.tolerance.hint')}
              >
                <Slider
                  min={0}
                  max={100}
                  value={crop.trimThreshold}
                  onChange={(trimThreshold) => patchCrop({ trimThreshold })}
                />
              </Field>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="bico-section-title">{t('settings.transform.border.title')}</div>

      <Field
        label={t('settings.transform.padding.label')}
        icon={<BorderOuterOutlined />}
        tone={TONE}
        value={t('settings.value.px', { value: transform.padding })}
        hint={t('settings.transform.padding.hint')}
      >
        <InputNumber<number>
          min={0}
          max={2000}
          value={transform.padding}
          suffix={t('unit.pixels')}
          style={{ width: '100%' }}
          onChange={(padding) => patchSettings({ transform: { padding: padding ?? 0 } })}
        />
      </Field>

      <Field
        label={t('settings.transform.paddingColor.label')}
        hint={t('settings.transform.paddingColor.hint')}
      >
        <ColorPicker
          value={transform.paddingColor}
          format="hex"
          showText
          disabled={transform.padding === 0}
          onChange={(value) => patchSettings({ transform: { paddingColor: value.toHexString() } })}
        />
      </Field>
    </div>
  )
}
