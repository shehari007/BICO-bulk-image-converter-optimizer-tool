import { useCallback, useEffect, useRef, useState } from 'react'
import { App as AntApp, Drawer, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { Toolbar } from './components/Toolbar'
import { StatsStrip } from './components/StatsStrip'
import { QueueView } from './components/QueueView'
import { StatusBar } from './components/StatusBar'
import { SettingsSidebar } from './components/SettingsSidebar'
import { AboutPanel } from './components/panels/AboutPanel'
import { DiagnosticsPanel } from './components/panels/DiagnosticsPanel'
import { HistoryPanel } from './components/panels/HistoryPanel'
import { PresetsPanel } from './components/panels/PresetsPanel'
import { PreviewPanel } from './components/panels/PreviewPanel'
import { StatsPanel } from './components/panels/StatsPanel'
import { WatchPanel } from './components/panels/WatchPanel'
import { CommandPalette } from './components/CommandPalette'
import { SummaryModal } from './components/SummaryModal'
import { WelcomeScreen } from './components/WelcomeScreen'
import { connectBridge, importPaths } from './store/bridge'
import { useAppStore } from './store/useAppStore'
import { useBreakpoint } from './hooks/useBreakpoint'
import { useMenuCommands } from './hooks/useMenuCommands'
import { RELEASE_VERSION } from '@shared/highlights'
import { startGpuRuntime, stopGpuRuntime } from './gpu'
import { useLocale, useT } from './i18n'

const { Text, Title } = Typography

/**
 * The application shell.
 *
 * Layout is a plain flex column rather than Ant's Layout component, because the
 * sidebar has to move between a docked column and an overlay drawer as the
 * window narrows and that is far easier to express directly.
 */
export function App(): React.JSX.Element {
  const { isNarrow } = useBreakpoint()
  const sidebarOpen = useAppStore((state) => state.sidebarOpen)
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen)
  const openPanel = useAppStore((state) => state.openPanel)
  const setPanel = useAppStore((state) => state.setPanel)
  const sidebarWidth = useAppStore((state) => state.prefs.sidebarWidth)

  const { message } = AntApp.useApp()
  const t = useT()
  const { direction, n } = useLocale()
  const [dragging, setDragging] = useState(false)
  // Drag events fire for every child element, so a counter is the only reliable
  // way to know when the pointer has genuinely left the window.
  const dragDepth = useRef(0)

  useEffect(() => {
    const dispose = connectBridge()
    void startGpuRuntime()
      .then((status) => useAppStore.getState().setGpu(status))
      .catch(() => undefined)

    return () => {
      dispose()
      void stopGpuRuntime()
    }
  }, [])

  useEffect(() => {
    if (isNarrow) setSidebarOpen(false)
  }, [isNarrow, setSidebarOpen])

  useMenuCommands()

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      dragDepth.current = 0
      setDragging(false)

      const files = Array.from(event.dataTransfer.files)
      if (files.length === 0) return

      // File.path was removed in Electron 32, so the real paths come back
      // through a preload helper rather than off the File objects.
      const paths = window.bicoDrop.pathsFor(files)
      if (paths.length === 0) {
        void message.warning(t('shell.import.unreadable'))
        return
      }

      void importPaths(paths).then((count) => {
        if (count === 0) void message.info(t('shell.import.dropEmpty'))
        else {
          void message.success(
            t(count === 1 ? 'shell.import.added.one' : 'shell.import.added.many', {
              count: n(count)
            })
          )
        }
      })
    },
    [message, t, n]
  )

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) return
    dragDepth.current += 1
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }, [])

  const closePanel = useCallback(() => setPanel(null), [setPanel])

  /**
   * The welcome screen waits for preferences to load.
   *
   * Preferences arrive from disk a moment after the first paint, so showing
   * it before they land would flash it at somebody who dismissed it months
   * ago. Comparing against the release version rather than a boolean also
   * brings it back exactly once after an upgrade.
   */
  const prefsLoaded = useAppStore((state) => state.prefsLoaded)
  const welcomeSeen = useAppStore((state) => state.prefs.welcomeSeenVersion)
  const [welcomeDismissed, setWelcomeDismissed] = useState(false)
  const showWelcome = prefsLoaded && !welcomeDismissed && welcomeSeen !== RELEASE_VERSION

  const sidebar = <SettingsSidebar />

  return (
    <div
      className="bico-shell"
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <Toolbar />

      <div className="bico-body">
        {!isNarrow && sidebarOpen && (
          <aside className="bico-sidebar" style={{ width: sidebarWidth }}>
            {sidebar}
          </aside>
        )}

        <main className="bico-main">
          <div className="bico-content">
            <StatsStrip />
            <QueueView />
          </div>
          <StatusBar />
        </main>
      </div>

      <Drawer
        open={isNarrow && sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        // This drawer replaces the docked sidebar, which sits on the inline
        // start of the window, so it is the mirror image of the panels that
        // open on the inline end. antd only flips the drawer's own styling for
        // a right to left language, never the placement it was given.
        placement={direction === 'rtl' ? 'right' : 'left'}
        size={Math.min(sidebarWidth + 20, window.innerWidth - 40)}
        title={t('shell.settings.title')}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      >
        {sidebar}
      </Drawer>

      {dragging && (
        <div className="bico-drop-overlay">
          <div style={{ textAlign: 'center' }}>
            <InboxOutlined style={{ fontSize: 56, color: 'var(--bico-accent)' }} />
            <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
              {t('shell.drop.title')}
            </Title>
            <Text type="secondary">{t('shell.drop.body')}</Text>
          </div>
        </div>
      )}

      <AboutPanel open={openPanel === 'about'} onClose={closePanel} />
      <DiagnosticsPanel open={openPanel === 'diagnostics'} onClose={closePanel} />
      <HistoryPanel open={openPanel === 'history'} onClose={closePanel} />
      <PresetsPanel open={openPanel === 'presets'} onClose={closePanel} />
      <PreviewPanel open={openPanel === 'preview'} onClose={closePanel} />
      <StatsPanel open={openPanel === 'stats'} onClose={closePanel} />
      <WatchPanel open={openPanel === 'watch'} onClose={closePanel} />
      <CommandPalette open={openPanel === 'palette'} onClose={closePanel} />
      <SummaryModal open={openPanel === 'summary'} onClose={closePanel} />
      <WelcomeScreen open={showWelcome} onClose={() => setWelcomeDismissed(true)} />
    </div>
  )
}
