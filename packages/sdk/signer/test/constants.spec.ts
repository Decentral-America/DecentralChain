import { DEFAULT_OPTIONS } from '../src/constants';
import { MAINNET_NODE_URL, TESTNET_NODE_URL } from '../src/index';
import { SignerOptionsError } from '../src/SignerError';

describe('default node URLs', () => {
  it('defaults to the public mainnet node (nodes.decentralchain.io does not resolve)', () => {
    expect(DEFAULT_OPTIONS.NODE_URL).toBe('https://mainnet-node.decentralchain.io');
    expect(MAINNET_NODE_URL).toBe(DEFAULT_OPTIONS.NODE_URL);
  });

  it('exports the public testnet node URL', () => {
    expect(TESTNET_NODE_URL).toBe('https://testnet-node.decentralchain.io');
  });
});

describe('error help link', () => {
  it('points at the package directory that exists in the monorepo', () => {
    const { message } = new SignerOptionsError(['NODE_URL']);
    expect(message).toContain(
      'https://github.com/Decentral-America/DecentralChain/tree/main/packages/sdk/signer#error-codes',
    );
  });
});
