import { Adapter } from '@decentralchain/signature-adapter';
import {
  address as buildAddress,
  keyPair as buildKeyPair,
  randomSeed,
} from '@decentralchain/ts-lib-crypto';

// DCC mainnet network code byte (63 = '?'). Testnet = 33 ('!'), Stagenet = 83 ('S').
// The Angular app read this from window.DCCApp.network.code at runtime, but since
// network switching is handled by ConfigContext in the React app, we default to
// mainnet and allow callers to override via Adapter.initOptions when the active
// network changes.
const networkCode = 63;

Adapter.initOptions({ networkCode });

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
