import { Adapter } from '@decentralchain/signature-adapter';
import { Seed as WavesSeed, randomSeed, address as buildAddress, keyPair as buildKeyPair, encryptSeed, decryptSeed } from '@waves/ts-lib-crypto';

// Use DCC network code (87 = 'W')
// In Angular app, this was: window.WavesApp.network.code.charCodeAt(0)
// For React app, we use the DCC mainnet default
const networkCode = (typeof window !== 'undefined' && (window as any).WavesApp?.network?.code?.charCodeAt(0)) || 63;

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
   * Matches Angular: new ds.Seed(phrase, window.WavesApp.network.code)
   * @param phrase - Seed phrase (15 words)
   * @param chainId - Network byte (default: 87 for DCC mainnet)
   */
  constructor(phrase: string, chainId?: number) {
    const networkByte = chainId || networkCode;
    
    this.phrase = phrase;
    const keyPairResult = buildKeyPair(phrase);
    this.keyPair = {
      publicKey: keyPairResult.publicKey,
      privateKey: keyPairResult.privateKey
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
   * Matches Angular: new ds.Seed(this.seed, window.WavesApp.network.code)
   * @param phrase - Existing seed phrase (15 words)
   * @param chainId - Network byte (default: 87 for DCC mainnet)
   * @returns Seed instance restored from phrase
   */
  static fromExistingPhrase(phrase: string, chainId?: number): Seed {
    return new Seed(phrase, chainId || networkCode);
  }

  /**
   * Encrypt seed phrase with password
   * @param password - Password to encrypt with
   * @param encryptionRounds - Number of encryption rounds (default: 5000)
   * @returns Encrypted seed phrase
   */
  encrypt(password: string, encryptionRounds: number = 5000): string {
    return encryptSeed(this.phrase, password, encryptionRounds);
  }

  /**
   * Decrypt encrypted seed phrase with password
   * @param encryptedPhrase - Encrypted seed phrase
   * @param password - Password to decrypt with
   * @param encryptionRounds - Number of encryption rounds (default: 5000)
   * @returns Decrypted seed phrase
   */
  static decrypt(encryptedPhrase: string, password: string, encryptionRounds: number = 5000): string {
    return decryptSeed(encryptedPhrase, password, encryptionRounds);
  }
}

