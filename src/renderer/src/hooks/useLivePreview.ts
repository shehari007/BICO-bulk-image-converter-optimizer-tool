import { useEffect, useRef, useState } from 'react'
import { PREVIEW_MAX_EDGE } from '@shared/defaults'
import type { ConversionSettings, PreviewResult } from '@shared/types'
import { translate } from '../i18n'

interface PreviewState {
  result: PreviewResult | null
  loading: boolean
  error: string | null
}

const IDLE: PreviewState = { result: null, loading: false, error: null }

/**
 * Renders the selected image at the current settings, debounced.
 *
 * Every slider drag would otherwise queue a full decode and encode. The debounce
 * collapses a drag into one render, and the sequence number discards replies
 * that arrive out of order, which happens whenever a cheap setting is changed
 * while an expensive render from the previous change is still running.
 */
export function useLivePreview(
  fileId: string | null,
  settings: ConversionSettings,
  enabled: boolean,
  debounceMs = 350
): PreviewState {
  const [state, setState] = useState<PreviewState>({
    result: null,
    loading: false,
    error: null
  })

  const sequence = useRef(0)

  // The settings object is rebuilt on every keystroke, so it is compared by
  // value. Serialising is cheap next to the render this guards.
  const settingsKey = JSON.stringify(settings)

  useEffect(() => {
    if (!enabled || !fileId) {
      // Bumping the ticket discards whatever reply is still in flight. The idle
      // result itself is derived below rather than stored, so there is nothing
      // to reset here and no cascading render.
      sequence.current += 1
      return
    }

    const ticket = sequence.current + 1
    sequence.current = ticket

    const timer = setTimeout(() => {
      setState((previous) => ({ ...previous, loading: true, error: null }))

      window.bico.preview
        .render({ fileId, settings, maxEdge: PREVIEW_MAX_EDGE })
        .then((result) => {
          if (sequence.current !== ticket) return
          setState({
            result,
            loading: false,
            // Translated here rather than in the panel because the same field
            // also carries messages thrown by the main process, which are not
            // keys and cannot be translated at the point of display.
            error: result ? null : translate('preview.error.unsupported')
          })
        })
        .catch((error: unknown) => {
          if (sequence.current !== ticket) return
          setState({
            result: null,
            loading: false,
            error: error instanceof Error ? error.message : String(error)
          })
        })
    }, debounceMs)

    return () => clearTimeout(timer)
    // settingsKey stands in for the settings object, which is a fresh
    // reference on every change. The object itself is read inside the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, enabled, debounceMs, settingsKey])

  // Nothing selected means nothing to show, which is a property of the inputs
  // rather than a piece of state worth storing.
  return enabled && fileId ? state : IDLE
}
