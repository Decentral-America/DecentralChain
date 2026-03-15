/**
 * Electron Preload Script
 *
 * Safely exposes Electron APIs to the renderer process
 */
import { contextBridge, ipcRenderer } from 'electron';

/**
 * Exposed Electron API
 *
 * This API is available to the renderer process via window.electron
 */
const electronAPI = {
  /**
   * Invoke main process function (with response)
   */
  invoke: async (channel, ...args) => {
    // Whitelist channels
    const validChannels = [
      'app:get-version',
      'app:get-path',
      'app:check-for-updates',
      'app:install-update',
    ];
    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, ...args);
    } else {
      console.warn('Invalid IPC channel:', channel);
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
  },
  /**
   * Receive message from main process
   */
  on: (channel, callback) => {
    // Whitelist channels
    const validChannels = [
      'app:update-available',
      'app:update-downloaded',
      'app:update-progress',
      'app:update-error',
    ];
    if (validChannels.includes(channel)) {
      const subscription = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    } else {
      console.warn('Invalid IPC channel:', channel);
      return () => {};
    }
  },
  /**
   * Get platform information
   */
  platform: process.platform,
  /**
   * Send message to main process
   */
  send: (channel, ...args) => {
    // Whitelist channels
    const validChannels = [
      'app:quit',
      'app:reload',
      'window:minimize',
      'window:maximize',
      'window:close',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    } else {
      console.warn('Invalid IPC channel:', channel);
    }
  },
  /**
   * Get Node.js version
   */
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
};
// Expose protected methods that allow the renderer process
// to use ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', electronAPI);
//# sourceMappingURL=preload.js.map
