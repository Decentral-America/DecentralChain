import { describe, expect, it } from 'vitest';
import { isMainnet, publicBaseUrl } from './site';

describe('site identity', () => {
  it('derives the public explorer URL from the network', () => {
    expect(publicBaseUrl({ DCC_CHAIN_ID: '33' })).toBe('https://testnet.decentralscan.com');
    expect(publicBaseUrl({ DCC_CHAIN_ID: '83' })).toBe('https://stagenet.decentralscan.com');
    expect(publicBaseUrl({ DCC_CHAIN_ID: '63' })).toBe('https://decentralscan.com');
    expect(publicBaseUrl({})).toBe('https://decentralscan.com');
  });

  it('does not fall back to the mainnet origin for unknown chains', () => {
    expect(publicBaseUrl({ DCC_CHAIN_ID: '99' })).toBeUndefined();
    expect(publicBaseUrl({ DCC_CHAIN_ID: 'abc' })).toBeUndefined();
    expect(publicBaseUrl({ DCC_CHAIN_ID: '99', DCC_SCANNER_PUBLIC_URL: 'https://x.test' })).toBe(
      'https://x.test',
    );
  });

  it('lets an explicit public URL win and strips a trailing slash', () => {
    expect(publicBaseUrl({ DCC_CHAIN_ID: '33', DCC_SCANNER_PUBLIC_URL: 'https://x.test/' })).toBe(
      'https://x.test',
    );
  });

  it('treats only chain 63 (or no chain) as mainnet', () => {
    expect(isMainnet({ DCC_CHAIN_ID: '33' })).toBe(false);
    expect(isMainnet({ DCC_CHAIN_ID: '63' })).toBe(true);
    expect(isMainnet({})).toBe(true);
  });

  it('fails closed on a malformed chain id', () => {
    expect(isMainnet({ DCC_CHAIN_ID: 'abc' })).toBe(false);
    expect(isMainnet({ DCC_CHAIN_ID: '63abc' })).toBe(false);
    expect(isMainnet({ DCC_CHAIN_ID: '6.3' })).toBe(false);
  });
});
