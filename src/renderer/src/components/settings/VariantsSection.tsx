import { useMemo } from 'react'
import { Alert, Button, Card, Flex, Input, InputNumber, Select, Tooltip } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { FORMATS, OUTPUT_FORMAT_IDS } from '@shared/formats'
import { uid } from '@shared/utils'
import type { OutputFormat, VariantSpec } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { useT, type TranslationKey, type Translate } from '../../i18n'
import { Field, SectionHint, SwitchField } from './Field'

/** `inherit` is the UI spelling of a null format or quality on a VariantSpec. */
type FormatChoice = OutputFormat | 'inherit'

const STRATEGY_KEYS: { value: VariantSpec['strategy']; label: TranslationKey }[] = [
  { value: 'none', label: 'settings.variants.strategy.none' },
  { value: 'width', label: 'settings.variants.strategy.width' },
  { value: 'height', label: 'settings.variants.strategy.height' },
  { value: 'longest', label: 'settings.variants.strategy.longest' },
  { value: 'percentage', label: 'settings.variants.strategy.percentage' }
]

/**
 * Built from the registry rather than hard coded, so a codec added by a later
 * release shows up as a variant target without this file being touched.
 */
function formatOptions(t: Translate): { value: FormatChoice; label: string }[] {
  return [
    { value: 'inherit', label: t('settings.variants.format.inherit') },
    { value: 'original', label: t('settings.variants.format.source') },
    ...OUTPUT_FORMAT_IDS.map((id) => ({ value: id, label: FORMATS[id].label }))
  ]
}

export function VariantsSection(): React.JSX.Element {
  const variants = useAppStore((state) => state.settings.variants)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const t = useT()

  /**
   * Two variants sharing a suffix resolve to the same filename, so the second
   * one silently overwrites the first. Counting the suffixes once here keeps the
   * check off the render path of every card.
   */
  const suffixCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const variant of variants) {
      const key = variant.suffix.trim().toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [variants])

  const update = (id: string, value: Partial<VariantSpec>): void => {
    patchSettings({
      variants: variants.map((variant) => (variant.id === id ? { ...variant, ...value } : variant))
    })
  }

  const remove = (id: string): void => {
    patchSettings({ variants: variants.filter((variant) => variant.id !== id) })
  }

  const add = (): void => {
    // Start from a suffix nothing else is using, so a freshly added variant is
    // never born in the overwrite warning state.
    const used = new Set(variants.map((variant) => variant.suffix.trim().toLowerCase()))
    let ordinal = variants.length + 1
    while (used.has(`-v${ordinal}`)) ordinal += 1

    const variant: VariantSpec = {
      id: uid('variant'),
      enabled: true,
      label: t('settings.variants.defaultLabel', { index: ordinal }),
      format: null,
      quality: null,
      strategy: 'width',
      value: 960,
      suffix: `-v${ordinal}`
    }
    patchSettings({ variants: [...variants, variant] })
  }

  return (
    <Flex vertical gap={10} style={{ minWidth: 0 }}>
      <SectionHint>{t('settings.variants.intro')}</SectionHint>

      {variants.map((variant, index) => {
        const key = variant.suffix.trim().toLowerCase()
        const problem =
          key === ''
            ? t('settings.variants.problem.empty')
            : (suffixCounts.get(key) ?? 0) > 1
              ? t('settings.variants.problem.duplicate')
              : null

        const name = variant.label || t('settings.variants.defaultLabel', { index: index + 1 })

        return (
          <Card
            key={variant.id}
            size="small"
            variant="outlined"
            // The last Field inside the body carries its own bottom margin, so
            // the body padding leaves that edge to it.
            styles={{ body: { padding: '10px 10px 0' } }}
            title={
              <span className="bico-truncate" style={{ display: 'block', fontSize: 12 }}>
                {name}
              </span>
            }
            extra={
              <Tooltip title={t('settings.variants.remove')}>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('settings.variants.removeNamed', { label: name })}
                  onClick={() => remove(variant.id)}
                />
              </Tooltip>
            }
          >
            <div style={{ minWidth: 0 }}>
              <SwitchField
                label={t('settings.variants.enable.label')}
                checked={variant.enabled}
                onChange={(enabled) => update(variant.id, { enabled })}
              />

              <Field
                label={t('settings.variants.name.label')}
                hint={t('settings.variants.name.hint')}
              >
                <Input
                  value={variant.label}
                  maxLength={60}
                  placeholder={t('settings.variants.name.placeholder')}
                  onChange={(event) => update(variant.id, { label: event.target.value })}
                />
              </Field>

              <Field label={t('settings.variants.formatQuality.label')}>
                <Flex gap={8} wrap style={{ minWidth: 0 }}>
                  <div style={{ flex: '1 1 130px', minWidth: 0 }}>
                    <Select<FormatChoice>
                      value={variant.format ?? 'inherit'}
                      onChange={(value) =>
                        update(variant.id, { format: value === 'inherit' ? null : value })
                      }
                      options={formatOptions(t)}
                      aria-label={t('settings.variants.format.aria')}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 96px', minWidth: 0 }}>
                    <InputNumber<number>
                      min={1}
                      max={100}
                      value={variant.quality}
                      placeholder={t('settings.variants.format.inherit')}
                      aria-label={t('settings.variants.quality.aria')}
                      onChange={(value) => update(variant.id, { quality: value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </Flex>
              </Field>

              <Field label={t('settings.variants.size.label')}>
                <Flex gap={8} wrap style={{ minWidth: 0 }}>
                  <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                    <Select<VariantSpec['strategy']>
                      value={variant.strategy}
                      onChange={(strategy) => update(variant.id, { strategy })}
                      options={STRATEGY_KEYS.map((entry) => ({
                        value: entry.value,
                        label: t(entry.label)
                      }))}
                      aria-label={t('settings.variants.strategy.aria')}
                      style={{ width: '100%' }}
                    />
                  </div>
                  {variant.strategy === 'none' ? null : (
                    <div style={{ flex: '1 1 96px', minWidth: 0 }}>
                      <InputNumber<number>
                        min={1}
                        max={variant.strategy === 'percentage' ? 400 : 20000}
                        value={variant.value}
                        suffix={variant.strategy === 'percentage' ? '%' : t('unit.pixels')}
                        aria-label={t('settings.variants.value.aria')}
                        onChange={(value) =>
                          update(variant.id, { value: typeof value === 'number' ? value : 0 })
                        }
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </Flex>
              </Field>

              <Field
                label={t('settings.variants.suffix.label')}
                hint={t('settings.variants.suffix.hint')}
              >
                <Input
                  value={variant.suffix}
                  maxLength={40}
                  placeholder={t('settings.variants.suffix.placeholder')}
                  status={problem ? 'warning' : ''}
                  onChange={(event) => update(variant.id, { suffix: event.target.value })}
                />
              </Field>

              {problem === null ? null : (
                <Alert type="warning" showIcon title={problem} style={{ marginBottom: 10 }} />
              )}
            </div>
          </Card>
        )
      })}

      {variants.length === 0 ? <SectionHint>{t('settings.variants.empty')}</SectionHint> : null}

      <Button icon={<PlusOutlined />} onClick={add} block>
        {t('settings.variants.add')}
      </Button>
    </Flex>
  )
}
