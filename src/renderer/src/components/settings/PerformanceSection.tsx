import { Alert, Flex, InputNumber, Segmented, Slider, Tag } from 'antd'
import { ClusterOutlined, DatabaseOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type {
  GpuAdapterInfo,
  GpuAdapterKind,
  PerformanceSettings,
  ProcessingBackend
} from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { useLocale, useT, type TranslationKey } from '../../i18n'
import { SECTION_TONES } from '../Glyph'
import { Field, SectionHint, SwitchField } from './Field'

const TONE = SECTION_TONES.performance

const BACKEND_HINT: Record<ProcessingBackend, TranslationKey> = {
  auto: 'settings.performance.backend.autoHint',
  gpu: 'settings.performance.backend.gpuHint',
  cpu: 'settings.performance.backend.cpuHint'
}

const KIND_LABEL: Record<GpuAdapterKind, TranslationKey> = {
  discrete: 'settings.performance.adapter.discrete',
  integrated: 'settings.performance.adapter.integrated',
  cpu: 'settings.performance.adapter.software',
  unknown: 'state.unknown'
}

const KIND_COLOR: Record<GpuAdapterKind, string> = {
  discrete: 'purple',
  integrated: 'blue',
  cpu: 'default',
  unknown: 'default'
}

const ADAPTER_ROW: React.CSSProperties = {
  border: '1px solid var(--bico-border)',
  borderRadius: 10,
  padding: '8px 10px',
  background: 'var(--bico-surface-raised)',
  minWidth: 0
}

export function PerformanceSection(): React.JSX.Element {
  const performance = useAppStore((state) => state.settings.performance)
  const patchSettings = useAppStore((state) => state.patchSettings)
  const gpu = useAppStore((state) => state.gpu)
  const cpuCores = useAppStore((state) => state.system?.os.cpuCores ?? 0)
  const t = useT()

  const patch = (value: Partial<PerformanceSettings>): void => {
    patchSettings({ performance: value })
  }

  // The GPU options stay reachable while the probe is still running. The status
  // lands a moment after the window opens, and greying the control out for that
  // moment reads as a fault rather than as a pending check.
  const gpuUnsupported = gpu !== null && !gpu.supported
  const gpuControlsEnabled = !gpuUnsupported && performance.backend !== 'cpu'

  return (
    <div style={{ minWidth: 0 }}>
      <Field
        label={t('settings.performance.backend.label')}
        icon={<ThunderboltOutlined />}
        tone={TONE}
        hint={t(BACKEND_HINT[performance.backend])}
      >
        <Segmented<ProcessingBackend>
          block
          size="small"
          value={performance.backend}
          onChange={(backend) => patch({ backend })}
          options={[
            {
              value: 'auto',
              label: t('settings.performance.backend.auto'),
              tooltip: t('settings.performance.backend.autoTooltip')
            },
            {
              value: 'gpu',
              label: t('backend.gpu'),
              disabled: gpuUnsupported,
              tooltip: gpuUnsupported
                ? t('settings.performance.backend.gpuMissing')
                : t('settings.performance.backend.gpuTooltip')
            },
            {
              value: 'cpu',
              label: t('backend.cpu'),
              tooltip: t('settings.performance.backend.cpuTooltip')
            }
          ]}
        />
      </Field>

      {gpu === null ? <SectionHint>{t('settings.performance.probePending')}</SectionHint> : null}

      {gpuUnsupported ? (
        <Alert
          type="warning"
          showIcon
          title={t('settings.performance.gpuUnavailable.title')}
          description={
            gpu !== null && gpu.reason !== ''
              ? gpu.reason
              : t('settings.performance.gpuUnavailable.body')
          }
          style={{ marginBottom: 12 }}
        />
      ) : null}

      {gpu !== null && gpu.adapters.length > 0 ? (
        <Field
          label={t('settings.performance.adapters.label')}
          icon={<ClusterOutlined />}
          tone={TONE}
        >
          <Flex vertical gap={6} style={{ minWidth: 0 }}>
            {gpu.adapters.map((adapter) => (
              <AdapterRow key={adapter.id} adapter={adapter} />
            ))}
          </Flex>
        </Field>
      ) : null}

      <SwitchField
        label={t('settings.performance.preferDiscrete.label')}
        hint={t('settings.performance.preferDiscrete.hint')}
        checked={performance.preferDiscreteGpu}
        disabled={!gpuControlsEnabled}
        onChange={(preferDiscreteGpu) => patch({ preferDiscreteGpu })}
      />

      <SwitchField
        label={t('settings.performance.useAllGpus.label')}
        hint={t('settings.performance.useAllGpus.hint')}
        checked={performance.useAllGpus}
        disabled={!gpuControlsEnabled}
        onChange={(useAllGpus) => patch({ useAllGpus })}
      />

      <SwitchField
        label={t('settings.performance.gpuAssist.label')}
        hint={t('settings.performance.gpuAssist.hint')}
        checked={performance.gpuAssistedEncode}
        disabled={!gpuControlsEnabled}
        onChange={(gpuAssistedEncode) => patch({ gpuAssistedEncode })}
      />

      <Field
        label={t('settings.performance.workers.label')}
        value={performance.concurrency === 0 ? t('state.automatic') : performance.concurrency}
        hint={
          cpuCores > 0
            ? t('settings.performance.workers.hint', { cores: cpuCores })
            : t('settings.performance.workers.hintUnknown')
        }
      >
        <Slider
          min={0}
          max={32}
          step={1}
          value={performance.concurrency}
          marks={{ 0: t('settings.performance.workers.auto') }}
          onChange={(concurrency) => patch({ concurrency })}
        />
      </Field>

      <Field
        label={t('settings.performance.vips.label')}
        value={
          performance.vipsConcurrency === 0 ? t('state.automatic') : performance.vipsConcurrency
        }
        hint={t('settings.performance.vips.hint')}
      >
        <Slider
          min={0}
          max={32}
          step={1}
          value={performance.vipsConcurrency}
          marks={{ 0: t('settings.performance.workers.auto') }}
          onChange={(vipsConcurrency) => patch({ vipsConcurrency })}
        />
      </Field>

      <Field
        label={t('settings.performance.cache.label')}
        icon={<DatabaseOutlined />}
        tone={TONE}
        value={t('settings.value.megabytes', { value: performance.cacheMemoryMb })}
        hint={t('settings.performance.cache.hint')}
      >
        <Slider
          min={0}
          max={2048}
          step={64}
          value={performance.cacheMemoryMb}
          onChange={(cacheMemoryMb) => patch({ cacheMemoryMb })}
        />
      </Field>

      <Field
        label={t('settings.performance.maxPixels.label')}
        hint={t('settings.performance.maxPixels.hint')}
      >
        <InputNumber<number>
          min={1}
          max={4000}
          step={50}
          value={Math.round(performance.maxPixels / 1_000_000)}
          suffix={t('settings.performance.megapixels')}
          aria-label={t('settings.performance.maxPixels.aria')}
          style={{ width: '100%' }}
          onChange={(megapixels) =>
            patch({ maxPixels: Math.round((megapixels ?? 400) * 1_000_000) })
          }
        />
      </Field>
    </div>
  )
}

interface AdapterRowProps {
  adapter: GpuAdapterInfo
}

/**
 * One adapter as reported by the WebGPU probe.
 *
 * The description is the only field a user recognises, so it takes the width and
 * the truncation, while the numbers that explain a fallback sit under it.
 */
export function AdapterRow(props: AdapterRowProps): React.JSX.Element {
  const { adapter } = props
  const t = useT()
  const { n } = useLocale()

  const name = adapter.description || adapter.device || t('settings.performance.adapter.unnamed')

  return (
    <div style={ADAPTER_ROW}>
      <Flex align="center" gap={6} style={{ minWidth: 0 }}>
        <span
          className="bico-truncate bico-selectable"
          title={name}
          style={{ flex: '1 1 auto', fontSize: 12, fontWeight: 550 }}
        >
          {name}
        </span>
        {adapter.active ? (
          <Tag color="success" style={{ margin: 0, fontSize: 11 }}>
            {t('settings.performance.adapter.active')}
          </Tag>
        ) : null}
      </Flex>

      <Flex align="center" gap={6} wrap style={{ marginTop: 6, minWidth: 0 }}>
        <Tag color={KIND_COLOR[adapter.kind]} style={{ margin: 0, fontSize: 11 }}>
          {t(KIND_LABEL[adapter.kind])}
        </Tag>
        <span style={{ fontSize: 11, color: 'var(--bico-text-muted)' }}>
          {t('settings.performance.adapter.maxTexture', {
            value: n(adapter.maxTextureDimension)
          })}
        </span>
      </Flex>
    </div>
  )
}
