/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string;
  readonly VITE_NETWORK: string;
  readonly VITE_NETWORK_BYTE: string;
  readonly VITE_NODE_URL: string;
  readonly VITE_MATCHER_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_DATA_SERVICE_URL: string;
  readonly VITE_EXPLORER_URL: string;
  readonly VITE_DEBUG: string;
  readonly VITE_ENABLE_MOCKS: string;
  readonly VITE_SENTRY_ENABLED: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
