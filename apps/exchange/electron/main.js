/**
 * Electron Main Process
 *
 * Main entry point for Electron desktop application
 */

import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { autoUpdater } from 'electron-updater';

let mainWindow = null;
/**
 * Get window options based on display size
 */
function getWindowOptions() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  // Default to 80% of screen size, but clamp to reasonable bounds
  const width = Math.min(Math.max(Math.floor(screenWidth * 0.8), 1024), 1920);
  const height = Math.min(Math.max(Math.floor(screenHeight * 0.8), 768), 1080);
  // Center the window
  const x = Math.floor((screenWidth - width) / 2);
  const y = Math.floor((screenHeight - height) / 2);
  return {
    backgroundColor: '#ffffff',
    height,
    minHeight: 768,
    minWidth: 1024,
    show: false, // Don't show until ready-to-show
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(import.meta.dirname, 'preload.js'),
      sandbox: true,
    },
    width,
    x,
    y,
  };
}
/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow(getWindowOptions());
  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // Development mode: Load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode: Load from built files
    mainWindow.loadFile(join(import.meta.dirname, '../dist/index.html'));
  }
  // Show window when ready to prevent flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:4173'];
    const urlObj = new URL(url);
    const isAllowed = allowedOrigins.some((origin) => url.startsWith(origin));
    if (!isAllowed && urlObj.protocol !== 'file:') {
      event.preventDefault();
      console.warn('Navigation blocked to:', url);
    }
  });
  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}
/**
 * App ready handler
 */
app.whenReady().then(() => {
  createWindow();
  // Check for updates in production
  if (process.env.NODE_ENV === 'production') {
    autoUpdater.checkForUpdatesAndNotify();
  }
  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
/**
 * Quit when all windows are closed (except macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
/**
 * Handle certificate errors for self-signed certificates (development only)
 */
if (process.env.NODE_ENV === 'development') {
  app.on('certificate-error', (event, _webContents, url, _error, _certificate, callback) => {
    // Allow localhost certificates in development
    if (url.startsWith('https://localhost')) {
      event.preventDefault();
      callback(true);
    } else {
      callback(false);
    }
  });
}
/**
 * Auto-Updater Configuration
 */
// Configure auto-updater
autoUpdater.autoDownload = true; // Automatically download updates
autoUpdater.autoInstallOnAppQuit = true; // Install on quit
// Update available
autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('app:update-available', {
    releaseDate: info.releaseDate,
    releaseNotes: info.releaseNotes,
    version: info.version,
  });
});
// Update not available
autoUpdater.on('update-not-available', (_info) => {});
// Download progress
autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('app:update-progress', {
    percent: Math.round(progress.percent),
    total: progress.total,
    transferred: progress.transferred,
  });
});
// Update downloaded
autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('app:update-downloaded', {
    releaseDate: info.releaseDate,
    version: info.version,
  });
});
// Error handling
autoUpdater.on('error', (error) => {
  console.error('Auto-updater error:', error);
  mainWindow?.webContents.send('app:update-error', {
    message: error.message,
  });
});
/**
 * IPC Handlers for Updates
 */
// Check for updates manually
ipcMain.handle('app:check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      success: true,
      updateInfo: result?.updateInfo,
    };
  } catch (error) {
    console.error('Check for updates failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    };
  }
});
// Install update and restart
ipcMain.handle('app:install-update', () => {
  autoUpdater.quitAndInstall(
    false, // isSilent
    true,
  );
});
// Get current version
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});
// Get app path
ipcMain.handle('app:get-path', (_event, name) => {
  return app.getPath(name);
});
//# sourceMappingURL=main.js.map
