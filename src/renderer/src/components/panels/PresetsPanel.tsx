import { useCallback, useMemo, useState } from 'react'
import {
  App as AntApp,
  Button,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Typography
} from 'antd'
import {
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  LockOutlined,
  PlusOutlined,
  ShareAltOutlined
} from '@ant-design/icons'
import { formatCapabilities } from '@shared/formats'
import { DEFAULT_PRESET_ID } from '@shared/presets'
import { cloneDeep, errorMessage } from '@shared/utils'
import { useAppStore } from '../../store/useAppStore'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useT, type Translate, type TranslationKey } from '../../i18n'
import { Glyph } from '../Glyph'
import type {
  ConversionSettings,
  DeepPartial,
  MetadataPolicy,
  OutputFormat,
  OutputStructure,
  Preset,
  ProcessingBackend,
  ResizeSettings
} from '@shared/types'

const { Paragraph, Text, Title } = Typography

interface PresetsPanelProps {
  open: boolean
  onClose: () => void
}

interface SummaryRow {
  label: string
  value: string
  /**
   * Set on rows whose value is Latin filesystem text rather than prose. Such a
   * value can open on a neutral character, which an Arabic paragraph would
   * otherwise sweep to the far end of the run.
   */
  isolate?: boolean
}

const METADATA_KEY: Record<MetadataPolicy, TranslationKey> = {
  strip: 'presets.summary.metadata.strip',
  keep: 'presets.summary.metadata.keep',
  'keep-icc': 'presets.summary.metadata.keepIcc',
  'keep-copyright': 'presets.summary.metadata.keepCopyright'
}

const STRUCTURE_KEY: Record<OutputStructure, TranslationKey> = {
  flat: 'presets.summary.structure.flat',
  mirror: 'presets.summary.structure.mirror',
  'by-format': 'presets.summary.structure.byFormat',
  'by-date': 'presets.summary.structure.byDate'
}

const BACKEND_KEY: Record<ProcessingBackend, TranslationKey> = {
  auto: 'presets.summary.backend.auto',
  gpu: 'presets.summary.backend.gpu',
  cpu: 'presets.summary.backend.cpu'
}

function formatLabel(format: OutputFormat, t: Translate): string {
  return formatCapabilities(format)?.label ?? t('presets.summary.formatOriginal')
}

function onOff(value: boolean, t: Translate): string {
  return value ? t('state.on') : t('state.off')
}

function describeResize(resize: DeepPartial<ResizeSettings>, t: Translate): string {
  // The guard clause is passed as a placeholder rather than concatenated, so a
  // translator can move it to wherever the sentence needs it.
  const guard = resize.withoutEnlargement ? t('presets.summary.resize.guard') : ''

  switch (resize.strategy) {
    case 'none':
      return t('presets.summary.resize.none')
    case 'exact':
      return t('presets.summary.resize.exact', {
        width: resize.width ?? 0,
        height: resize.height ?? 0,
        fit: resize.fit ?? 'inside',
        guard
      })
    case 'width':
      return t('presets.summary.resize.width', { pixels: resize.width ?? 0, guard })
    case 'height':
      return t('presets.summary.resize.height', { pixels: resize.height ?? 0, guard })
    case 'longest':
      return t('presets.summary.resize.longest', { pixels: resize.width ?? 0, guard })
    case 'shortest':
      return t('presets.summary.resize.shortest', { pixels: resize.width ?? 0, guard })
    case 'percentage':
      return t('presets.summary.resize.percentage', { percent: resize.percentage ?? 100 })
    case 'megapixels':
      return t('presets.summary.resize.megapixels', { megapixels: resize.megapixels ?? 0 })
    default:
      return t('presets.summary.resize.unchanged')
  }
}

/**
 * Turns a preset patch into sentences.
 *
 * Only the fields a preset actually overrides are listed, so the detail pane
 * answers the one question that matters when picking one: what will this change
 * about the settings I have now.
 */
function describePreset(patch: DeepPartial<ConversionSettings>, t: Translate): SummaryRow[] {
  const rows: SummaryRow[] = []

  if (patch.format) {
    rows.push({ label: t('presets.summary.format'), value: formatLabel(patch.format, t) })
  }
  if (typeof patch.quality === 'number') {
    rows.push({ label: t('presets.summary.quality'), value: String(patch.quality) })
  }
  if (typeof patch.lossless === 'boolean') {
    rows.push({ label: t('presets.summary.lossless'), value: onOff(patch.lossless, t) })
  }
  if (typeof patch.effort === 'number') {
    rows.push({ label: t('presets.summary.effort'), value: String(patch.effort) })
  }
  if (patch.chromaSubsampling) {
    rows.push({ label: t('presets.summary.chroma'), value: patch.chromaSubsampling })
  }
  if (typeof patch.progressive === 'boolean') {
    rows.push({ label: t('presets.summary.progressive'), value: onOff(patch.progressive, t) })
  }
  if (typeof patch.mozjpeg === 'boolean') {
    rows.push({ label: t('presets.summary.mozjpeg'), value: onOff(patch.mozjpeg, t) })
  }
  if (patch.tiffCompression) {
    rows.push({ label: t('presets.summary.tiffCompression'), value: patch.tiffCompression })
  }
  if (typeof patch.pngPalette === 'boolean') {
    rows.push({
      label: t('presets.summary.pngPalette'),
      value: patch.pngPalette
        ? t('presets.summary.pngPaletteOn', { colours: patch.pngColours ?? 256 })
        : t('state.off')
    })
  }
  if (typeof patch.pngCompressionLevel === 'number') {
    rows.push({
      label: t('presets.summary.pngCompression'),
      value: String(patch.pngCompressionLevel)
    })
  }
  if (patch.resize) {
    rows.push({ label: t('presets.summary.resize'), value: describeResize(patch.resize, t) })
  }

  if (patch.transform?.crop?.enabled) {
    rows.push({
      label: t('presets.summary.crop'),
      value: t('presets.summary.cropValue', { mode: patch.transform.crop.mode ?? 'manual' })
    })
  }

  if (patch.adjust) {
    const applied: string[] = []
    if (patch.adjust.grayscale) applied.push(t('presets.summary.adjust.grayscale'))
    if (patch.adjust.normalize) applied.push(t('presets.summary.adjust.normalize'))
    if (patch.adjust.sharpen) applied.push(t('presets.summary.adjust.sharpen'))
    if (patch.adjust.blur) applied.push(t('presets.summary.adjust.blur'))
    if (patch.adjust.clahe) applied.push(t('presets.summary.adjust.clahe'))
    if (typeof patch.adjust.contrast === 'number' && patch.adjust.contrast !== 1) {
      applied.push(t('presets.summary.adjust.contrast', { value: patch.adjust.contrast }))
    }
    if (applied.length > 0) {
      rows.push({
        label: t('presets.summary.adjustments'),
        value: applied.join(t('presets.summary.adjust.separator'))
      })
    }
  }

  if (patch.watermark?.kind && patch.watermark.kind !== 'none') {
    const tiled = patch.watermark.tile === true
    const text = patch.watermark.text || t('presets.summary.watermark.textEmpty')
    rows.push({
      label: t('presets.summary.watermark'),
      value:
        patch.watermark.kind === 'text'
          ? tiled
            ? t('presets.summary.watermark.textTiled', { text })
            : t('presets.summary.watermark.text', { text })
          : tiled
            ? t('presets.summary.watermark.imageTiled')
            : t('presets.summary.watermark.image')
    })
  }

  if (patch.metadata?.policy) {
    const key = METADATA_KEY[patch.metadata.policy]
    rows.push({
      label: t('presets.summary.metadata'),
      value: key ? t(key) : patch.metadata.policy
    })
  }
  if (patch.metadata?.setDensity) {
    rows.push({
      label: t('presets.summary.density'),
      value: t('presets.summary.densityValue', { density: patch.metadata.density ?? 72 })
    })
  }

  if (patch.output?.template) {
    rows.push({
      label: t('presets.summary.template'),
      value: patch.output.template,
      isolate: true
    })
  }
  if (patch.output?.structure) {
    const key = STRUCTURE_KEY[patch.output.structure]
    rows.push({
      label: t('presets.summary.structure'),
      value: key ? t(key) : patch.output.structure
    })
  }

  if (patch.smart?.sizeTarget && patch.smart.sizeTarget !== 'off') {
    rows.push({
      label: t('presets.summary.sizeBudget'),
      value: t('presets.summary.sizeBudgetValue', {
        kilobytes: patch.smart.targetKb ?? 0,
        min: patch.smart.minQuality ?? 0,
        max: patch.smart.maxQuality ?? 100
      })
    })
  }
  if (patch.smart?.autoFormat) {
    rows.push({
      label: t('presets.summary.autoFormat'),
      value: t('presets.summary.autoFormatValue')
    })
  }

  if (patch.performance?.backend) {
    const key = BACKEND_KEY[patch.performance.backend]
    rows.push({
      label: t('presets.summary.backend'),
      value: key ? t(key) : patch.performance.backend
    })
  }
  if (patch.performance?.useAllGpus) {
    rows.push({ label: t('presets.summary.gpuLanes'), value: t('presets.summary.gpuLanesValue') })
  }

  if (patch.variants && patch.variants.length > 0) {
    const enabled = patch.variants.filter((variant) => variant.enabled)
    rows.push({
      label: t('presets.summary.variants'),
      value: enabled
        .map((variant) =>
          t('presets.summary.variantsItem', { label: variant.label, suffix: variant.suffix })
        )
        .join(t('presets.summary.adjust.separator'))
    })
  }

  return rows
}

/**
 * Preset library.
 *
 * Every mutating call in the bridge answers with the complete preset array, so
 * the store is replaced from that reply rather than patched locally. The
 * renderer never has to guess what the main process decided to name or rename.
 */
export function PresetsPanel(props: PresetsPanelProps): React.JSX.Element {
  const { open, onClose } = props

  const { message } = AntApp.useApp()
  const { width } = useBreakpoint()
  const t = useT()

  const presets = useAppStore((state) => state.presets)
  const settings = useAppStore((state) => state.settings)
  const activePresetId = useAppStore((state) => state.activePresetId)
  const applyPreset = useAppStore((state) => state.applyPreset)
  const setPresets = useAppStore((state) => state.setPresets)

  // Null means the user has not picked a row yet, so the detail pane follows
  // whatever preset is currently in effect. It is cleared again on close, which
  // is why this is not seeded from the store and then left to drift.
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')

  const builtins = useMemo(() => presets.filter((preset) => preset.builtin), [presets])
  const mine = useMemo(() => presets.filter((preset) => !preset.builtin), [presets])
  const selected = useMemo(() => {
    const wanted = chosenId ?? activePresetId
    return presets.find((preset) => preset.id === wanted) ?? presets[0] ?? null
  }, [activePresetId, chosenId, presets])
  const rows = useMemo(() => (selected ? describePreset(selected.settings, t) : []), [selected, t])

  /** Runs a bridge call that returns the new preset list, with one error path. */
  const commit = useCallback(
    async (work: () => Promise<Preset[]>, done: string, keepId?: string): Promise<void> => {
      setBusy(true)
      try {
        const before = new Set(presets.map((preset) => preset.id))
        const next = await work()
        setPresets(next)

        // Anything the main process created is what the user just asked for, so
        // the detail pane follows it rather than staying on the source row.
        const fresh = next.find((preset) => !before.has(preset.id))
        if (keepId) setChosenId(keepId)
        else if (fresh) setChosenId(fresh.id)

        void message.success(done)
      } catch (error) {
        void message.error(errorMessage(error))
      } finally {
        setBusy(false)
      }
    },
    [message, presets, setPresets]
  )

  const handleApply = useCallback(() => {
    if (!selected) return
    applyPreset(selected)
    void message.success(t('presets.message.applied', { name: selected.name }))
    onClose()
  }, [applyPreset, message, onClose, selected, t])

  const handleDuplicate = useCallback(() => {
    if (!selected) return
    // The name is written straight into the preset file, so it has to be the
    // translated one on both paths. A built in id is recognised by the main
    // process and always forced to a new id, while a user preset has to have
    // its id cleared here or saving would overwrite the original.
    const copy: Preset = {
      ...selected,
      id: selected.builtin ? selected.id : '',
      name: t('presets.copyName', { name: selected.name }),
      builtin: false,
      createdAt: 0,
      updatedAt: 0
    }
    void commit(() => window.bico.presets.save(copy), t('presets.message.duplicated'))
  }, [commit, selected, t])

  const handleDelete = useCallback(() => {
    if (!selected || selected.builtin) return
    const removingActive = selected.id === activePresetId

    void commit(
      async () => {
        const next = await window.bico.presets.remove(selected.id)
        // Deleting the preset that is currently in effect would leave
        // activePresetId pointing at an id that no longer exists, and the
        // sidebar picker would fall back to rendering the raw id string.
        if (removingActive) {
          const fallback = next.find((preset) => preset.id === DEFAULT_PRESET_ID) ?? next[0]
          if (fallback) applyPreset(fallback)
        }
        return next
      },
      t('presets.message.deleted'),
      removingActive ? DEFAULT_PRESET_ID : activePresetId
    )
  }, [activePresetId, applyPreset, commit, selected, t])

  const handleImport = useCallback(() => {
    void commit(() => window.bico.presets.importFromFile(), t('presets.message.imported'))
  }, [commit, t])

  const handleExport = useCallback(async () => {
    if (!selected) return
    setBusy(true)
    try {
      const written = await window.bico.presets.exportToFile(selected.id)
      if (written) void message.success(t('presets.message.exported', { name: selected.name }))
    } catch (error) {
      void message.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }, [message, selected, t])

  /**
   * Writes every user preset into one file.
   *
   * Built in presets are left out on purpose: they ship with the app, so
   * carrying copies of them into a shared file would only create duplicates on
   * the machine that imports it. The shape matches what the importer already
   * accepts, which is how a file of one and a file of many stay interchangeable.
   */
  const handleExportAll = useCallback(async () => {
    if (mine.length === 0) {
      void message.info(t('presets.message.nothingToExport'))
      return
    }

    setBusy(true)
    try {
      const contents = JSON.stringify({ presets: mine }, null, 2)
      const result = await window.bico.dialog.saveJson('bico-presets.json', contents)
      const path = result.paths[0]
      if (result.cancelled || !path) return

      void message.success(
        mine.length === 1
          ? t('presets.message.exportedAllOne', { path })
          : t('presets.message.exportedAllMany', { count: mine.length, path })
      )
    } catch (error) {
      void message.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }, [message, mine, t])

  const openSaveForm = useCallback(() => {
    setDraftName('')
    setDraftDescription('')
    setSaveOpen(true)
  }, [])

  const handleSaveCurrent = useCallback(() => {
    const name = draftName.trim()
    if (!name) {
      void message.warning(t('presets.message.nameRequired'))
      return
    }

    const record: Preset = {
      id: '',
      name,
      description: draftDescription.trim(),
      icon: 'setting',
      builtin: false,
      settings: cloneDeep(settings),
      createdAt: 0,
      updatedAt: 0
    }

    setSaveOpen(false)
    void commit(() => window.bico.presets.save(record), t('presets.message.saved', { name }))
  }, [commit, draftDescription, draftName, message, settings, t])

  const renderPreset = (preset: Preset): React.JSX.Element => {
    const isSelected = selected?.id === preset.id
    return (
      <List.Item
        key={preset.id}
        role="option"
        aria-selected={isSelected}
        tabIndex={0}
        onClick={() => setChosenId(preset.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setChosenId(preset.id)
          }
        }}
        style={{
          cursor: 'pointer',
          paddingInline: 10,
          borderInlineStart: `2px solid ${isSelected ? 'var(--bico-accent)' : 'transparent'}`,
          background: isSelected ? 'var(--bico-surface-overlay)' : undefined
        }}
      >
        <div style={{ minWidth: 0, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span className="bico-truncate" style={{ fontWeight: 550 }}>
              {preset.name}
            </span>
            {preset.id === activePresetId && (
              <Tag color="success" style={{ marginInlineEnd: 0 }}>
                {t('presets.panel.inUse')}
              </Tag>
            )}
          </div>
          <div className="bico-truncate" style={{ fontSize: 12, color: 'var(--bico-text-muted)' }}>
            {preset.description}
          </div>
        </div>
      </List.Item>
    )
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t('presets.panel.title')}
      width={Math.min(960, Math.max(320, width - 48))}
      footer={null}
      destroyOnHidden
      afterOpenChange={(isOpen) => {
        if (!isOpen) setChosenId(null)
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div
          className="bico-scroll-y"
          role="listbox"
          aria-label={t('presets.panel.listLabel')}
          style={{
            flex: '1 1 260px',
            minWidth: 0,
            maxHeight: '54vh',
            border: '1px solid var(--bico-border)',
            borderRadius: 12
          }}
        >
          <List
            size="small"
            dataSource={builtins}
            renderItem={renderPreset}
            header={<div className="bico-section-title">{t('presets.panel.builtin')}</div>}
          />
          <List
            size="small"
            dataSource={mine}
            renderItem={renderPreset}
            header={<div className="bico-section-title">{t('presets.panel.mine')}</div>}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('presets.panel.noneYet')}
                />
              )
            }}
          />
        </div>

        <div style={{ flex: '2 1 320px', minWidth: 0 }}>
          {!selected && <Empty description={t('presets.panel.nothingToShow')} />}

          {selected && (
            <>
              <Space size={8} wrap style={{ marginBlockEnd: 4 }}>
                <Title level={5} style={{ margin: 0 }}>
                  {selected.name}
                </Title>
                {selected.builtin && (
                  <Tag icon={<LockOutlined />} color="default">
                    {t('presets.panel.locked')}
                  </Tag>
                )}
              </Space>

              <Paragraph type="secondary" style={{ marginBlockEnd: 12 }}>
                {selected.description || t('presets.panel.noDescription')}
              </Paragraph>

              <div className="bico-section-title">{t('presets.panel.changes')}</div>
              {rows.length === 0 ? (
                <Text type="secondary">{t('presets.panel.changesNone')}</Text>
              ) : (
                <dl className="bico-kv" style={{ marginBlockEnd: 16 }}>
                  {rows.map((row) => (
                    <div key={row.label} style={{ display: 'contents' }}>
                      <dt>{row.label}</dt>
                      <dd>{row.isolate ? <bdi dir="ltr">{row.value}</bdi> : row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <Space wrap>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleApply}
                  disabled={busy}
                >
                  {t('presets.action.apply')}
                </Button>
                <Button icon={<CopyOutlined />} onClick={handleDuplicate} disabled={busy}>
                  {t('presets.action.duplicate')}
                </Button>
                {!selected.builtin && (
                  <Popconfirm
                    title={t('presets.delete.title')}
                    description={t('presets.delete.description')}
                    okText={t('presets.delete.confirm')}
                    okButtonProps={{ danger: true }}
                    cancelText={t('presets.delete.cancel')}
                    onConfirm={handleDelete}
                  >
                    <Button danger icon={<DeleteOutlined />} disabled={busy}>
                      {t('presets.action.delete')}
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </>
          )}

          {/* Outside the selected block on purpose: saving what is on screen has
              nothing to do with whichever row happens to be highlighted. */}
          <div
            style={{
              marginBlockStart: 16,
              paddingBlockStart: 14,
              borderBlockStart: '1px solid var(--bico-border)'
            }}
          >
            <Button icon={<PlusOutlined />} onClick={openSaveForm} disabled={busy}>
              {t('presets.action.saveCurrent')}
            </Button>
          </div>
        </div>
      </div>

      {/* The sharing story used to be two unexplained buttons in a corner. It is
          the feature people ask for by name, so it gets a section that says what
          the file is and what to do with it. */}
      <section
        style={{
          marginBlockStart: 20,
          padding: 14,
          borderRadius: 14,
          border: '1px solid var(--bico-border)',
          background: 'var(--bico-surface-raised)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBlockEnd: 8 }}>
          <Glyph icon={<ShareAltOutlined />} tone="teal" size="md" />
          <div style={{ fontWeight: 600 }}>{t('presets.share.title')}</div>
        </div>

        <Paragraph type="secondary" style={{ fontSize: 13, marginBlockEnd: 8 }}>
          {t('presets.share.whatItIs')}
        </Paragraph>
        <Paragraph type="secondary" style={{ fontSize: 13, marginBlockEnd: 8 }}>
          {t('presets.share.howItWorks')}
        </Paragraph>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            marginBlockEnd: 10,
            background: 'var(--bico-surface)',
            borderInlineStart: '3px solid var(--bico-accent)'
          }}
        >
          <div
            className="bico-section-title"
            style={{ marginBlockStart: 0, marginBlockEnd: 4, marginInline: 0 }}
          >
            {t('presets.share.exampleTitle')}
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('presets.share.example')}
          </Text>
        </div>

        <Paragraph type="secondary" style={{ fontSize: 13, marginBlockEnd: 12 }}>
          {t('presets.share.uses')}
        </Paragraph>

        <Space wrap>
          <Button
            icon={<ExportOutlined />}
            onClick={() => void handleExport()}
            disabled={busy || !selected}
          >
            {selected
              ? t('presets.share.exportSelected', { name: selected.name })
              : t('presets.share.exportSelectedNone')}
          </Button>
          <Button
            icon={<ExportOutlined />}
            onClick={() => void handleExportAll()}
            disabled={busy || mine.length === 0}
          >
            {t('presets.action.exportAll')}
          </Button>
          <Button
            type="primary"
            ghost
            icon={<ImportOutlined />}
            onClick={handleImport}
            disabled={busy}
          >
            {t('presets.action.import')}
          </Button>
        </Space>

        <div style={{ marginBlockStart: 8 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {t('presets.share.importHint')}
          </Text>
        </div>
      </section>

      <Modal
        open={saveOpen}
        onCancel={() => setSaveOpen(false)}
        onOk={handleSaveCurrent}
        title={t('presets.save.title')}
        okText={t('presets.save.confirm')}
        cancelText={t('action.cancel')}
        width={Math.min(480, Math.max(300, width - 64))}
        destroyOnHidden
      >
        <Paragraph type="secondary">{t('presets.save.intro')}</Paragraph>
        <Space orientation="vertical" size={10} style={{ width: '100%' }}>
          <Input
            autoFocus
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder={t('presets.save.namePlaceholder')}
            maxLength={60}
            onPressEnter={handleSaveCurrent}
          />
          <Input.TextArea
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            placeholder={t('presets.save.descriptionPlaceholder')}
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={200}
          />
        </Space>
      </Modal>
    </Modal>
  )
}
