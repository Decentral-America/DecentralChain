import { describe, expect, it } from 'vitest';
import { DEFAULT_SCANNER_URL, missingRuntimeEnv, scannerUrl } from '../src/lib/runtime-urls';

describe('runtime URLs', () => {
  it('defaults the scanner to the live testnet explorer', () => {
    expect(DEFAULT_SCANNER_URL).toBe('https://testnet.decentralscan.com');
    expect(scannerUrl({})).toBe('https://testnet.decentralscan.com');
  });

  it('uses the configured scanner URL without a trailing slash', () => {
    expect(scannerUrl({ ADMIN_DASHBOARD_SCANNER_URL: 'https://decentralscan.com/' })).toBe(
      'https://decentralscan.com',
    );
  });

  it('lists every per-network variable that is missing', () => {
    expect(missingRuntimeEnv({ DCC_NODE_URL: 'https://n' })).toEqual([
      'ADMIN_DASHBOARD_URL',
      'ADMIN_DASHBOARD_SCANNER_URL',
      'ADMIN_DASHBOARD_PG_DATABASE',
    ]);
  });
});
