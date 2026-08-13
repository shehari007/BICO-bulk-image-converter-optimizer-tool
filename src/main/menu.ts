import { Menu, app, shell, type BrowserWindow, type MenuItemConstructorOptions } from 'electron'
import { EVENT } from '@shared/channels'
import { logFilePath } from './services/logger'

const REPO_URL = 'https://github.com/shehari007/BICO-bulk-image-converter-optimizer-tool'
const ISSUES_URL = `${REPO_URL}/issues`

/**
 * Menu entries mostly forward a command string to the renderer rather than
 * acting directly.
 *
 * The renderer owns the queue and the settings, so it is the only place that
 * can decide what "Start conversion" means right now. Keeping the menu dumb
 * avoids duplicating that state in the main process.
 */
export function buildMenu(window: BrowserWindow): void {
  const send = (command: string) => (): void => {
    if (!window.isDestroyed()) window.webContents.send(EVENT.menuCommand, command)
  }

  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([
          {
            label: app.name,
            submenu: [
              { label: 'About BICO', click: send('about') },
              { type: 'separator' },
              { label: 'Preferences', accelerator: 'Cmd+,', click: send('preferences') },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ] satisfies MenuItemConstructorOptions[])
      : []),
    {
      label: 'File',
      submenu: [
        { label: 'Add Images', accelerator: 'CmdOrCtrl+O', click: send('add-files') },
        { label: 'Add Folder', accelerator: 'CmdOrCtrl+Shift+O', click: send('add-folder') },
        { type: 'separator' },
        { label: 'Choose Output Folder', accelerator: 'CmdOrCtrl+D', click: send('pick-output') },
        { type: 'separator' },
        { label: 'Clear Queue', accelerator: 'CmdOrCtrl+Backspace', click: send('clear-queue') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Convert',
      submenu: [
        { label: 'Start', accelerator: 'CmdOrCtrl+Return', click: send('start') },
        { label: 'Pause or Resume', accelerator: 'CmdOrCtrl+P', click: send('pause') },
        { label: 'Cancel', accelerator: 'Escape', click: send('cancel') },
        { type: 'separator' },
        { label: 'Live Preview', accelerator: 'CmdOrCtrl+L', click: send('preview') },
        { label: 'Manage Presets', accelerator: 'CmdOrCtrl+Shift+P', click: send('presets') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+K', click: send('palette') },
        { type: 'separator' },
        { label: 'Table View', click: send('view-table') },
        { label: 'Grid View', click: send('view-grid') },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(app.isPackaged
          ? []
          : ([
              { type: 'separator' },
              { role: 'reload' },
              { role: 'toggleDevTools' }
            ] satisfies MenuItemConstructorOptions[]))
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: () => void shell.openExternal(REPO_URL) },
        { label: 'Report an Issue', click: () => void shell.openExternal(ISSUES_URL) },
        { type: 'separator' },
        { label: 'Open Log File', click: () => void shell.openPath(logFilePath()) },
        { label: 'Diagnostics', click: send('diagnostics') },
        { type: 'separator' },
        { label: 'Check for Updates', click: send('check-updates') },
        ...(isMac
          ? []
          : ([
              { label: 'About BICO', click: send('about') }
            ] satisfies MenuItemConstructorOptions[]))
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
