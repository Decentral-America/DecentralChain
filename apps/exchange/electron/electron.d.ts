/**
 * Electron API Type Definitions
 *
 * Type definitions for window.electron API exposed via preload script
 */

export interface ElectronAPI {
  /** Current platform (darwin, win32, linux) */
  platform: string;

  /** Version information */
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };

  /** Send one-way message to main process */
  send: (channel: string, ...args: any[]) => void;

  /** Listen for messages from main process */
  on: (channel: string, callback: (...args: any[]) => void) => () => void;

  /** Invoke main process function and get response */
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
