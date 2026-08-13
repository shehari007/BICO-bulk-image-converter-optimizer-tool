import { useCallback, useState, type ReactNode } from 'react'
import {
  Alert,
  App as AntApp,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Space,
  Switch,
  Tag,
  Typography,
  theme
} from 'antd'
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  NodeIndexOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { formatCapabilities } from '@shared/formats'
import { errorMessage } from '@shared/utils'
import { Glyph, type GlyphTone } from '../Glyph'
import { useAppStore } from '../../store/useAppStore'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useLocale, useT } from '../../i18n'

const { Text } = Typography

interface WatchPanelProps {
  open: boolean
  onClose: () => void
}

/** The default settle time, used when the number field is cleared outright. */
const DEFAULT_SETTLE_MS = 1500

/** Matches the icon size Ant Design gives an alert that carries a description. */
const ALERT_ICON_SIZE = 24

/**
 * A form label with its own tinted icon.
 *
 * Written as a plain call rather than a component so the panel keeps a single
 * exported symbol, which is what the file is allowed to declare.
 */
function labelWithGlyph(text: string, tone: GlyphTone, icon: ReactNode): ReactNode {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <Glyph bare size="sm" tone={tone} icon={icon} />
      {text}
    </span>
  )
}

/**
 * Hot folder configuration.
 *
 * The settings are captured when watching starts and stay frozen for the whole
 * session, so this panel is careful to say so: a user who changes the format
 * afterwards and sees old output would otherwise assume the watcher is broken.
 */
export function WatchPanel(props: WatchPanelProps): React.JSX.Element {
  const { open, onClose } = props

  const { message, modal } = AntApp.useApp()
  const { token } = theme.useToken()
  const { width } = useBreakpoint()
  const t = useT()
  const { n, direction } = useLocale()

  const config = useAppStore((state) => state.watchConfig)
  const status = useAppStore((state) => state.watchStatus)
  const settings = useAppStore((state) => state.settings)
  const patchWatchConfig = useAppStore((state) => state.patchWatchConfig)
  const setWatchStatus = useAppStore((state) => state.setWatchStatus)

  const [busy, setBusy] = useState(false)

  const running = status?.running === true
  const formatName = formatCapabilities(settings.format)?.label ?? t('watch.formatOriginal')

  const pickFolder = useCallback(
    async (field: 'folder' | 'moveProcessedTo'): Promise<void> => {
      const picked = await window.bico.dialog.pickOutputFolder()
      const folder = picked.paths[0]
      if (picked.cancelled || !folder) return

      if (field === 'folder') patchWatchConfig({ folder })
      // Choosing somewhere to move originals to and deleting them are two
      // answers to the same question, so picking one clears the other.
      else patchWatchConfig({ moveProcessedTo: folder, deleteAfterProcess: false })
    },
    [patchWatchConfig]
  )

  const toggleDelete = useCallback(
    (checked: boolean): void => {
      if (!checked) {
        patchWatchConfig({ deleteAfterProcess: false })
        return
      }

      modal.confirm({
        title: t('watch.delete.confirmTitle'),
        // Left as a bare icon because Ant Design floats this slot itself, and a
        // wrapper would lose the spacing that keeps the title beside it.
        icon: <WarningOutlined style={{ color: token.colorError }} />,
        content: t('watch.delete.confirmBody'),
        okText: t('watch.delete.confirmOk'),
        okButtonProps: { danger: true },
        cancelText: t('watch.delete.confirmCancel'),
        onOk: () => patchWatchConfig({ deleteAfterProcess: true, moveProcessedTo: '' })
      })
    },
    [modal, patchWatchConfig, t, token.colorError]
  )

  const start = useCallback(async (): Promise<void> => {
    if (!config.folder) {
      void message.warning(t('watch.toast.needFolder'))
      return
    }
    if (settings.output.target === 'folder' && !settings.output.folder) {
      void message.warning(t('watch.toast.needOutput'))
      return
    }

    setBusy(true)
    try {
      const next = await window.bico.watch.start(config, settings)
      setWatchStatus(next)
      if (next.error) void message.error(next.error)
      else void message.success(t('watch.toast.started'))
    } catch (error) {
      void message.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }, [config, message, setWatchStatus, settings, t])

  const stop = useCallback(async (): Promise<void> => {
    setBusy(true)
    try {
      const next = await window.bico.watch.stop()
      setWatchStatus(next)
      void message.info(t('watch.toast.stopped'))
    } catch (error) {
      void message.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }, [message, setWatchStatus, t])

  return (
    <Drawer
      open={open}
      onClose={onClose}
      // The panel belongs on the inline end of the window, which is the left
      // edge once the interface is flipped for a right to left language.
      placement={direction === 'rtl' ? 'left' : 'right'}
      size={Math.min(520, Math.max(320, width - 48))}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Glyph size="sm" tone="teal" icon={<EyeOutlined />} />
          <span className="bico-truncate">{t('watch.title')}</span>
        </span>
      }
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 16 } }}
    >
      <Alert
        type="info"
        showIcon
        icon={
          <Glyph
            bare
            tone="cyan"
            icon={<InfoCircleOutlined />}
            style={{ fontSize: ALERT_ICON_SIZE }}
          />
        }
        title={t('watch.intro.title')}
        description={t('watch.intro.body', { format: formatName })}
      />

      <Form layout="vertical" disabled={running}>
        <Form.Item
          label={labelWithGlyph(t('watch.folder.label'), 'cyan', <FolderOutlined />)}
          extra={t('watch.folder.hint')}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input
              readOnly
              value={config.folder}
              placeholder={t('watch.folder.placeholder')}
              title={config.folder}
            />
            <Button
              icon={<Glyph bare size="sm" tone="amber" icon={<FolderOpenOutlined />} />}
              onClick={() => void pickFolder('folder')}
            >
              {t('watch.action.choose')}
            </Button>
          </Space.Compact>
        </Form.Item>

        <Form.Item
          label={labelWithGlyph(t('watch.recursive.label'), 'violet', <NodeIndexOutlined />)}
          extra={t('watch.recursive.hint')}
        >
          <Switch
            checked={config.recursive}
            onChange={(recursive) => patchWatchConfig({ recursive })}
          />
        </Form.Item>

        <Form.Item
          label={labelWithGlyph(t('watch.settle.label'), 'amber', <ClockCircleOutlined />)}
          extra={t('watch.settle.hint')}
        >
          <InputNumber
            value={config.settleMs}
            onChange={(value) => patchWatchConfig({ settleMs: value ?? DEFAULT_SETTLE_MS })}
            min={200}
            max={60000}
            step={100}
            addonAfter={t('unit.milliseconds')}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label={labelWithGlyph(t('watch.move.label'), 'teal', <SwapOutlined />)}
          extra={t('watch.move.hint')}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input
              readOnly
              value={config.moveProcessedTo}
              placeholder={t('watch.move.placeholder')}
              title={config.moveProcessedTo}
            />
            <Button
              icon={<Glyph bare size="sm" tone="amber" icon={<FolderOpenOutlined />} />}
              onClick={() => void pickFolder('moveProcessedTo')}
            >
              {t('watch.action.choose')}
            </Button>
            {config.moveProcessedTo && (
              <Button onClick={() => patchWatchConfig({ moveProcessedTo: '' })}>
                {t('action.clear')}
              </Button>
            )}
          </Space.Compact>
        </Form.Item>

        <Form.Item
          label={labelWithGlyph(t('watch.delete.label'), 'rose', <DeleteOutlined />)}
          extra={config.moveProcessedTo ? t('watch.delete.hintMoving') : t('watch.delete.hint')}
        >
          <Switch
            checked={config.deleteAfterProcess}
            disabled={running || config.moveProcessedTo !== ''}
            onChange={toggleDelete}
          />
        </Form.Item>
      </Form>

      {config.deleteAfterProcess && (
        <Alert
          type="warning"
          showIcon
          icon={
            <Glyph
              bare
              tone="rose"
              icon={<WarningOutlined />}
              style={{ fontSize: ALERT_ICON_SIZE }}
            />
          }
          title={t('watch.delete.warningTitle')}
          description={t('watch.delete.warningBody')}
        />
      )}

      <Space wrap>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={busy && !running}
          disabled={running || !config.folder}
          onClick={() => void start()}
        >
          {t('watch.action.start')}
        </Button>
        <Button
          icon={<StopOutlined />}
          danger
          disabled={!running}
          loading={busy && running}
          onClick={() => void stop()}
        >
          {t('watch.action.stop')}
        </Button>
      </Space>

      <div>
        <div
          className="bico-section-title"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Glyph bare size="sm" tone="green" icon={<ThunderboltOutlined />} />
          {t('watch.status.title')}
        </div>
        <dl className="bico-kv">
          <dt style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Glyph bare size="sm" tone={running ? 'green' : 'slate'} icon={<EyeOutlined />} />
            {t('watch.status.state')}
          </dt>
          <dd>
            <Tag color={running ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
              {running ? t('watch.status.running') : t('watch.status.idle')}
            </Tag>
          </dd>

          <dt style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Glyph bare size="sm" tone="cyan" icon={<FolderOutlined />} />
            {t('watch.status.folder')}
          </dt>
          <dd className="bico-selectable">
            {status?.folder || config.folder || t('watch.status.noFolder')}
          </dd>

          <dt style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Glyph bare size="sm" tone="violet" icon={<PictureOutlined />} />
            {t('watch.status.seen')}
          </dt>
          <dd className="bico-mono">{n(status?.seen ?? 0)}</dd>

          <dt style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Glyph bare size="sm" tone="green" icon={<SwapOutlined />} />
            {t('watch.status.processed')}
          </dt>
          <dd className="bico-mono">{n(status?.processed ?? 0)}</dd>

          <dt style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Glyph bare size="sm" tone="orange" icon={<ClockCircleOutlined />} />
            {t('watch.status.lastEvent')}
          </dt>
          <dd>{status?.lastEvent || t('watch.status.noEvent')}</dd>
        </dl>

        {status?.error && (
          <Alert
            type="error"
            showIcon
            icon={
              <Glyph
                bare
                tone="rose"
                icon={<WarningOutlined />}
                style={{ fontSize: ALERT_ICON_SIZE }}
              />
            }
            style={{ marginTop: 12 }}
            title={t('watch.status.errorTitle')}
            description={status.error}
          />
        )}

        {running && (
          <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
            {t('watch.status.locked')}
          </Text>
        )}
      </div>
    </Drawer>
  )
}
