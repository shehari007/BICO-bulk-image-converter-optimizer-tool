import { useMemo } from 'react'
import { Button, Select, Tag, Tooltip } from 'antd'
import { SaveOutlined, UndoOutlined } from '@ant-design/icons'
import type { Preset } from '@shared/types'
import { useAppStore } from '../store/useAppStore'
import { useT } from '../i18n'

/**
 * Preset picker pinned above the settings.
 *
 * A preset is the fastest way to a correct answer, so it sits at the top of the
 * sidebar rather than behind a menu. The dirty state is deliberately loud: once
 * settings drift from the preset the run is no longer reproducible from its
 * name alone, and the user needs a one click way back.
 */

/**
 * Written as a type alias rather than an interface so it picks up the implicit
 * index signature that the Select option constraint asks for. The nested
 * `options` array is how the list is split into groups.
 */
type PresetOptionType = {
  value?: string
  label: string
  description?: string
  options?: PresetOptionType[]
}

const MODIFIED_TAG: React.CSSProperties = {
  margin: 0,
  flex: '0 0 auto',
  fontSize: 11,
  borderColor: 'transparent',
  background: 'color-mix(in srgb, var(--bico-warning) 18%, transparent)',
  color: 'var(--bico-warning)'
}

export function PresetBar(): React.JSX.Element {
  const presets = useAppStore((state) => state.presets)
  const activePresetId = useAppStore((state) => state.activePresetId)
  const presetDirty = useAppStore((state) => state.presetDirty)
  const applyPreset = useAppStore((state) => state.applyPreset)
  const setPanel = useAppStore((state) => state.setPanel)
  const t = useT()

  const options = useMemo<PresetOptionType[]>(() => {
    const toOption = (preset: Preset): PresetOptionType => ({
      value: preset.id,
      label: preset.name,
      description: preset.description
    })

    const builtin = presets.filter((preset) => preset.builtin).map(toOption)
    const mine = presets.filter((preset) => !preset.builtin).map(toOption)

    const groups: PresetOptionType[] = []
    if (builtin.length > 0) {
      groups.push({ label: t('settings.preset.groupBuiltin'), options: builtin })
    }
    if (mine.length > 0) groups.push({ label: t('settings.preset.groupMine'), options: mine })
    return groups
  }, [presets, t])

  const apply = (id: string): void => {
    const preset = presets.find((candidate) => candidate.id === id)
    if (preset) applyPreset(preset)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        minWidth: 0
      }}
    >
      <Select<string, PresetOptionType>
        size="small"
        value={activePresetId}
        options={options}
        onChange={apply}
        listHeight={340}
        aria-label={t('settings.preset.select')}
        showSearch={{ optionFilterProp: 'label' }}
        style={{ flex: '1 1 150px', minWidth: 0 }}
        optionRender={(option) => (
          <div style={{ minWidth: 0, paddingBlock: 2 }}>
            <div style={{ fontWeight: 550 }}>{option.data.label}</div>
            {option.data.description ? (
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
            ) : null}
          </div>
        )}
      />

      {presetDirty ? (
        <>
          <Tag style={MODIFIED_TAG}>{t('settings.preset.modified')}</Tag>
          <Tooltip title={t('settings.preset.revertTooltip')}>
            <Button
              size="small"
              icon={<UndoOutlined />}
              aria-label={t('settings.preset.revertLabel')}
              onClick={() => apply(activePresetId)}
            />
          </Tooltip>
        </>
      ) : null}

      <Tooltip title={t('settings.preset.saveTooltip')}>
        <Button size="small" icon={<SaveOutlined />} onClick={() => setPanel('presets')}>
          {t('settings.preset.save')}
        </Button>
      </Tooltip>
    </div>
  )
}
