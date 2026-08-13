import { Button, ColorPicker, Slider } from 'antd'
import { BgColorsOutlined, DashOutlined, LineHeightOutlined, UndoOutlined } from '@ant-design/icons'
import { DEFAULT_SETTINGS } from '@shared/defaults'
import { cloneDeep } from '@shared/utils'
import type { AdjustSettings } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { useT } from '../../i18n'
import { SECTION_TONES } from '../Glyph'
import { Field, SectionHint, SwitchField } from './Field'

/**
 * Pixel adjustments, grouped the way a darkroom would group them.
 *
 * Almost every numeric control here belongs to a switch above it, and showing
 * all of them at once turns the panel into a wall of sliders nobody reads. Each
 * group of numbers therefore only appears once its parent effect is on.
 */

const TONE = SECTION_TONES.adjust

const NESTED: React.CSSProperties = {
  marginBottom: 10,
  paddingInlineStart: 10,
  borderInlineStart: '1px solid var(--bico-border)'
}

export function AdjustSection(): React.JSX.Element {
  const adjust = useAppStore((state) => state.settings.adjust)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const t = useT()

  const patchAdjust = (patch: Partial<AdjustSettings>): void => {
    patchSettings({ adjust: patch })
  }

  const handleReset = (): void => {
    patchSettings({ adjust: cloneDeep(DEFAULT_SETTINGS.adjust) })
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div className="bico-section-title">{t('settings.adjust.colour.title')}</div>

      <SwitchField
        label={t('settings.adjust.grayscale.label')}
        hint={t('settings.adjust.grayscale.hint')}
        checked={adjust.grayscale}
        onChange={(grayscale) => patchAdjust({ grayscale })}
      />

      <SwitchField
        label={t('settings.adjust.invert.label')}
        hint={t('settings.adjust.invert.hint')}
        checked={adjust.invert}
        onChange={(invert) => patchAdjust({ invert })}
      />

      <SwitchField
        label={t('settings.adjust.sepia.label')}
        hint={t('settings.adjust.sepia.hint')}
        checked={adjust.sepia}
        onChange={(sepia) => patchAdjust({ sepia })}
      />

      <SwitchField
        label={t('settings.adjust.tint.label')}
        hint={t('settings.adjust.tint.hint')}
        icon={<BgColorsOutlined />}
        tone={TONE}
        checked={adjust.tint}
        onChange={(tint) => patchAdjust({ tint })}
      />

      {adjust.tint ? (
        <div style={NESTED}>
          <Field label={t('settings.adjust.tintColor.label')}>
            <ColorPicker
              value={adjust.tintColor}
              format="hex"
              showText
              disabledAlpha
              onChange={(value) => patchAdjust({ tintColor: value.toHexString() })}
            />
          </Field>
        </div>
      ) : null}

      <SwitchField
        label={t('settings.adjust.flatten.label')}
        hint={t('settings.adjust.flatten.hint')}
        checked={adjust.flatten}
        onChange={(flatten) => patchAdjust({ flatten })}
      />

      {adjust.flatten ? (
        <div style={NESTED}>
          <Field label={t('settings.adjust.flattenColor.label')}>
            <ColorPicker
              value={adjust.flattenColor}
              format="hex"
              showText
              disabledAlpha
              onChange={(value) => patchAdjust({ flattenColor: value.toHexString() })}
            />
          </Field>
        </div>
      ) : null}

      <div className="bico-section-title">{t('settings.adjust.tone.title')}</div>

      <SectionHint>{t('settings.adjust.tone.hint')}</SectionHint>

      <Field
        label={t('settings.adjust.brightness.label')}
        icon={<LineHeightOutlined />}
        tone={TONE}
        value={adjust.brightness.toFixed(2)}
      >
        <Slider
          min={0.2}
          max={3}
          step={0.01}
          value={adjust.brightness}
          marks={{ 1: '1' }}
          onChange={(brightness) => patchAdjust({ brightness })}
        />
      </Field>

      <Field label={t('settings.adjust.saturation.label')} value={adjust.saturation.toFixed(2)}>
        <Slider
          min={0}
          max={3}
          step={0.01}
          value={adjust.saturation}
          marks={{ 1: '1' }}
          onChange={(saturation) => patchAdjust({ saturation })}
        />
      </Field>

      <Field label={t('settings.adjust.contrast.label')} value={adjust.contrast.toFixed(2)}>
        <Slider
          min={0.2}
          max={3}
          step={0.01}
          value={adjust.contrast}
          marks={{ 1: '1' }}
          onChange={(contrast) => patchAdjust({ contrast })}
        />
      </Field>

      <Field
        label={t('settings.adjust.hue.label')}
        value={t('settings.value.degrees', { value: adjust.hue })}
        hint={t('settings.adjust.hue.hint')}
      >
        <Slider
          min={-180}
          max={180}
          value={adjust.hue}
          marks={{ 0: '0' }}
          onChange={(hue) => patchAdjust({ hue })}
        />
      </Field>

      <Field
        label={t('settings.adjust.lightness.label')}
        value={adjust.lightness}
        hint={t('settings.adjust.lightness.hint')}
      >
        <Slider
          min={-100}
          max={100}
          value={adjust.lightness}
          marks={{ 0: '0' }}
          onChange={(lightness) => patchAdjust({ lightness })}
        />
      </Field>

      <SwitchField
        label={t('settings.adjust.gamma.label')}
        hint={t('settings.adjust.gamma.hint')}
        checked={adjust.gamma}
        onChange={(gamma) => patchAdjust({ gamma })}
      />

      {adjust.gamma ? (
        <div style={NESTED}>
          <Field
            label={t('settings.adjust.gammaValue.label')}
            value={adjust.gammaValue.toFixed(1)}
            hint={t('settings.adjust.gammaValue.hint')}
          >
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={adjust.gammaValue}
              marks={{ 2.2: '2.2' }}
              onChange={(gammaValue) => patchAdjust({ gammaValue })}
            />
          </Field>
        </div>
      ) : null}

      <SwitchField
        label={t('settings.adjust.normalize.label')}
        hint={t('settings.adjust.normalize.hint')}
        checked={adjust.normalize}
        onChange={(normalize) => patchAdjust({ normalize })}
      />

      {adjust.normalize ? (
        <div style={NESTED}>
          <Field
            label={t('settings.adjust.normalizeLower.label')}
            value={adjust.normalizeLower}
            hint={t('settings.adjust.normalizeLower.hint')}
          >
            <Slider
              min={0}
              max={20}
              step={0.5}
              value={adjust.normalizeLower}
              onChange={(normalizeLower) => patchAdjust({ normalizeLower })}
            />
          </Field>
          <Field
            label={t('settings.adjust.normalizeUpper.label')}
            value={adjust.normalizeUpper}
            hint={t('settings.adjust.normalizeUpper.hint')}
          >
            <Slider
              min={80}
              max={100}
              step={0.5}
              value={adjust.normalizeUpper}
              onChange={(normalizeUpper) => patchAdjust({ normalizeUpper })}
            />
          </Field>
        </div>
      ) : null}

      <SwitchField
        label={t('settings.adjust.clahe.label')}
        hint={t('settings.adjust.clahe.hint')}
        checked={adjust.clahe}
        onChange={(clahe) => patchAdjust({ clahe })}
      />

      {adjust.clahe ? (
        <div style={NESTED}>
          <Field
            label={t('settings.adjust.claheWidth.label')}
            value={t('settings.value.px', { value: adjust.claheWidth })}
            hint={t('settings.adjust.claheWidth.hint')}
          >
            <Slider
              min={3}
              max={200}
              value={adjust.claheWidth}
              onChange={(claheWidth) => patchAdjust({ claheWidth })}
            />
          </Field>
          <Field
            label={t('settings.adjust.claheHeight.label')}
            value={t('settings.value.px', { value: adjust.claheHeight })}
          >
            <Slider
              min={3}
              max={200}
              value={adjust.claheHeight}
              onChange={(claheHeight) => patchAdjust({ claheHeight })}
            />
          </Field>
          <Field
            label={t('settings.adjust.claheSlope.label')}
            value={adjust.claheMaxSlope}
            hint={t('settings.adjust.claheSlope.hint')}
          >
            <Slider
              min={0}
              max={100}
              value={adjust.claheMaxSlope}
              onChange={(claheMaxSlope) => patchAdjust({ claheMaxSlope })}
            />
          </Field>
        </div>
      ) : null}

      <div className="bico-section-title">{t('settings.adjust.detail.title')}</div>

      <SwitchField
        label={t('settings.adjust.sharpen.label')}
        hint={t('settings.adjust.sharpen.hint')}
        icon={<DashOutlined />}
        tone={TONE}
        checked={adjust.sharpen}
        onChange={(sharpen) => patchAdjust({ sharpen })}
      />

      {adjust.sharpen ? (
        <div style={NESTED}>
          <Field
            label={t('settings.adjust.sharpenRadius.label')}
            value={adjust.sharpenSigma.toFixed(1)}
            hint={t('settings.adjust.sharpenRadius.hint')}
          >
            <Slider
              min={0.3}
              max={10}
              step={0.1}
              value={adjust.sharpenSigma}
              onChange={(sharpenSigma) => patchAdjust({ sharpenSigma })}
            />
          </Field>
          <Field
            label={t('settings.adjust.sharpenFlat.label')}
            value={adjust.sharpenM1.toFixed(1)}
            hint={t('settings.adjust.sharpenFlat.hint')}
          >
            <Slider
              min={0}
              max={10}
              step={0.1}
              value={adjust.sharpenM1}
              onChange={(sharpenM1) => patchAdjust({ sharpenM1 })}
            />
          </Field>
          <Field
            label={t('settings.adjust.sharpenEdge.label')}
            value={adjust.sharpenM2.toFixed(1)}
            hint={t('settings.adjust.sharpenEdge.hint')}
          >
            <Slider
              min={0}
              max={10}
              step={0.1}
              value={adjust.sharpenM2}
              onChange={(sharpenM2) => patchAdjust({ sharpenM2 })}
            />
          </Field>
        </div>
      ) : null}

      <SwitchField
        label={t('settings.adjust.blur.label')}
        hint={t('settings.adjust.blur.hint')}
        checked={adjust.blur}
        onChange={(blur) => patchAdjust({ blur })}
      />

      {adjust.blur ? (
        <div style={NESTED}>
          <Field label={t('settings.adjust.blurRadius.label')} value={adjust.blurSigma.toFixed(1)}>
            <Slider
              min={0.3}
              max={20}
              step={0.1}
              value={adjust.blurSigma}
              onChange={(blurSigma) => patchAdjust({ blurSigma })}
            />
          </Field>
        </div>
      ) : null}

      <SwitchField
        label={t('settings.adjust.median.label')}
        hint={t('settings.adjust.median.hint')}
        checked={adjust.median}
        onChange={(median) => patchAdjust({ median })}
      />

      {adjust.median ? (
        <div style={NESTED}>
          <Field
            label={t('settings.adjust.medianSize.label')}
            value={t('settings.value.px', { value: adjust.medianSize })}
            hint={t('settings.adjust.medianSize.hint')}
          >
            <Slider
              min={1}
              max={15}
              step={2}
              value={adjust.medianSize}
              onChange={(medianSize) => patchAdjust({ medianSize })}
            />
          </Field>
        </div>
      ) : null}

      <Button block size="small" icon={<UndoOutlined />} onClick={handleReset}>
        {t('settings.adjust.reset')}
      </Button>
    </div>
  )
}
