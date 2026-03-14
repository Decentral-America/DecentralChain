"use strict";
/**
 * Electron Main Process
 *
 * Main entry point for Electron desktop application
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const path_1 = require("path");
let mainWindow = null;
/**
 * Get window options based on display size
 */
function getWindowOptions() {
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    // Default to 80% of screen size, but clamp to reasonable bounds
    const width = Math.min(Math.max(Math.floor(screenWidth * 0.8), 1024), 1920);
    const height = Math.min(Math.max(Math.floor(screenHeight * 0.8), 768), 1080);
    // Center the window
    const x = Math.floor((screenWidth - width) / 2);
    const y = Math.floor((screenHeight - height) / 2);
    return {
        width,
        height,
        x,
        y,
        minWidth: 1024,
        minHeight: 768,
        show: false, // Don't show until ready-to-show
        backgroundColor: '#ffffff',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: (0, path_1.join)(__dirname, 'preload.js'),
        },
    };
}
/**
 * Create the main application window
 */
function createWindow() {
    mainWindow = new electron_1.BrowserWindow(getWindowOptions());
    // Load the app
    if (process.env.NODE_ENV === 'development') {
        // Development mode: Load from Vite dev server
        mainWindow.loadURL('http://localhost:5173');
        // Open DevTools in development
        mainWindow.webContents.openDevTools();
    }
    else {
        // Production mode: Load from built files
        mainWindow.loadFile((0, path_1.join)(__dirname, '../dist/index.html'));
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
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:4173',
        ];
        const urlObj = new URL(url);
        const isAllowed = allowedOrigins.some(origin => url.startsWith(origin));
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
electron_1.app.whenReady().then(() => {
    createWindow();
    // Check for updates in production
    if (process.env.NODE_ENV === 'production') {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    }
    // On macOS, re-create window when dock icon is clicked
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
/**
 * Quit when all windows are closed (except macOS)
 */
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
/**
 * Handle certificate errors for self-signed certificates (development only)
 */
if (process.env.NODE_ENV === 'development') {
    electron_1.app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        // Allow localhost certificates in development
        if (url.startsWith('https://localhost')) {
            event.preventDefault();
            callback(true);
        }
        else {
            callback(false);
        }
    });
}
/**
 * Auto-Updater Configuration
 */
// Configure auto-updater
electron_updater_1.autoUpdater.autoDownload = true; // Automatically download updates
electron_updater_1.autoUpdater.autoInstallOnAppQuit = true; // Install on quit
// Update available
electron_updater_1.autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    mainWindow?.webContents.send('app:update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
    });
});
// Update not available
electron_updater_1.autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
});
// Download progress
electron_updater_1.autoUpdater.on('download-progress', (progress) => {
    console.log(`Download progress: ${progress.percent}%`);
    mainWindow?.webContents.send('app:update-progress', {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
    });
});
// Update downloaded
electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    mainWindow?.webContents.send('app:update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
    });
});
// Error handling
electron_updater_1.autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    mainWindow?.webContents.send('app:update-error', {
        message: error.message,
    });
});
/**
 * IPC Handlers for Updates
 */
// Check for updates manually
electron_1.ipcMain.handle('app:check-for-updates', async () => {
    try {
        const result = await electron_updater_1.autoUpdater.checkForUpdates();
        return {
            success: true,
            updateInfo: result?.updateInfo,
        };
    }
    catch (error) {
        console.error('Check for updates failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
});
// Install update and restart
electron_1.ipcMain.handle('app:install-update', () => {
    electron_updater_1.autoUpdater.quitAndInstall(false, // isSilent
    true // isForceRunAfter
    );
});
// Get current version
electron_1.ipcMain.handle('app:get-version', () => {
    return electron_1.app.getVersion();
});
// Get app path
electron_1.ipcMain.handle('app:get-path', (event, name) => {
    return electron_1.app.getPath(name);
});
//# sourceMappingURL=main.js.map