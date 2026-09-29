import { CubensisConnectAdapter } from '@decentralchain/signature-adapter';
import {
  address as buildAddress,
  keyPair as buildKeyPair,
  randomSeed,
} from '@decentralchain/ts-lib-crypto';
import { NetworkConfig } from '@/config/networkConfig';

/*
 * The chain id, from the one place that knows it.
 *
 * This was `63` — mainnet — hardcoded, with a note saying network switching was
 * ConfigContext's problem. It was not: `Seed.create()` then minted a mainnet
 * address on a testnet build while `multiAccount` stored one derived from the
 * configured byte, so the two disagreed about the same wallet. An address is
 * the one value in this app that must never be guessed, and a second source of
 * truth for the byte that produces it is a second chance to get it wrong.
 *
 * `?` (63) is mainnet, `!` (33) testnet, `S` (83) stagenet.
 */
const networkCode = NetworkConfig.networkByte;

// CubensisConnectAdapter.initOptions calls Adapter.initOptions internally too,
// so this single call covers both the base networkCode init every adapter
// needs and the Cubensis Connect wiring — no separate Adapter.initOptions call.
//
// The Cubensis Connect browser extension injects `window.CubensisConnect`
// directly (see apps/cubensis-connect/src/inpage.ts) — a complete, ready-to-use
// object matching every method CubensisConnectAdapter needs. Passing a getter
// rather than a value means the adapter re-reads the global lazily, at the
// moment a caller checks isAvailable()/getUserList() — so this works whether
// the extension has already loaded by the time this module runs, or injects
// its script slightly later.
CubensisConnectAdapter.initOptions({
  extension:
    typeof window === 'undefined'
      ? undefined
      : () => (window as unknown as { CubensisConnect?: unknown }).CubensisConnect,
  networkCode,
});

/**
 * Seed class wrapper that matches Angular implementation
 * Angular: ds.Seed.create() and new ds.Seed(phrase, networkCode)
 */
export class Seed {
  public readonly phrase: string;
  public readonly address: string;
  public readonly keyPair: {
    publicKey: string;
    privateKey: string;
  };

  /**
   * Constructor - creates Seed from existing phrase
   * Matches Angular: new ds.Seed(phrase, window.DCCApp.network.code)
   * @param phrase - Seed phrase (15 words)
   * @param chainId - Network byte (default: 63 for DCC mainnet (?))
   */
  constructor(phrase: string, chainId?: number) {
    const networkByte = chainId ?? networkCode;

    this.phrase = phrase;
    const keyPairResult = buildKeyPair(phrase);
    this.keyPair = {
      privateKey: keyPairResult.privateKey,
      publicKey: keyPairResult.publicKey,
    };
    this.address = buildAddress(this.keyPair.publicKey, networkByte);
  }

  /**
   * Create a new random seed phrase
   * Matches Angular: ds.Seed.create()
   * @param words - Number of words (default: 15)
   * @returns New Seed instance with random phrase
   */
  static create(words: number = 15): Seed {
    const phrase = randomSeed(words);
    return new Seed(phrase, networkCode);
  }

  /**
   * Restore seed from existing phrase
   * Matches Angular: new ds.Seed(this.seed, window.DCCApp.network.code)
   * @param phrase - Existing seed phrase (15 words)
   * @param chainId - Network byte (default: 63 for DCC mainnet (?))
   * @returns Seed instance restored from phrase
   */
  static fromExistingPhrase(phrase: string, chainId?: number): Seed {
    return new Seed(phrase, chainId ?? networkCode);
  }
}
