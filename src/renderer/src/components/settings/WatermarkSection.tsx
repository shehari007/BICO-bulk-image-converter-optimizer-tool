import {
  Button,
  ColorPicker,
  Flex,
  Input,
  InputNumber,
  Segmented,
  Select,
  Slider,
  Tooltip
} from 'antd'
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  BorderInnerOutlined,
  CloseOutlined,
  FontSizeOutlined,
  HighlightOutlined,
  PictureOutlined,
  RadiusBottomleftOutlined,
  RadiusBottomrightOutlined,
  RadiusUpleftOutlined,
  RadiusUprightOutlined
} from '@ant-design/icons'
import type { GravityPosition, WatermarkKind, WatermarkSettings } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { useT, type TranslationKey } from '../../i18n'
import { SECTION_TONES } from '../Glyph'
import { Field, SectionHint, SwitchField } from './Field'

const TONE = SECTION_TONES.watermark

/**
 * The nine anchor points, in reading order so the array maps straight onto a
 * three column grid. `entropy` and `attention` are deliberately absent: they are
 * crop hints and mean nothing when placing a stamp.
 */
const POSITION_CELLS: { value: GravityPosition; key: TranslationKey; icon: React.ReactNode }[] = [
  { value: 'northwest', key: 'settings.position.northwest', icon: <RadiusUpleftOutlined /> },
  { value: 'north', key: 'settings.position.north', icon: <ArrowUpOutlined /> },
  { value: 'northeast', key: 'settings.position.northeast', icon: <RadiusUprightOutlined /> },
  { value: 'west', key: 'settings.position.west', icon: <ArrowLeftOutlined /> },
  { value: 'center', key: 'settings.position.center', icon: <BorderInnerOutlined /> },
  { value: 'east', key: 'settings.position.east', icon: <ArrowRightOutlined /> },
  { value: 'southwest', key: 'settings.position.southwest', icon: <RadiusBottomleftOutlined /> },
  { value: 'south', key: 'settings.position.south', icon: <ArrowDownOutlined /> },
  { value: 'southeast', key: 'settings.position.southeast', icon: <RadiusBottomrightOutlined /> }
]

/**
 * Families that resolve on a stock Windows, macOS or Linux install.
 *
 * The text is rasterised by libvips on the machine running the conversion, so a
 * font that happens to be installed here would quietly fall back to something
 * else on a colleague's machine.
 */
const FONT_FAMILIES = [
  'Segoe UI',
  'Arial',
  'Helvetica',
  'Verdana',
  'Tahoma',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Impact'
]

const POSITION_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 6,
  maxWidth: 180
}

export function WatermarkSection(): React.JSX.Element {
  const watermark = useAppStore((state) => state.settings.watermark)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const t = useT()

  const patch = (value: Partial<WatermarkSettings>): void => {
    patchSettings({ watermark: value })
  }

  const chooseImage = async (): Promise<void> => {
    const picked = await window.bico.dialog.pickImage()
    const imagePath = picked.paths[0]
    if (picked.cancelled || imagePath === undefined) return
    patch({ imagePath })
  }

  return (
    <div style={{ minWidth: 0 }}>
      <Field label={t('settings.watermark.kind.label')} icon={<HighlightOutlined />} tone={TONE}>
        <Segmented<WatermarkKind>
          block
          value={watermark.kind}
          onChange={(kind) => patch({ kind })}
          options={[
            { value: 'none', label: t('state.none') },
            {
              value: 'text',
              label: t('settings.watermark.kind.text'),
              tooltip: t('settings.watermark.kind.textTooltip')
            },
            {
              value: 'image',
              label: t('settings.watermark.kind.image'),
              tooltip: t('settings.watermark.kind.imageTooltip')
            }
          ]}
        />
      </Field>

      {watermark.kind === 'none' ? (
        <SectionHint>{t('settings.watermark.none.hint')}</SectionHint>
      ) : null}

      {watermark.kind === 'text' ? (
        <>
          <Field label={t('settings.watermark.text.label')}>
            <Input
              value={watermark.text}
              maxLength={200}
              placeholder={t('settings.watermark.text.placeholder')}
              onChange={(event) => patch({ text: event.target.value })}
            />
          </Field>

          <Field
            label={t('settings.watermark.fontSize.label')}
            icon={<FontSizeOutlined />}
            tone={TONE}
            hint={t('settings.watermark.fontSize.hint')}
          >
            <InputNumber<number>
              min={6}
              max={512}
              step={2}
              value={watermark.fontSize}
              suffix={t('unit.pixels')}
              style={{ width: '100%' }}
              onChange={(fontSize) => patch({ fontSize: fontSize ?? 32 })}
            />
          </Field>

          <Field label={t('settings.watermark.font.label')}>
            <Select<string>
              value={watermark.fontFamily}
              options={FONT_FAMILIES.map((family) => ({ value: family, label: family }))}
              style={{ width: '100%' }}
              onChange={(fontFamily) => patch({ fontFamily })}
            />
          </Field>

          <Field
            label={t('settings.watermark.colour.label')}
            hint={t('settings.watermark.colour.hint')}
          >
            <ColorPicker
              value={watermark.color}
              format="hex"
              disabledAlpha
              showText
              onChange={(value) => patch({ color: value.toHexString() })}
            />
          </Field>
        </>
      ) : null}

      {watermark.kind === 'image' ? (
        <Field
          label={t('settings.watermark.image.label')}
          hint={t('settings.watermark.image.hint')}
        >
          <Flex vertical gap={6} style={{ minWidth: 0 }}>
            <Button icon={<PictureOutlined />} block onClick={() => void chooseImage()}>
              {watermark.imagePath
                ? t('settings.watermark.image.change')
                : t('settings.watermark.image.choose')}
            </Button>

            {watermark.imagePath === '' ? null : (
              <Flex align="center" gap={4} style={{ minWidth: 0 }}>
                <span
                  className="bico-truncate bico-selectable"
                  title={watermark.imagePath}
                  style={{ flex: '1 1 auto', fontSize: 11, color: 'var(--bico-text-secondary)' }}
                >
                  {watermark.imagePath}
                </span>
                <Tooltip title={t('settings.watermark.image.remove')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    aria-label={t('settings.watermark.image.remove')}
                    onClick={() => patch({ imagePath: '' })}
                  />
                </Tooltip>
              </Flex>
            )}
          </Flex>
        </Field>
      ) : null}

      {watermark.kind === 'none' ? null : (
        <>
          <Field
            label={t('settings.watermark.position.label')}
            hint={t('settings.watermark.position.hint')}
          >
            {/*
             * Pinned to left to right regardless of the interface direction.
             * This grid is a picture of the output frame, not a list of
             * controls, so mirroring it under Arabic would put the north east
             * cell in the north west corner and quietly invert what every
             * choice means.
             */}
            <div dir="ltr" style={POSITION_GRID}>
              {POSITION_CELLS.map((cell) => (
                <Tooltip key={cell.value} title={t(cell.key)}>
                  <Button
                    size="small"
                    icon={cell.icon}
                    aria-label={t(cell.key)}
                    type={watermark.position === cell.value ? 'primary' : 'default'}
                    style={{ width: '100%' }}
                    onClick={() => patch({ position: cell.value })}
                  />
                </Tooltip>
              ))}
            </div>
          </Field>

          <Field
            label={t('settings.watermark.opacity.label')}
            value={t('settings.value.percent', { value: watermark.opacity })}
          >
            <Slider
              min={0}
              max={100}
              value={watermark.opacity}
              onChange={(opacity) => patch({ opacity })}
            />
          </Field>

          <Field
            label={t('settings.watermark.scale.label')}
            value={t('settings.value.percent', { value: watermark.scale })}
            hint={t('settings.watermark.scale.hint')}
          >
            <Slider
              min={1}
              max={100}
              value={watermark.scale}
              onChange={(scale) => patch({ scale })}
            />
          </Field>

          <Field
            label={t('settings.watermark.margins.label')}
            hint={t('settings.watermark.margins.hint')}
          >
            <Flex gap={8} wrap style={{ minWidth: 0 }}>
              <div style={{ flex: '1 1 96px', minWidth: 0 }}>
                <InputNumber<number>
                  min={0}
                  max={4096}
                  value={watermark.marginX}
                  prefix={t('settings.axis.x')}
                  aria-label={t('settings.watermark.margins.horizontal')}
                  style={{ width: '100%' }}
                  onChange={(marginX) => patch({ marginX: marginX ?? 0 })}
                />
              </div>
              <div style={{ flex: '1 1 96px', minWidth: 0 }}>
                <InputNumber<number>
                  min={0}
                  max={4096}
                  value={watermark.marginY}
                  prefix={t('settings.axis.y')}
                  aria-label={t('settings.watermark.margins.vertical')}
                  style={{ width: '100%' }}
                  onChange={(marginY) => patch({ marginY: marginY ?? 0 })}
                />
              </div>
            </Flex>
          </Field>

          <Field
            label={t('settings.watermark.rotation.label')}
            value={t('settings.value.deg', { value: watermark.rotation })}
            hint={t('settings.watermark.rotation.hint')}
          >
            <Slider
              min={-180}
              max={180}
              value={watermark.rotation}
              marks={{ 0: '0' }}
              onChange={(rotation) => patch({ rotation })}
            />
          </Field>

          <SwitchField
            label={t('settings.watermark.tile.label')}
            hint={t('settings.watermark.tile.hint')}
            checked={watermark.tile}
            onChange={(tile) => patch({ tile })}
          />
        </>
      )}
    </div>
  )
}
