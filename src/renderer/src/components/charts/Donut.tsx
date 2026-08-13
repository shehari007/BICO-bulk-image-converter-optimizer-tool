/**
 * A two or three slice donut with its own legend.
 *
 * The ring is drawn as dashed strokes on one circle rather than as arc paths,
 * which keeps the maths to a running total and makes every segment length a
 * plain percentage. The legend is part of the component on purpose: a ring that
 * only speaks through colour is unreadable to a colour blind user, so the
 * numbers always travel with it.
 */

/** Square drawing box. The ring keeps its aspect ratio inside the container. */
const BOX = 42
const CENTRE = BOX / 2
/** Radius chosen so the circumference is exactly 100, making dashes percentages. */
const RADIUS = 15.9154943092
const STROKE = 5
/** Surface gap between neighbouring segments, in the same percentage units. */
const SEGMENT_GAP = 1

export interface DonutSegment {
  id: string
  label: string
  value: number
  /** Any CSS colour, normally a theme custom property. */
  color: string
  /** The value formatted in the active locale, shown in the legend. */
  display: string
  /** The share formatted in the active locale, shown in the legend. */
  share: string
}

export interface DonutProps {
  segments: readonly DonutSegment[]
  /** Sentence read in place of the ring, carrying the same numbers. */
  description: string
  /** Large figure printed inside the ring, already formatted. */
  centreValue: string
  /** Short caption under that figure. Keep it to a word or two. */
  centreLabel: string
  /** Reverses the sweep so it runs with the reading direction. */
  rtl?: boolean
}

interface DonutArc {
  segment: DonutSegment
  /** Drawn length as a percentage of the ring. */
  length: number
  /** Where the segment starts, also a percentage of the ring. */
  offset: number
}

function buildArcs(segments: readonly DonutSegment[], total: number): DonutArc[] {
  const arcs: DonutArc[] = []
  let offset = 0

  for (const segment of segments) {
    const length = total > 0 ? (segment.value / total) * 100 : 0
    // Only trim a segment that can spare the gap, otherwise a one percent
    // slice would vanish into it entirely.
    const drawn = segments.length > 1 && length > SEGMENT_GAP * 2 ? length - SEGMENT_GAP : length
    arcs.push({ segment, length: drawn, offset })
    offset += length
  }

  return arcs
}

export function Donut(props: DonutProps): React.JSX.Element {
  const { segments, description, centreValue, centreLabel, rtl = false } = props

  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const arcs = buildArcs(segments, total)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        minWidth: 0
      }}
    >
      <div style={{ flex: '0 1 118px', width: '100%', maxWidth: 118, minWidth: 92 }}>
        <svg
          role="img"
          aria-label={description}
          viewBox={`0 0 ${BOX} ${BOX}`}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        >
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={RADIUS}
            fill="none"
            stroke="var(--bico-text-muted)"
            strokeOpacity={0.16}
            strokeWidth={STROKE}
          />

          {/* Mirroring the whole ring, rather than negating each offset, keeps
              the sweep running with the reading direction in one place. */}
          <g transform={rtl ? `translate(${BOX} 0) scale(-1 1)` : undefined}>
            <g transform={`rotate(-90 ${CENTRE} ${CENTRE})`}>
              {arcs.map((arc) =>
                arc.length > 0 ? (
                  <circle
                    key={arc.segment.id}
                    cx={CENTRE}
                    cy={CENTRE}
                    r={RADIUS}
                    fill="none"
                    stroke={arc.segment.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${arc.length.toFixed(3)} ${(100 - arc.length).toFixed(3)}`}
                    strokeDashoffset={(-arc.offset).toFixed(3)}
                  />
                ) : null
              )}
            </g>
          </g>

          <text
            x={CENTRE}
            y={CENTRE - 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--bico-text)"
            style={{ fontSize: 8.5, fontWeight: 650 }}
          >
            {centreValue}
          </text>
          <text
            x={CENTRE}
            y={CENTRE + 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--bico-text-muted)"
            style={{ fontSize: 3.6, letterSpacing: 0.2 }}
          >
            {centreLabel}
          </text>
        </svg>
      </div>

      <ul
        style={{
          flex: '1 1 150px',
          minWidth: 0,
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        {segments.map((segment) => (
          <li
            key={segment.id}
            style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, fontSize: 12 }}
          >
            <span
              aria-hidden
              style={{
                flex: '0 0 auto',
                width: 9,
                height: 9,
                borderRadius: 3,
                background: segment.color,
                alignSelf: 'center'
              }}
            />
            <span className="bico-truncate" style={{ flex: '1 1 auto', fontWeight: 600 }}>
              {segment.label}
            </span>
            <span style={{ flex: '0 0 auto' }}>{segment.display}</span>
            <span style={{ flex: '0 0 auto', color: 'var(--bico-text-muted)' }}>
              {segment.share}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
