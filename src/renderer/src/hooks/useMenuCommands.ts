import { useEffect } from 'react'
import {
  cancelConversion,
  clearQueue,
  pickAndAddFiles,
  pickAndAddFolder,
  pickOutputFolder,
  startConversion,
  togglePause
} from '../actions'
import { useAppStore } from '../store/useAppStore'
import { savePrefs } from '../store/bridge'

/**
 * Routes application menu commands and keyboard shortcuts to the same actions.
 *
 * The accelerators registered on the native menu already cover most of these.
 * The keydown listener exists for the two that the menu cannot express, and so
 * the shortcuts still work while the menu bar is hidden.
 */
export function useMenuCommands(): void {
  useEffect(() => {
    const run = (command: string): void => {
      const store = useAppStore.getState()

      switch (command) {
        case 'add-files':
          void pickAndAddFiles()
          break
        case 'add-folder':
          void pickAndAddFolder()
          break
        case 'pick-output':
          void pickOutputFolder()
          break
        case 'clear-queue':
          clearQueue()
          break
        case 'start':
          void startConversion()
          break
        case 'pause':
          void togglePause()
          break
        case 'cancel':
          void cancelConversion()
          break
        case 'preview':
          store.setPanel(store.openPanel === 'preview' ? null : 'preview')
          break
        case 'presets':
          store.setPanel('presets')
          break
        case 'palette':
          store.setPanel(store.openPanel === 'palette' ? null : 'palette')
          break
        case 'about':
          store.setPanel('about')
          break
        case 'diagnostics':
          store.setPanel('diagnostics')
          break
        case 'preferences':
          store.setPanel('diagnostics')
          break
        case 'check-updates':
          void window.bico.updates.check()
          break
        case 'view-table':
          savePrefs({ queueView: 'table' })
          break
        case 'view-grid':
          savePrefs({ queueView: 'grid' })
          break
        default:
          break
      }
    }

    const disposeMenu = window.bico.on.menuCommand(run)

    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target
      const inField =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')

      if (event.key === 'Escape' && !inField) {
        const store = useAppStore.getState()
        if (store.openPanel) {
          store.setPanel(null)
          event.preventDefault()
        }
        return
      }

      if (inField) return

      const accel = event.ctrlKey || event.metaKey

      if (accel && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        run('palette')
        return
      }

      if (accel && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        const store = useAppStore.getState()
        store.setSidebarOpen(!store.sidebarOpen)
        return
      }

      if (event.key === 'Delete') {
        const store = useAppStore.getState()
        if (store.selectedId) {
          event.preventDefault()
          store.removeItems([store.selectedId])
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      disposeMenu()
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
