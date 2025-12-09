// Module to control the application lifecycle and the native browser window.
const { app, BrowserWindow, ipcMain, shell, Notification, dialog } = require("electron");
const path = require("path");

if (process.platform === 'win32') {
    app.setAppUserModelId("BICO-Bulk Image Converter Tool");
}

let mainWindow;

function createWindow() {
    const archLabel = process.arch === 'arm64' ? 'arm64' : 'x64';
    const appVersion = app.getVersion();
    const windowTitle = `BICO - Bulk Image Converter & Optimizer Tool v${appVersion} (${archLabel})`;

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 850,
        minWidth: 1100,
        minHeight: 700,
        resizable: true,
        movable: true,
        maximizable: true,
        minimizable: true,
        fullscreenable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
        titleBarStyle: 'default',
        title: windowTitle,
        backgroundColor: '#0d1117',
        show: false,
    });

    mainWindow.setIcon(path.join(__dirname, 'logo.png'));

    // Use loadFile for packaged builds (handles file:// paths correctly on macOS)
    // Use loadURL for dev mode (localhost)
    if (app.isPackaged) {
        const indexPath = path.join(__dirname, 'index.html');
        console.log('Loading file:', indexPath);
        mainWindow.loadFile(indexPath);
    } else {
        mainWindow.loadURL("http://localhost:3000");
    }

    // Surface load failures to help debug blank screens in packaged builds
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Load failed', { errorCode, errorDescription, validatedURL });
    });

    // Show window when ready and enforce title
    mainWindow.once('ready-to-show', () => {
        mainWindow.center();
        mainWindow.setTitle(windowTitle);
        mainWindow.show();
    });

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.setMenu(null);
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function showNotification(cap) {
    new Notification({
        title: cap.title,
        body: cap.body,
        icon: path.join(__dirname, "logo.png"),
        silent: false,
    }).show();
}

app.whenReady().then(() => {
    createWindow();

    // Open external links
    ipcMain.on('open-external-link', (event, url) => {
        shell.openExternal(url);
    });

    // Show notifications
    ipcMain.on('show-notification', (event, cap) => {
        showNotification(cap);
    });

    // Select folder dialog
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'createDirectory'],
            title: 'Select Output Folder',
            buttonLabel: 'Select Folder',
        });
        return result;
    });

    // Open folder in file explorer
    ipcMain.on('open-folder', (event, folderPath) => {
        shell.openPath(folderPath);
    });

    // Select files dialog
    ipcMain.handle('select-files', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
            title: 'Select Images',
            buttonLabel: 'Add Images',
            filters: [
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'tif', 'avif', 'heif', 'heic', 'bmp'] },
                { name: 'All Files', extensions: ['*'] }
            ],
        });
        return result;
    });

    // Save file dialog
    ipcMain.handle('save-file', async (event, defaultPath) => {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Converted Images',
            defaultPath: defaultPath || 'converted_images.zip',
            filters: [
                { name: 'ZIP Archive', extensions: ['zip'] },
            ],
        });
        return result;
    });

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// App info for renderer (version + arch + platform)
ipcMain.handle('get-app-info', async () => {
    return {
        version: app.getVersion(),
        arch: process.arch,
        platform: process.platform,
    };
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

const allowedNavigationDestinations = ["https://my-electron-app.com", "http://localhost:3000", "https://localhost:3000"];
app.on("web-contents-created", (event, contents) => {
    contents.on("will-navigate", (event, navigationUrl) => {
        try {
            const parsedUrl = new URL(navigationUrl);
            if (parsedUrl.protocol === 'file:') return; // allow packaged file navigation
            if (allowedNavigationDestinations.includes(parsedUrl.origin)) return;
            event.preventDefault();
        } catch (e) {
            event.preventDefault();
        }
    });
});
 