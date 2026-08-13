import { useCallback, useRef, useState } from 'react'
import { ColumnWidthOutlined } from '@ant-design/icons'
import { clamp } from '@shared/utils'
import { useLocale, useT } from '../i18n'

export interface CompareSliderProps {
  /** Data URL of the source image, shown on the left of the wipe. */
  before: string
  /** Data URL of the converted image, revealed on the left as the wipe moves. */
  after: string
  alt?: string
}

/** Arrow keys nudge, Shift plus arrow covers ground quickly. */
const KEY_STEP = 2
const KEY_LEAP = 10

const CAPTION_BASE: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  padding: '2px 9px',
  fontSize: 11,
  fontWeight: 650,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  borderRadius: 999,
  color: '#ffffff',
  background: 'rgb(0 0 0 / 55%)',
  pointerEvents: 'none'
}

/**
 * Before and after wipe.
 *
 * The converted image is clipped rather than resized, because shrinking the
 * overlay would rescale it against the original and every comparison would show
 * a difference that the encoder never produced.
 */
export function CompareSlider(props: CompareSliderProps): React.JSX.Element {
  const { before, after, alt } = props
  const t = useT()
  const { n } = useLocale()
  const subject = alt ?? t('preview.compare.subject')

  const [position, setPosition] = useState(50)
  const [focused, setFocused] = useState(false)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)

  const positionFor = useCallback((clientX: number): number => {
    const frame = frameRef.current
    if (!frame) return 50
    const rect = frame.getBoundingClientRect()
    if (rect.width <= 0) return 50
    return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)
  }, [])

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      // Pointer capture keeps the drag bound to this element, so a fast sweep
      // that leaves the frame still tracks instead of freezing at the edge.
      event.currentTarget.setPointerCapture(event.pointerId)
      dragging.current = true
      setPosition(positionFor(event.clientX))
    },
    [positionFor]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      if (!dragging.current) return
      setPosition(positionFor(event.clientX))
    },
    [positionFor]
  )

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>): void => {
    if (!dragging.current) return
    dragging.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>): void => {
    const step = event.shiftKey ? KEY_LEAP : KEY_STEP

    switch (event.key) {
      case 'ArrowLeft':
        setPosition((current) => clamp(current - step, 0, 100))
        break
      case 'ArrowRight':
        setPosition((current) => clamp(current + step, 0, 100))
        break
      case 'Home':
        setPosition(0)
        break
      case 'End':
        setPosition(100)
        break
      default:
        return
    }

    event.preventDefault()
  }, [])

  const rounded = Math.round(position)

  return (
    <div
      ref={frameRef}
      className="bico-compare"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img src={before} alt={t('preview.compare.altBefore', { subject })} draggable={false} />

      <div
        className="bico-compare-after"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        aria-hidden={rounded === 0}
      >
        <img src={after} alt={t('preview.compare.altAfter', { subject })} draggable={false} />
      </div>

      {/* Physical sides on purpose: the wipe itself is a clip path that always
          reveals from the left, so the captions have to stay pinned to it. */}
      <span style={{ ...CAPTION_BASE, left: 8 }}>{t('preview.compare.converted')}</span>
      <span style={{ ...CAPTION_BASE, right: 8 }}>{t('preview.compare.original')}</span>

      <div
        className="bico-compare-handle"
        style={{ left: `${position}%` }}
        role="slider"
        tabIndex={0}
        aria-label={t('preview.compare.aria')}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        aria-valuetext={t('preview.compare.ariaValue', { percent: n(rounded) })}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <div
          className="bico-compare-grip"
          style={
            focused
              ? {
                  boxShadow:
                    '0 0 0 4px color-mix(in srgb, var(--bico-accent) 45%, transparent), 0 2px 10px rgb(0 0 0 / 35%)'
                }
              : undefined
          }
        >
          <ColumnWidthOutlined />
        </div>
      </div>
    </div>
  )
}
