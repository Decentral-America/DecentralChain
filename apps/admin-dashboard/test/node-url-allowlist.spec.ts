import { describe, expect, it } from 'vitest';
import { isAllowedNodeUrl } from '../src/lib/nodeUrlAllowlist';

const allow = {
  ADMIN_DASHBOARD_ALLOWED_NODE_URLS: 'https://testnet-node.decentralchain.io',
  NODE_ENV: 'production',
};

describe('isAllowedNodeUrl', () => {
  it('accepts an allowlisted origin, with or without a path', () => {
    expect(isAllowedNodeUrl('https://testnet-node.decentralchain.io', allow)).toBe(true);
    expect(isAllowedNodeUrl('https://testnet-node.decentralchain.io/addresses', allow)).toBe(true);
  });

  it('rejects other hosts, look-alikes and internal addresses', () => {
    expect(isAllowedNodeUrl('https://evil.test', allow)).toBe(false);
    expect(isAllowedNodeUrl('https://testnet-node.decentralchain.io.evil.test', allow)).toBe(false);
    expect(isAllowedNodeUrl('http://127.0.0.1:6869', allow)).toBe(false);
    expect(isAllowedNodeUrl('not a url', allow)).toBe(false);
  });

  it('fails closed in production when no allowlist is configured', () => {
    expect(
      isAllowedNodeUrl('https://testnet-node.decentralchain.io', { NODE_ENV: 'production' }),
    ).toBe(false);
  });
});
