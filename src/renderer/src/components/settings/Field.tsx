import { Switch, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { Glyph, type GlyphTone } from '../Glyph'

/**
 * Layout primitives for the settings sidebar.
 *
 * The sidebar carries well over a hundred controls in a column that has to stay
 * usable at 340 pixels wide, so the spacing here is deliberately tight and every
 * label is allowed to ellipsis rather than wrap onto a second line. Nothing in
 * this file touches the store; the sections own their own state.
 *
 * Labels carry a little more weight and size than the hints under them, because
 * at this density the only thing separating a control from its explanation is
 * typographic contrast.
 */

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.3,
  color: 'var(--bico-text)'
}

const HELP_ICON_STYLE: React.CSSProperties = {
  fontSize: 11,
  flex: '0 0 auto',
  color: 'var(--bico-text-muted)'
}

const VALUE_STYLE: React.CSSProperties = {
  marginInlineStart: 'auto',
  flex: '0 0 auto',
  fontSize: 11,
  color: 'var(--bico-text-secondary)'
}

const HINT_STYLE: React.CSSProperties = {
  marginTop: 3,
  fontSize: 11,
  lineHeight: 1.45,
  color: 'var(--bico-text-muted)'
}

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0
}

export interface FieldProps {
  label: string
  /** Muted sentence under the control saying what it changes. */
  hint?: string
  /** Detail that only matters occasionally, parked behind a hover icon. */
  help?: string
  /** Live value, right aligned on the label row. Reads well next to a slider. */
  value?: ReactNode
  /** Optional bare glyph in front of the label, for controls worth finding fast. */
  icon?: ReactNode
  /** Tone of that glyph. Defaults to the section accent. */
  tone?: GlyphTone
  children: ReactNode
}

/** A labelled control: label row on top, control, then the muted hint. */
export function Field(props: FieldProps): React.JSX.Element {
  const { label, hint, help, value, icon, tone, children } = props

  return (
    <div style={{ minWidth: 0, marginBottom: 12 }}>
      <div style={{ ...ROW_STYLE, marginBottom: 4 }}>
        {icon === undefined ? null : <Glyph icon={icon} tone={tone} size="sm" bare />}
        <span className="bico-truncate" style={LABEL_STYLE}>
          {label}
        </span>
        {help ? (
          <Tooltip title={help}>
            <QuestionCircleOutlined style={HELP_ICON_STYLE} />
          </Tooltip>
        ) : null}
        {value === undefined ? null : (
          <span className="bico-mono" style={VALUE_STYLE}>
            {value}
          </span>
        )}
      </div>

      {children}

      {hint ? <div style={HINT_STYLE}>{hint}</div> : null}
    </div>
  )
}

export interface SwitchFieldProps {
  label: string
  hint?: string
  help?: string
  icon?: ReactNode
  tone?: GlyphTone
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** A single row toggle: label and hint on the left, switch on the right. */
export function SwitchField(props: SwitchFieldProps): React.JSX.Element {
  const { label, hint, help, icon, tone, checked, onChange, disabled } = props

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        minWidth: 0,
        marginBottom: 10,
        // Dimming the whole row makes it obvious that the label, not just the
        // switch, is inactive because something above it is turned off.
        opacity: disabled ? 0.5 : 1
      }}
    >
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div style={ROW_STYLE}>
          {icon === undefined ? null : <Glyph icon={icon} tone={tone} size="sm" bare />}
          <span className="bico-truncate" style={LABEL_STYLE}>
            {label}
          </span>
          {help ? (
            <Tooltip title={help}>
              <QuestionCircleOutlined style={HELP_ICON_STYLE} />
            </Tooltip>
          ) : null}
        </div>
        {hint ? <div style={HINT_STYLE}>{hint}</div> : null}
      </div>

      <Switch
        size="small"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={{ flex: '0 0 auto', marginTop: 2 }}
      />
    </div>
  )
}

export interface SectionHintProps {
  children: ReactNode
}

/** Muted paragraph introducing a whole group of controls. */
export function SectionHint(props: SectionHintProps): React.JSX.Element {
  return (
    <p
      style={{
        margin: '0 0 12px',
        fontSize: 11,
        lineHeight: 1.5,
        color: 'var(--bico-text-muted)'
      }}
    >
      {props.children}
    </p>
  )
}
