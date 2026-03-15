/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NODE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    __ERROR_LOGGER__?: (error: Error, errorInfo: { componentStack?: string }) => void;
  }
}

export {};
