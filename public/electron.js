// Module to control the application lifecycle and the native browser window.
const { app, BrowserWindow, protocol, ipcMain, shell, Notification } = require("electron");
const path = require("path");
const url = require("url");
if (process.platform === 'win32')
{
    app.setAppUserModelId("BICO-Bulk Image Converter Tool");
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
     nodeIntegration: true,
     contextIsolation: false,
      // preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.setIcon(path.join(__dirname, 'logo.png'));
  const appURL = app.isPackaged
    ? url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true,
      })
    : "http://localhost:3000";
  mainWindow.loadURL(appURL);


  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }else {
    mainWindow.setMenu(null)
  }
}
 
function setupLocalFilesNormalizerProxy() {
  protocol.registerHttpProtocol(
    "file",
    (request, callback) => {
      const url = request.url.substr(8);
      callback({ path: path.normalize(`${__dirname}/${url}`) });
    },
    (error) => {
      if (error) console.error("Failed to register protocol");
    },
  );
}

function showNotification (cap) {
    new Notification({ title: cap.title, body: cap.body, icon: path.join(__dirname, "logo.png") }).show()
  }
 
app.whenReady().then(() => {

  createWindow();
  setupLocalFilesNormalizerProxy();
  ipcMain.on('open-external-link', (event, url) => {
    shell.openExternal(url);
  });
  ipcMain.on('show-notification', (event, cap)=>{
    showNotification(cap);
  });

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
 

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
 

const allowedNavigationDestinations = "https://my-electron-app.com";
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
 
    if (!allowedNavigationDestinations.includes(parsedUrl.origin)) {
      event.preventDefault();
    }
  });
});
 