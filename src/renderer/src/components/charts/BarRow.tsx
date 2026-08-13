/**
 * One horizontal bar with its own labels.
 *
 * The bar is inline SVG sized in percentages rather than user units, which
 * means there is no viewBox to stretch and the rounded end stays a circle at
 * every container width. That matters at 720 pixels, where a stretched viewBox
 * would turn each cap into a long ellipse.
 */

/** Bar thickness in pixels. Thin marks read as data, thick ones read as buttons. */
const THICKNESS = 8
/** A non zero value never collapses to nothing, or the row looks like a bug. */
const MIN_VISIBLE_PERCENT = 1.5

export interface BarRowProps {
  /** Name of the category, shown at the start of the row. */
  label: string
  /** Primary figure, already formatted in the active locale. */
  value: string
  /** Optional second figure, shown at the end of the row. */
  secondary?: string
  /** Share of the longest bar in the group, 0 to 1. */
  ratio: number
  /** Sentence read in place of the bar, carrying the same numbers. */
  description: string
  /** Any CSS colour, normally a theme custom property. */
  color?: string
  /**
   * Fill opacity, used to grade a ranked series in one hue. Colour alone never
   * carries meaning here, since every row is labelled.
   */
  intensity?: number
  /** Mirrors the bar so it grows away from the reading edge. */
  rtl?: boolean
}

export function BarRow(props: BarRowProps): React.JSX.Element {
  const {
    label,
    value,
    secondary,
    ratio,
    description,
    color = 'var(--bico-accent)',
    intensity = 1,
    rtl = false
  } = props

  const clamped = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : 0
  const percent = clamped === 0 ? 0 : Math.max(clamped * 100, MIN_VISIBLE_PERCENT)

  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBlockEnd: 4,
          fontSize: 12,
          minWidth: 0
        }}
      >
        <span className="bico-truncate" style={{ fontWeight: 600, flex: '1 1 auto' }}>
          {label}
        </span>
        <span style={{ flex: '0 0 auto', color: 'var(--bico-text)' }}>{value}</span>
        {secondary ? (
          <span style={{ flex: '0 0 auto', color: 'var(--bico-text-muted)' }}>{secondary}</span>
        ) : null}
      </div>

      <svg
        role="img"
        aria-label={description}
        width="100%"
        height={THICKNESS}
        style={{ display: 'block', overflow: 'hidden' }}
      >
        <rect
          x="0"
          y="0"
          width="100%"
          height={THICKNESS}
          rx={THICKNESS / 2}
          fill="var(--bico-text-muted)"
          opacity={0.14}
        />
        {percent > 0 ? (
          <rect
            x={rtl ? `${100 - percent}%` : '0'}
            y="0"
            width={`${percent}%`}
            height={THICKNESS}
            rx={THICKNESS / 2}
            fill={color}
            fillOpacity={intensity}
          />
        ) : null}
      </svg>
    </div>
  )
}
