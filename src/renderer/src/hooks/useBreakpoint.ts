import { useEffect, useState } from 'react'

/**
 * Layout breakpoints.
 *
 * These are window widths, not device widths. A desktop app is resized freely,
 * so the layout has to hold together at 720 pixels wide just as much as a phone
 * layout would, and the sidebar has to get out of the way well before then.
 */
export const BREAKPOINTS = {
  /** Below this the sidebar becomes a drawer. */
  sidebarDrawer: 1024,
  /** Below this the queue drops to its compact column set. */
  compactTable: 880,
  /** Below this secondary toolbar labels collapse to icons. */
  iconOnly: 700
} as const

export type BreakpointState = {
  width: number
  height: number
  /** The sidebar cannot be docked at this width. */
  isNarrow: boolean
  isCompact: boolean
  isTiny: boolean
}

function read(): BreakpointState {
  const width = window.innerWidth
  return {
    width,
    height: window.innerHeight,
    isNarrow: width < BREAKPOINTS.sidebarDrawer,
    isCompact: width < BREAKPOINTS.compactTable,
    isTiny: width < BREAKPOINTS.iconOnly
  }
}

/**
 * Tracks the window size through a ResizeObserver on the document element.
 *
 * A resize event listener would also work, but the observer fires once per
 * frame under the browser's own scheduling rather than on every intermediate
 * pixel, which keeps a slow drag of the window edge from thrashing React.
 */
export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(read)

  useEffect(() => {
    let frame = 0

    const update = (): void => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setState((previous) => {
          const next = read()
          return previous.width === next.width && previous.height === next.height ? previous : next
        })
      })
    }

    const observer = new ResizeObserver(update)
    observer.observe(document.documentElement)
    window.addEventListener('resize', update)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return state
}
