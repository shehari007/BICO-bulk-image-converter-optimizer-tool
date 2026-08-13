import { useMemo } from 'react'
import { Alert, Button, Flex, Input, Segmented, Select, Slider, Tag, Tooltip } from 'antd'
import { FileZipOutlined, FolderOpenOutlined, FontColorsOutlined } from '@ant-design/icons'
import { outputExtension } from '@shared/formats'
import { TEMPLATE_TOKENS, resolveTemplate, type TemplateToken } from '@shared/naming'
import type {
  CaseTransform,
  CollisionPolicy,
  OutputSettings,
  OutputStructure,
  OutputTarget,
  SourceFile
} from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { useT, type TranslationKey } from '../../i18n'
import { SECTION_TONES } from '../Glyph'
import { Field, SectionHint, SwitchField } from './Field'

const TONE = SECTION_TONES.output

/**
 * Stand in for the filename preview before anything has been imported.
 *
 * Every token has to resolve to something recognisable, so this carries a real
 * looking name, extension and parent folder rather than empty strings.
 */
const SAMPLE_FILE: SourceFile = {
  id: 'sample',
  path: 'C:/Photos/Iceland/aurora over vik.jpg',
  name: 'aurora over vik.jpg',
  dir: 'C:/Photos/Iceland',
  ext: 'jpg',
  relPath: 'Iceland/aurora over vik.jpg',
  size: 4_820_000,
  mtimeMs: 0
}

type StructureOption = {
  value: OutputStructure
  label: string
  description: string
}

const STRUCTURE_KEYS: {
  value: OutputStructure
  label: TranslationKey
  description: TranslationKey
}[] = [
  {
    value: 'flat',
    label: 'settings.output.structure.flat',
    description: 'settings.output.structure.flatDescription'
  },
  {
    value: 'mirror',
    label: 'settings.output.structure.mirror',
    description: 'settings.output.structure.mirrorDescription'
  },
  {
    value: 'by-format',
    label: 'settings.output.structure.byFormat',
    description: 'settings.output.structure.byFormatDescription'
  },
  {
    value: 'by-date',
    label: 'settings.output.structure.byDate',
    description: 'settings.output.structure.byDateDescription'
  }
]

const STRUCTURE_HINT: Record<OutputStructure, TranslationKey> = {
  flat: 'settings.output.structure.flatHint',
  mirror: 'settings.output.structure.mirrorHint',
  'by-format': 'settings.output.structure.byFormatHint',
  'by-date': 'settings.output.structure.byDateHint'
}

const COLLISION_HINT: Record<CollisionPolicy, TranslationKey> = {
  rename: 'settings.output.collision.renameHint',
  overwrite: 'settings.output.collision.overwriteHint',
  skip: 'settings.output.collision.skipHint'
}

/** What each filename token expands to, written out for the tooltip. */
const TOKEN_HINT: Record<TemplateToken, TranslationKey> = {
  name: 'settings.output.token.name',
  ext: 'settings.output.token.ext',
  format: 'settings.output.token.format',
  index: 'settings.output.token.index',
  total: 'settings.output.token.total',
  width: 'settings.output.token.width',
  height: 'settings.output.token.height',
  quality: 'settings.output.token.quality',
  preset: 'settings.output.token.preset',
  variant: 'settings.output.token.variant',
  parent: 'settings.output.token.parent',
  date: 'settings.output.token.date',
  time: 'settings.output.token.time',
  random: 'settings.output.token.random'
}

const CASE_KEYS: { value: CaseTransform; label: TranslationKey }[] = [
  { value: 'none', label: 'settings.output.case.none' },
  { value: 'lower', label: 'settings.output.case.lower' },
  { value: 'upper', label: 'settings.output.case.upper' },
  { value: 'kebab', label: 'settings.output.case.kebab' },
  { value: 'snake', label: 'settings.output.case.snake' }
]

export function OutputSection(): React.JSX.Element {
  // Resolving the filename preview needs a whole ConversionSettings, because the
  // template can reference the format and the quality, so this section subscribes
  // to the settings slice rather than to `settings.output` on its own.
  const settings = useAppStore((state) => state.settings)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const firstItem = useAppStore((state) => state.items[0] ?? null)
  const total = useAppStore((state) => state.items.length)
  const presetName = useAppStore((state) =>
    state.presetDirty
      ? 'custom'
      : (state.presets.find((preset) => preset.id === state.activePresetId)?.name ?? 'custom')
  )
  const t = useT()

  const output = settings.output

  const patch = (value: Partial<OutputSettings>): void => {
    patchSettings({ output: value })
  }

  const appendToken = (token: string): void => {
    patch({ template: `${output.template}${token}` })
  }

  const chooseFolder = async (): Promise<void> => {
    const picked = await window.bico.dialog.pickOutputFolder()
    const folder = picked.paths[0]
    if (picked.cancelled || folder === undefined) return
    patch({ folder })
  }

  const chooseArchive = async (): Promise<void> => {
    const picked = await window.bico.dialog.pickZipPath('bico-output.zip')
    const zipPath = picked.paths[0]
    if (picked.cancelled || zipPath === undefined) return
    patch({ zipPath })
  }

  const previewName = useMemo(() => {
    const file = firstItem?.file ?? SAMPLE_FILE
    const resolved = resolveTemplate(output.template, {
      file,
      settings,
      presetName,
      index: 0,
      total: Math.max(total, 1),
      width: firstItem?.probe?.width ?? 1920,
      height: firstItem?.probe?.height ?? 1080,
      variant: '',
      now: new Date()
    })
    return `${resolved}.${outputExtension(settings.format, file.ext)}`
  }, [firstItem, output.template, presetName, settings, total])

  const structureOptions: StructureOption[] = STRUCTURE_KEYS.map((entry) => ({
    value: entry.value,
    label: t(entry.label),
    description: t(entry.description)
  }))

  return (
    <div style={{ minWidth: 0 }}>
      <Field label={t('settings.output.target.label')} icon={<FolderOpenOutlined />} tone={TONE}>
        <Segmented<OutputTarget>
          block
          size="small"
          value={output.target}
          onChange={(target) => patch({ target })}
          options={[
            {
              value: 'folder',
              label: t('settings.output.target.folder'),
              tooltip: t('settings.output.target.folderTooltip')
            },
            {
              value: 'zip',
              label: t('settings.output.target.zip'),
              tooltip: t('settings.output.target.zipTooltip')
            },
            {
              value: 'in-place',
              label: t('settings.output.target.inPlace'),
              tooltip: t('settings.output.target.inPlaceTooltip')
            }
          ]}
        />
      </Field>

      {output.target === 'in-place' ? (
        <Alert
          type="warning"
          showIcon
          title={t('settings.output.inPlace.title')}
          description={t('settings.output.inPlace.body')}
          style={{ marginBottom: 12 }}
        />
      ) : null}

      {output.target === 'folder' ? (
        <Field label={t('settings.output.folder.label')}>
          <Flex vertical gap={6} style={{ minWidth: 0 }}>
            <Button icon={<FolderOpenOutlined />} block onClick={() => void chooseFolder()}>
              {output.folder
                ? t('settings.output.folder.change')
                : t('settings.output.folder.choose')}
            </Button>
            <PathLine value={output.folder} empty={t('settings.output.folder.empty')} />
          </Flex>
        </Field>
      ) : null}

      {output.target === 'zip' ? (
        <Field label={t('settings.output.archive.label')}>
          <Flex vertical gap={6} style={{ minWidth: 0 }}>
            <Button icon={<FileZipOutlined />} block onClick={() => void chooseArchive()}>
              {output.zipPath
                ? t('settings.output.archive.change')
                : t('settings.output.archive.choose')}
            </Button>
            <PathLine value={output.zipPath} empty={t('settings.output.archive.empty')} />
          </Flex>
        </Field>
      ) : null}

      <Field
        label={t('settings.output.structure.label')}
        hint={t(STRUCTURE_HINT[output.structure])}
      >
        <Select<OutputStructure, StructureOption>
          value={output.structure}
          options={structureOptions}
          style={{ width: '100%' }}
          onChange={(structure) => patch({ structure })}
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

      <Field
        label={t('settings.output.collision.label')}
        hint={t(COLLISION_HINT[output.collision])}
      >
        <Segmented<CollisionPolicy>
          block
          size="small"
          value={output.collision}
          onChange={(collision) => patch({ collision })}
          options={[
            {
              value: 'rename',
              label: t('settings.output.collision.rename'),
              tooltip: t('settings.output.collision.renameHint')
            },
            {
              value: 'overwrite',
              label: t('settings.output.collision.overwrite'),
              tooltip: t('settings.output.collision.overwriteHint')
            },
            {
              value: 'skip',
              label: t('settings.output.collision.skip'),
              tooltip: t('settings.output.collision.skipHint')
            }
          ]}
        />
      </Field>

      <Field label={t('settings.output.template.label')} help={t('settings.output.template.help')}>
        <Flex vertical gap={8} style={{ minWidth: 0 }}>
          <Input
            value={output.template}
            placeholder={t('settings.output.template.placeholder')}
            onChange={(event) => patch({ template: event.target.value })}
          />

          <Flex align="baseline" gap={6} style={{ minWidth: 0 }}>
            <span style={{ flex: '0 0 auto', fontSize: 11, color: 'var(--bico-text-muted)' }}>
              {firstItem === null
                ? t('settings.output.template.example')
                : t('settings.output.template.firstFile')}
            </span>
            {/* A filename is a literal, not prose, so it keeps its own direction
                even when the interface is mirrored. */}
            <span
              dir="ltr"
              className="bico-mono bico-truncate bico-selectable"
              title={previewName}
              style={{ flex: '1 1 auto', fontSize: 11 }}
            >
              {previewName}
            </span>
          </Flex>

          <Flex wrap gap={4} style={{ minWidth: 0 }}>
            {TEMPLATE_TOKENS.map((token) => {
              const literal = `{${token}}`
              return (
                <Tooltip key={token} title={t(TOKEN_HINT[token])}>
                  <Tag
                    role="button"
                    tabIndex={0}
                    style={{ margin: 0, fontSize: 11, cursor: 'pointer' }}
                    onClick={() => appendToken(literal)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      event.preventDefault()
                      appendToken(literal)
                    }}
                  >
                    {literal}
                  </Tag>
                </Tooltip>
              )
            })}
          </Flex>
        </Flex>
      </Field>

      <Field label={t('settings.output.case.label')} icon={<FontColorsOutlined />} tone={TONE}>
        <Select<CaseTransform>
          value={output.caseTransform}
          options={CASE_KEYS.map((entry) => ({ value: entry.value, label: t(entry.label) }))}
          style={{ width: '100%' }}
          onChange={(caseTransform) => patch({ caseTransform })}
        />
      </Field>

      <SwitchField
        label={t('settings.output.sanitize.label')}
        hint={t('settings.output.sanitize.hint')}
        checked={output.sanitize}
        onChange={(sanitize) => patch({ sanitize })}
      />

      <SwitchField
        label={t('settings.output.skipIfLarger.label')}
        hint={t('settings.output.skipIfLarger.hint')}
        checked={output.skipIfLarger}
        onChange={(skipIfLarger) => patch({ skipIfLarger })}
      />

      {output.target === 'zip' ? (
        <Field
          label={t('settings.output.zipLevel.label')}
          value={
            output.zipCompressionLevel === 0
              ? t('settings.output.zipLevel.store')
              : output.zipCompressionLevel
          }
          hint={t('settings.output.zipLevel.hint')}
        >
          <Slider
            min={0}
            max={9}
            step={1}
            value={output.zipCompressionLevel}
            marks={{
              0: t('settings.output.zipLevel.store'),
              9: t('settings.output.zipLevel.max')
            }}
            onChange={(zipCompressionLevel) => patch({ zipCompressionLevel })}
          />
        </Field>
      ) : null}

      <SwitchField
        label={t('settings.output.report.label')}
        hint={t('settings.output.report.hint')}
        checked={output.writeReport}
        onChange={(writeReport) => patch({ writeReport })}
      />

      {output.target === 'folder' && output.folder === '' ? (
        <SectionHint>{t('settings.output.noFolderNote')}</SectionHint>
      ) : null}
    </div>
  )
}

interface PathLineProps {
  value: string
  empty: string
}

/**
 * Read only display for a chosen path.
 *
 * Paths are long and the sidebar is narrow, so the visible text is clipped and
 * the full value is parked on the title attribute where a hover can reach it.
 * A real path stays left to right in every language; the empty state is prose
 * and follows the interface.
 */
export function PathLine(props: PathLineProps): React.JSX.Element {
  const isSet = props.value !== ''

  return (
    <span
      dir={isSet ? 'ltr' : undefined}
      className={isSet ? 'bico-truncate bico-selectable' : 'bico-truncate'}
      title={isSet ? props.value : undefined}
      style={{
        display: 'block',
        fontSize: 11,
        color: isSet ? 'var(--bico-text-secondary)' : 'var(--bico-text-muted)'
      }}
    >
      {isSet ? props.value : props.empty}
    </span>
  )
}
