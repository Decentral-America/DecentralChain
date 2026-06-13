/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NODE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    __DCC_CONFIG__?: {
      dataServiceUrl: string;
      faucetAmountDcc: number;
      faucetEnabled: boolean;
      matcherUrl: string;
      nodeUrl: string;
      recaptchaSiteKey: string;
    };
    __ERROR_LOGGER__?: (error: Error, errorInfo: { componentStack?: string }) => void;
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      ready: (cb: () => void) => void;
    };
  }
}

export {};
