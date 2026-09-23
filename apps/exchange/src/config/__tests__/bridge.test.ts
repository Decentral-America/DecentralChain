/**
 * Bridge configuration.
 *
 * The constants are asserted literally. That looks tautological, but these are
 * live mainnet addresses — a typo in one sends real funds to an address nobody
 * controls, and nothing else in the codebase would catch it. Pinning them here
 * means a change has to be deliberate.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  API_BASE,
  BLOCKED_TOKEN_NAMES,
  BRIDGE_CONFIG_PDA,
  DCC_ADDRESS_BYTES,
  DCC_BRIDGE_CONTRACT,
  DCC_CHAIN_ID_CHAR,
  NATIVE_VAULT_PDA,
  RECIPIENT_FIELD_BYTES,
  SOLANA_PROGRAM_ID,
  USER_STATE_NONCE_OFFSET,
  WITHDRAW_FEE_RATE,
  WITHDRAW_TX_FEE,
} from '@/config/bridge';

describe('bridge constants', () => {
  it('pins the live mainnet addresses', () => {
    expect(SOLANA_PROGRAM_ID).toBe('9yJDb6VyjDHmQC7DLADDdLFm9wxWanXRM5x9SdZ3oVkF');
    expect(BRIDGE_CONFIG_PDA).toBe('Fn4CxJ47wbTy4cuGZBf1a1p9ncAfWrjgjpqcdVR3eY1M');
    expect(NATIVE_VAULT_PDA).toBe('A2CMs9oPjSW46NvQDKFDqBqxj9EMvoJbTKkJJP9WK96U');
    expect(DCC_BRIDGE_CONTRACT).toBe('3DhoNpsnwnv4kgnQbjzYxL9MsSo2bQ4qvLH');
    expect(API_BASE).toBe('https://api-production-c9a68.up.railway.app/api/v1');
  });

  it('targets mainnet, byte 63', () => {
    expect(DCC_CHAIN_ID_CHAR).toBe('?');
    expect(DCC_CHAIN_ID_CHAR.charCodeAt(0)).toBe(63);
  });

  it('states the address layout the contract expects', () => {
    // version(1) + chainId(1) + hash(20) + checksum(4)
    expect(DCC_ADDRESS_BYTES).toBe(1 + 1 + 20 + 4);
    expect(RECIPIENT_FIELD_BYTES).toBe(32);
    expect(DCC_ADDRESS_BYTES).toBeLessThan(RECIPIENT_FIELD_BYTES);
  });

  it('carries the fees the user pays on withdrawal', () => {
    expect(WITHDRAW_TX_FEE).toBe(900_000); // 0.009 DCC
    expect(WITHDRAW_FEE_RATE).toBe(0.0025); // 0.25%
  });

  it('reads the nonce from UserState byte 40', () => {
    expect(USER_STATE_NONCE_OFFSET).toBe(40);
  });

  it('blocks the three assets whose raw limits make them unusable', () => {
    // Bitcoin and cbBTC: the uniform raw minimum is ~0.01 BTC at 8 decimals.
    // BONK: the uniform raw maximum caps it at ~283 tokens.
    // GET /tokens reports all three as enabled, so the API will not filter them.
    expect(BLOCKED_TOKEN_NAMES).toContain('Bitcoin');
    expect(BLOCKED_TOKEN_NAMES).toContain('cbBTC');
    expect(BLOCKED_TOKEN_NAMES).toContain('BONK');
  });

  it('uses the name the API returns, not a ticker', () => {
    // Verified live: GET /tokens calls it "Bitcoin". A blocklist entry of
    // 'BTC' matches nothing, and the asset reaches users looking depositable.
    expect(BLOCKED_TOKEN_NAMES).not.toContain('BTC');
  });

  it('does not block the four assets the API already filters', () => {
    // DAI, tBTC, PYUSD and PUMP are disabled on chain; GET /tokens omits them
    // within 30s. Listing them here would duplicate a source of truth that
    // already updates itself.
    for (const symbol of ['DAI', 'tBTC', 'PYUSD', 'PUMP']) {
      expect(BLOCKED_TOKEN_NAMES).not.toContain(symbol);
    }
  });
});

describe('API base', () => {
  it('keeps the canonical API address pinned', () => {
    expect(API_BASE).toBe('https://api-production-c9a68.up.railway.app/api/v1');
  });

  it('routes through the dev proxy in development', async () => {
    // CORS withholds the response from any origin the API does not allowlist,
    // which is every local one. The dev server forwards instead — Node to
    // Railway, no browser, no CORS. Vitest reports DEV, so this is the branch
    // under test here.
    const { API_CLIENT_BASE } = await import('@/config/bridge');

    expect(API_CLIENT_BASE).toBe('/bridge-api/api/v1');
    expect(API_CLIENT_BASE.startsWith('http')).toBe(false);
  });

  it('calls the API directly in production', async () => {
    // The proxy is dev-only, so a deployed build still needs its origin on
    // ALLOWED_ORIGINS. Local dev working proves nothing about that.
    vi.stubEnv('DEV', false);
    vi.resetModules();

    const { API_CLIENT_BASE } = await import('@/config/bridge');

    expect(API_CLIENT_BASE).toBe('https://api-production-c9a68.up.railway.app/api/v1');

    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

describe('Solana RPC endpoint', () => {
  it('routes through the dev proxy in the browser during development', async () => {
    // Solana's public RPC answers server requests but returns 403 to anything
    // carrying a browser origin. The dev server forwards with Origin and
    // Referer stripped, which is what actually makes it work — proxying alone
    // was not enough.
    const { SOLANA_RPC_CLIENT_URL } = await import('@/config/bridge');

    expect(SOLANA_RPC_CLIENT_URL).toMatch(/\/solana-rpc$/);
    // web3.js parses this with `new URL()`, so a bare path would throw.
    expect(() => new URL(SOLANA_RPC_CLIENT_URL)).not.toThrow();
  });

  it('connects directly in production', async () => {
    // A domain-restricted Helius key serves browsers, so no proxy is needed —
    // and none exists in a static build. Which means a key that is missing or
    // restricted to the wrong domain fails only once deployed.
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_SOLANA_RPC_URL', 'https://mainnet.helius-rpc.com/?api-key=abc');
    vi.resetModules();

    const { SOLANA_RPC_CLIENT_URL } = await import('@/config/bridge');

    expect(SOLANA_RPC_CLIENT_URL).toBe('https://mainnet.helius-rpc.com/?api-key=abc');

    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

describe('network gating', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each([
    ['testnet', false],
    ['stagenet', false],
    ['mainnet', true],
  ])('on %s the bridge is offered: %s', async (network, expected) => {
    // Every address in this module is a mainnet address and none of them
    // derive from VITE_NETWORK, so an ungated bridge hands a test-chain user
    // the mainnet contracts. Testnet deploy 33538817789 shipped exactly that.
    vi.stubEnv('VITE_NETWORK', network);
    vi.resetModules();

    const { BRIDGE_SUPPORTED } = await import('@/config/bridge');

    expect(BRIDGE_SUPPORTED).toBe(expected);
  });

  it('stays closed when VITE_NETWORK is unset', async () => {
    // Absent config must not read as mainnet — the gate fails closed.
    vi.stubEnv('VITE_NETWORK', '');
    vi.resetModules();

    const { BRIDGE_SUPPORTED } = await import('@/config/bridge');

    expect(BRIDGE_SUPPORTED).toBe(false);
  });
});

describe('required build-time values', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reads the RPC URL when it is set', async () => {
    vi.stubEnv('VITE_SOLANA_RPC_URL', 'https://mainnet.helius-rpc.com/?api-key=abc');
    vi.resetModules();

    const { SOLANA_RPC_URL } = await import('@/config/bridge');

    expect(SOLANA_RPC_URL).toBe('https://mainnet.helius-rpc.com/?api-key=abc');
  });

  it('throws rather than falling back when the RPC URL is missing', async () => {
    // The failure this prevents: Vite inlines env at build time, a missing
    // value takes the source default, and the default ships. The reference
    // implementation shipped http://127.0.0.1:8899 to production this way and
    // every deposit failed for months with no error anywhere.
    vi.stubEnv('VITE_SOLANA_RPC_URL', '');
    vi.resetModules();

    await expect(import('@/config/bridge')).rejects.toThrow(/VITE_SOLANA_RPC_URL is required/);
  });
});
