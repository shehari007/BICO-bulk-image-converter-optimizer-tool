import type { BicoApi } from '@shared/api'

/**
 * Everything the renderer is allowed to touch outside the DOM.
 *
 * Declared here rather than in the renderer so the preload implementation and
 * the consumers of the bridge are checked against the exact same interface.
 */
declare global {
  interface Window {
    readonly bico: BicoApi
    readonly bicoDrop: {
      /** Real filesystem paths for files taken from a drop event. */
      pathsFor(files: readonly File[]): string[]
    }
  }
}

export {}
