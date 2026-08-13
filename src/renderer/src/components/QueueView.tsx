import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Empty,
  Input,
  Popconfirm,
  Segmented,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import type { TableColumnsType } from 'antd'
import {
  AppstoreOutlined,
  ClearOutlined,
  DeleteOutlined,
  FileImageOutlined,
  FilterOutlined,
  InboxOutlined,
  SearchOutlined,
  SyncOutlined,
  TableOutlined
} from '@ant-design/icons'
import { savingsPercent } from '@shared/utils'
import type { JobState, QueueView as QueueViewMode } from '@shared/types'
import { clearQueue } from '../actions'
import { savePrefs } from '../store/bridge'
import { useAppStore } from '../store/useAppStore'
import type { QueueItem } from '../store/useAppStore'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useFormatBytes, useLocale, useT } from '../i18n'
import type { TranslationKey } from '../i18n'
import { Glyph } from './Glyph'
import { DropZone } from './DropZone'

const { Text } = Typography

type StatusFilter = 'all' | 'pending' | 'done' | 'failed' | 'skipped'

const STATUS_FILTERS: { value: StatusFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'queue.filter.all' },
  { value: 'pending', labelKey: 'queue.filter.pending' },
  { value: 'done', labelKey: 'queue.filter.done' },
  { value: 'failed', labelKey: 'queue.filter.failed' },
  { value: 'skipped', labelKey: 'queue.filter.skipped' }
]

const STATE_TAGS: Record<JobState, { labelKey: TranslationKey; color: string }> = {
  queued: { labelKey: 'status.queued', color: 'default' },
  running: { labelKey: 'status.running', color: 'processing' },
  done: { labelKey: 'status.done', color: 'success' },
  failed: { labelKey: 'status.failed', color: 'error' },
  skipped: { labelKey: 'status.skipped', color: 'warning' },
  cancelled: { labelKey: 'status.cancelled', color: 'default' }
}

/**
 * Cards are plain DOM with a decoded thumbnail each, so the grid is capped.
 * A ten thousand file queue belongs in the virtualised table, and the footer
 * below the grid says so rather than silently hiding the rest.
 */
const GRID_LIMIT = 300

/** Smallest width the table can lay out before it starts scrolling sideways. */
const TABLE_MIN_WIDTH = 880
const TABLE_MIN_WIDTH_COMPACT = 640

const HEADER_STYLE: React.CSSProperties = {
  flex: '0 0 auto',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  paddingBlock: 10,
  paddingInline: 12,
  borderBottom: '1px solid var(--bico-border)'
}

const THUMB_SIZE = 48

/**
 * Keeps a column header readable to assistive technology without drawing it.
 *
 * The thumbnail and action columns are far too narrow to carry a visible word,
 * but a table whose columns have no names is unusable from a screen reader.
 */
const VISUALLY_HIDDEN: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap'
}

function matchesStatus(state: JobState, filter: StatusFilter): boolean {
  switch (filter) {
    case 'pending':
      return state === 'queued' || state === 'running'
    case 'done':
      return state === 'done'
    case 'failed':
      return state === 'failed'
    case 'skipped':
      return state === 'skipped' || state === 'cancelled'
    case 'all':
    default:
      return true
  }
}

export interface QueueCellProps {
  item: QueueItem
}

export function Thumbnail(props: QueueCellProps): React.JSX.Element {
  const t = useT()

  if (props.item.thumbnail) {
    return (
      <img
        src={props.item.thumbnail}
        alt={t('queue.row.thumbnailAlt', { name: props.item.file.name })}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          objectFit: 'cover',
          borderRadius: 8,
          display: 'block',
          background: 'var(--bico-surface-overlay)'
        }}
      />
    )
  }

  return (
    <Glyph
      icon={<FileImageOutlined />}
      tone="slate"
      size="lg"
      style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 8 }}
    />
  )
}

export interface StateTagProps {
  state: JobState
}

/** Shared by the table cell and the card so a status never reads two ways. */
export function StateTag(props: StateTagProps): React.JSX.Element {
  const t = useT()
  const meta = STATE_TAGS[props.state]

  return (
    <Tag color={meta.color} icon={props.state === 'running' ? <SyncOutlined spin /> : undefined}>
      {t(meta.labelKey)}
    </Tag>
  )
}

export function BackendTag(props: QueueCellProps): React.JSX.Element {
  const t = useT()
  const { backend, device } = props.item
  if (!backend) return <></>

  const isGpu = backend === 'gpu'
  const tone = isGpu ? 'var(--bico-gpu)' : 'var(--bico-cpu)'

  return (
    <Tooltip title={device || t(isGpu ? 'queue.backend.gpuHint' : 'queue.backend.cpuHint')}>
      <Tag
        variant="outlined"
        style={{
          color: tone,
          borderColor: tone,
          background: `color-mix(in srgb, ${tone} 14%, transparent)`
        }}
      >
        {t(isGpu ? 'backend.gpu' : 'backend.cpu')}
      </Tag>
    </Tooltip>
  )
}

/** Output size with the change against the source, once a run has produced one. */
export function OutputCell(props: QueueCellProps): React.JSX.Element {
  const t = useT()
  const { n } = useLocale()
  const formatBytes = useFormatBytes()
  const { item } = props

  if (item.outputSize <= 0) {
    const waiting = item.state === 'queued' || item.state === 'running'
    return <Text type="secondary">{t(waiting ? 'queue.output.pending' : 'queue.output.none')}</Text>
  }

  const saved = savingsPercent(item.file.size, item.outputSize)
  const tone = saved >= 0 ? 'var(--bico-success)' : 'var(--bico-danger)'

  return (
    <div style={{ minWidth: 0 }}>
      <div className="bico-mono">
        {formatBytes(item.outputSize, item.outputSize >= 1024 * 1024 ? 1 : 0)}
      </div>
      <div className="bico-mono" style={{ fontSize: 11, color: tone }}>
        {t(saved >= 0 ? 'queue.output.smaller' : 'queue.output.larger', {
          percent: n(Math.abs(Math.round(saved)))
        })}
      </div>
    </div>
  )
}

/**
 * Owns everything between the stat strip and the status bar.
 *
 * The table is virtualised because a queue of several thousand rows is normal
 * for this app, and the grid is the browsing view rather than the working one.
 */
export function QueueView(): React.JSX.Element {
  const { isCompact, isTiny } = useBreakpoint()
  const t = useT()
  const { direction, n } = useLocale()
  const formatBytes = useFormatBytes()

  const items = useAppStore((state) => state.items)
  const selectedId = useAppStore((state) => state.selectedId)
  const select = useAppStore((state) => state.select)
  const removeItems = useAppStore((state) => state.removeItems)
  const view = useAppStore((state) => state.prefs.queueView)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewportHeight, setViewportHeight] = useState(320)
  const hasItems = items.length > 0

  const isRtl = direction === 'rtl'
  /** Numeric columns hug the end of the row, which swaps side with the script. */
  const numericAlign = isRtl ? 'left' : 'right'

  // The virtual table needs a pixel height for its body, and the queue region
  // is sized by flex, so the only way to know it is to measure it.
  useEffect(() => {
    const node = scrollRef.current
    if (!node) return

    setViewportHeight(node.clientHeight)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setViewportHeight(entry.contentRect.height)
    })
    observer.observe(node)

    return () => observer.disconnect()
  }, [hasItems])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return items.filter((item) => {
      if (!matchesStatus(item.state, status)) return false
      if (!needle) return true
      return item.file.name.toLowerCase().includes(needle)
    })
  }, [items, search, status])

  const columns = useMemo<TableColumnsType<QueueItem>>(() => {
    const list: TableColumnsType<QueueItem> = [
      {
        key: 'thumbnail',
        title: <span style={VISUALLY_HIDDEN}>{t('queue.column.thumbnail')}</span>,
        width: 76,
        render: (_: unknown, item: QueueItem) => <Thumbnail item={item} />
      },
      {
        key: 'name',
        title: t('queue.column.file'),
        render: (_: unknown, item: QueueItem) => (
          <Tooltip
            title={item.file.path}
            placement={isRtl ? 'topRight' : 'topLeft'}
            mouseEnterDelay={0.4}
          >
            <div style={{ minWidth: 0 }}>
              <div className="bico-truncate" style={{ fontWeight: 550 }}>
                {item.file.name}
              </div>
              {item.error && (
                <div
                  className="bico-truncate"
                  style={{ fontSize: 11, color: 'var(--bico-danger)' }}
                >
                  {item.error}
                </div>
              )}
            </div>
          </Tooltip>
        )
      }
    ]

    if (!isCompact) {
      list.push({
        key: 'dimensions',
        title: t('queue.column.dimensions'),
        width: 130,
        render: (_: unknown, item: QueueItem) =>
          item.probe ? (
            <div style={{ minWidth: 0 }}>
              <div className="bico-mono bico-truncate">
                {t('queue.dimensions.value', {
                  width: n(item.probe.width),
                  height: n(item.probe.height)
                })}
              </div>
              <div
                className="bico-truncate"
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  color: 'var(--bico-text-muted)'
                }}
              >
                {item.probe.format}
              </div>
            </div>
          ) : (
            <Tooltip title={t('queue.dimensions.readingHint')}>
              <Text type="secondary">{t('queue.dimensions.reading')}</Text>
            </Tooltip>
          )
      })
    }

    list.push(
      {
        key: 'source',
        title: t('queue.column.source'),
        width: 100,
        align: numericAlign,
        render: (_: unknown, item: QueueItem) => (
          <span className="bico-mono">
            {formatBytes(item.file.size, item.file.size >= 1024 * 1024 ? 1 : 0)}
          </span>
        )
      },
      {
        key: 'output',
        title: t('queue.column.output'),
        width: 116,
        align: numericAlign,
        render: (_: unknown, item: QueueItem) => <OutputCell item={item} />
      },
      {
        key: 'state',
        title: t('queue.column.status'),
        width: 112,
        render: (_: unknown, item: QueueItem) => <StateTag state={item.state} />
      }
    )

    if (!isCompact) {
      list.push({
        key: 'backend',
        title: t('queue.column.backend'),
        width: 96,
        render: (_: unknown, item: QueueItem) => <BackendTag item={item} />
      })
    }

    list.push({
      key: 'actions',
      title: <span style={VISUALLY_HIDDEN}>{t('queue.column.actions')}</span>,
      width: 56,
      align: 'center',
      render: (_: unknown, item: QueueItem) => (
        <Tooltip title={t('queue.row.remove')}>
          <Button
            type="text"
            size="small"
            aria-label={t('queue.row.removeNamed', { name: item.file.name })}
            icon={<Glyph bare icon={<DeleteOutlined />} tone="rose" size="sm" />}
            onClick={(event) => {
              event.stopPropagation()
              removeItems([item.file.id])
            }}
          />
        </Tooltip>
      )
    })

    return list
  }, [formatBytes, isCompact, isRtl, n, numericAlign, removeItems, t])

  if (!hasItems) {
    return (
      <div className="bico-queue">
        <DropZone />
      </div>
    )
  }

  const shown = filtered.slice(0, GRID_LIMIT)
  const countLabel =
    filtered.length === items.length
      ? items.length === 1
        ? t('queue.count.one')
        : t('queue.count.many', { count: n(items.length) })
      : t('queue.count.filtered', { shown: n(filtered.length), total: n(items.length) })

  const emptyFiltered = (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 10, padding: '32px 16px' }}>
      <Glyph icon={<FilterOutlined />} tone="amber" size="xl" />
      <Text strong>{t('queue.empty.filtered')}</Text>
      <Text type="secondary">{t('queue.empty.filteredHint')}</Text>
    </div>
  )

  return (
    <div className="bico-queue">
      <div style={HEADER_STYLE}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Glyph icon={<InboxOutlined />} tone="accent" size="md" />
          <Text strong style={{ whiteSpace: 'nowrap' }}>
            {countLabel}
          </Text>
        </span>

        <Segmented<QueueViewMode>
          value={view}
          onChange={(next) => savePrefs({ queueView: next })}
          options={[
            { value: 'table', icon: <TableOutlined />, tooltip: t('queue.view.table') },
            { value: 'grid', icon: <AppstoreOutlined />, tooltip: t('queue.view.grid') }
          ]}
        />

        <Input
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          prefix={<Glyph bare icon={<SearchOutlined />} tone="slate" size="sm" />}
          placeholder={t('queue.search.placeholder')}
          aria-label={t('queue.search.placeholder')}
          style={{ flex: '1 1 150px', minWidth: 130, maxWidth: 320 }}
        />

        <Select<StatusFilter>
          value={status}
          onChange={setStatus}
          aria-label={t('queue.filter.aria')}
          options={STATUS_FILTERS.map((entry) => ({
            value: entry.value,
            label: t(entry.labelKey)
          }))}
          style={{ minWidth: 132 }}
        />

        <Popconfirm
          title={t('queue.clear.title')}
          description={t('queue.clear.description')}
          okText={t('queue.clear.confirm')}
          cancelText={t('queue.clear.keep')}
          okButtonProps={{ danger: true }}
          onConfirm={clearQueue}
        >
          <Button
            danger
            type="text"
            aria-label={t('queue.clear.title')}
            icon={<Glyph bare icon={<ClearOutlined />} tone="rose" size="md" />}
          >
            {isTiny ? null : t('queue.clear')}
          </Button>
        </Popconfirm>
      </div>

      <div className="bico-queue-scroll" ref={scrollRef}>
        {view === 'table' ? (
          <Table<QueueItem>
            virtual
            rowKey={(item) => item.file.id}
            dataSource={filtered}
            columns={columns}
            pagination={false}
            scroll={{
              x: isCompact ? TABLE_MIN_WIDTH_COMPACT : TABLE_MIN_WIDTH,
              y: Math.max(140, viewportHeight - 46)
            }}
            locale={{ emptyText: emptyFiltered }}
            rowClassName={(item) => (item.file.id === selectedId ? 'ant-table-row-selected' : '')}
            onRow={(item) => ({ onClick: () => select(item.file.id) })}
          />
        ) : filtered.length === 0 ? (
          <Empty
            style={{ marginTop: 48 }}
            description={t('queue.empty.filtered')}
            image={<Glyph icon={<FilterOutlined />} tone="amber" size="xl" />}
          />
        ) : (
          <>
            <div className="bico-grid">
              {shown.map((item) => (
                <div
                  key={item.file.id}
                  role="button"
                  tabIndex={0}
                  title={item.file.path}
                  className={item.file.id === selectedId ? 'bico-card is-selected' : 'bico-card'}
                  onClick={() => select(item.file.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      select(item.file.id)
                    }
                  }}
                >
                  {item.thumbnail ? (
                    <img
                      className="bico-card-thumb"
                      src={item.thumbnail}
                      alt={t('queue.row.thumbnailAlt', { name: item.file.name })}
                    />
                  ) : (
                    <div
                      className="bico-card-thumb"
                      style={{ display: 'grid', placeItems: 'center' }}
                    >
                      <Glyph icon={<FileImageOutlined />} tone="slate" size="lg" />
                    </div>
                  )}

                  <div className="bico-card-badge">
                    <StateTag state={item.state} />
                  </div>

                  <div className="bico-card-meta">
                    <div className="bico-card-name">{item.file.name}</div>
                    <div className="bico-card-sub">
                      <span className="bico-truncate">
                        {item.probe
                          ? t('queue.dimensions.value', {
                              width: n(item.probe.width),
                              height: n(item.probe.height)
                            })
                          : item.file.ext.toUpperCase()}
                      </span>
                      <span className="bico-mono">
                        {item.outputSize > 0
                          ? formatBytes(item.outputSize, item.outputSize >= 1024 * 1024 ? 1 : 0)
                          : formatBytes(item.file.size, item.file.size >= 1024 * 1024 ? 1 : 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length > shown.length && (
              <div style={{ paddingInline: 14, paddingBlockEnd: 14, textAlign: 'center' }}>
                <Text type="secondary">{t('queue.grid.limited', { count: n(GRID_LIMIT) })}</Text>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
