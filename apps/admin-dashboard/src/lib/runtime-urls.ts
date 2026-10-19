type Env = Readonly<Record<string, string | undefined>>;

/** The public testnet explorer — the one source for scanner links (the old host no longer resolves). */
export const DEFAULT_SCANNER_URL = 'https://testnet.decentralscan.com';

export function scannerUrl(env: Env = process.env): string {
  return (env.ADMIN_DASHBOARD_SCANNER_URL?.trim() || DEFAULT_SCANNER_URL).replace(/\/+$/, '');
}

/**
 * Per-network settings the image no longer bakes in. A mainnet deploy that
 * forgot one would otherwise have run against testnet defaults.
 */
export const REQUIRED_RUNTIME_ENV = [
  'ADMIN_DASHBOARD_URL',
  'ADMIN_DASHBOARD_SCANNER_URL',
  'DCC_NODE_URL',
  'ADMIN_DASHBOARD_PG_DATABASE',
] as const;

export function missingRuntimeEnv(env: Env = process.env): string[] {
  return REQUIRED_RUNTIME_ENV.filter((name) => !env[name]?.trim());
}
