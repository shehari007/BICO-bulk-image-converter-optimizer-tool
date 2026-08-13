/**
 * A hand drawn activity sparkline.
 *
 * Written as inline SVG rather than pulled from a charting library because the
 * whole drawing is two paths, and a library would arrive with its own colour
 * system that has no idea the app ships eight themes. Every colour here is a
 * custom property published by theme/tokens.ts, so the chart repaints with the
 * rest of the interface.
 */

/** Drawing coordinate space. Both axes are stretched to fill the container. */
const VIEW_WIDTH = 100
const VIEW_HEIGHT = 32
/** Headroom above the busiest day, so the peak is not clipped by the stroke. */
const HEADROOM = 2

export interface SparklineProps {
  /** One value per bucket, oldest first. */
  values: readonly number[]
  /** Sentence read in place of the drawing, carrying the numbers it shows. */
  description: string
  /** Rendered height in pixels. The width always follows the container. */
  height?: number
  /** Mirrors the time axis, so the newest bucket lands where the reader looks. */
  rtl?: boolean
  /** Any CSS colour, normally a theme custom property. */
  color?: string
}

/**
 * Builds the polyline through the series.
 *
 * Coordinates are geometry rather than text, so a plain fixed point string is
 * the right thing here. The figures a reader actually sees go through the
 * locale formatter instead, because Arabic uses a different digit set.
 */
function points(values: readonly number[], max: number, rtl: boolean): string[] {
  const span = values.length > 1 ? values.length - 1 : 1
  // Zero lands exactly on the baseline rule, so a quiet day is unmistakably a
  // day with nothing in it rather than a small amount of something.
  const usable = VIEW_HEIGHT - HEADROOM

  return values.map((value, index) => {
    const ratio = index / span
    const x = rtl ? VIEW_WIDTH - ratio * VIEW_WIDTH : ratio * VIEW_WIDTH
    const y = VIEW_HEIGHT - (max > 0 ? (value / max) * usable : 0)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })
}

export function Sparkline(props: SparklineProps): React.JSX.Element {
  const { values, description, height = 64, rtl = false, color = 'var(--bico-accent)' } = props

  const max = values.reduce((highest, value) => (value > highest ? value : highest), 0)
  const coordinates = points(values, max, rtl)
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]

  const line = coordinates.length > 0 ? `M ${coordinates.join(' L ')}` : ''
  // The fill is closed down to the baseline so a run of quiet days reads as an
  // empty area rather than as missing data.
  const area =
    first && last
      ? `${line} L ${last.split(',')[0] ?? '0'},${VIEW_HEIGHT} L ${first.split(',')[0] ?? '0'},${VIEW_HEIGHT} Z`
      : ''

  return (
    <svg
      role="img"
      aria-label={description}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height, overflow: 'visible' }}
    >
      {/* The baseline is the only rule drawn: it tells a reader where zero is,
          which a bare sparkline otherwise leaves to guesswork. */}
      <line
        x1="0"
        y1={VIEW_HEIGHT}
        x2={VIEW_WIDTH}
        y2={VIEW_HEIGHT}
        stroke="var(--bico-text-muted)"
        strokeWidth={1}
        opacity={0.35}
        vectorEffect="non-scaling-stroke"
      />
      {area ? <path d={area} fill={color} opacity={0.16} /> : null}
      {line ? (
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
          // Without this the horizontal stretch would thicken the stroke by
          // whatever ratio the container happens to have.
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  )
}
