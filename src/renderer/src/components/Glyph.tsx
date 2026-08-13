import type { ReactNode } from 'react'

/**
 * The icon tones.
 *
 * Named by role rather than by colour so a theme can shift the actual hue
 * without every call site lying about what it renders. No single hue survives
 * both a near black and a near white surface, which the earlier fixed values
 * claimed and did not do: amber measured 1.58 to 1 on Daylight. Every tone is
 * therefore a custom property published by theme/tokens.ts, which swaps the
 * whole ramp with the base so a tinted tile stays recognisable as "the resize
 * one" across all eight themes and stays visible in each of them.
 */
export type GlyphTone =
  'accent' | 'violet' | 'green' | 'amber' | 'rose' | 'cyan' | 'teal' | 'orange' | 'pink' | 'slate'

export type GlyphSize = 'sm' | 'md' | 'lg' | 'xl'

const TONE_COLOR: Record<GlyphTone, string> = {
  accent: 'var(--bico-accent)',
  violet: 'var(--bico-tone-violet)',
  green: 'var(--bico-tone-green)',
  amber: 'var(--bico-tone-amber)',
  rose: 'var(--bico-tone-rose)',
  cyan: 'var(--bico-tone-cyan)',
  teal: 'var(--bico-tone-teal)',
  orange: 'var(--bico-tone-orange)',
  pink: 'var(--bico-tone-pink)',
  slate: 'var(--bico-text-secondary)'
}

const SIZE: Record<GlyphSize, { box: number; icon: number; radius: number }> = {
  sm: { box: 26, icon: 14, radius: 8 },
  md: { box: 32, icon: 17, radius: 9 },
  lg: { box: 40, icon: 21, radius: 11 },
  xl: { box: 52, icon: 27, radius: 14 }
}

export interface GlyphProps {
  icon: ReactNode
  tone?: GlyphTone
  size?: GlyphSize
  /** Renders the glyph without its tinted tile, keeping only the colour. */
  bare?: boolean
  title?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * An icon in a tinted tile.
 *
 * The previous release drew every icon in one shade of grey, which made a dense
 * settings sidebar read as an undifferentiated wall. Giving each section its own
 * tone turns scanning the panel into recognising a colour rather than reading
 * every label.
 */
export function Glyph(props: GlyphProps): React.JSX.Element {
  const { icon, tone = 'accent', size = 'md', bare = false, title, className, style } = props
  const colour = TONE_COLOR[tone]
  const dimensions = SIZE[size]

  if (bare) {
    return (
      <span
        className={className}
        title={title}
        aria-hidden={title ? undefined : true}
        style={{
          color: colour,
          fontSize: dimensions.icon,
          lineHeight: 1,
          display: 'inline-flex',
          flex: '0 0 auto',
          ...style
        }}
      >
        {icon}
      </span>
    )
  }

  return (
    <span
      className={className}
      title={title}
      aria-hidden={title ? undefined : true}
      style={{
        width: dimensions.box,
        height: dimensions.box,
        flex: '0 0 auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: dimensions.radius,
        fontSize: dimensions.icon,
        lineHeight: 1,
        color: colour,
        // A tint of the icon's own colour rather than a fixed grey, so the tile
        // reads as part of the icon instead of a container around it.
        background: `color-mix(in srgb, ${colour} 16%, transparent)`,
        border: `1px solid color-mix(in srgb, ${colour} 26%, transparent)`,
        ...style
      }}
    >
      {icon}
    </span>
  )
}

/**
 * Tones assigned to the settings sections, kept beside the component that
 * defines them so the two cannot drift apart.
 */
/* eslint-disable-next-line react-refresh/only-export-components */
export const SECTION_TONES = {
  format: 'accent',
  resize: 'cyan',
  transform: 'violet',
  adjust: 'pink',
  watermark: 'amber',
  metadata: 'teal',
  output: 'green',
  variants: 'orange',
  smart: 'rose',
  performance: 'slate'
} as const satisfies Record<string, GlyphTone>
