/**
 * Seed utilities from @decentralchain/transactions
 * Matches Angular implementation exactly from data-service/classes/Seed.ts
 *
 * Angular implementation:
 * import { seedUtils } from '@decentralchain/transactions';
 * export const Seed = seedUtils.Seed;
 *
 * Due to Vite ESM limitations, we load the minified bundle via script tag
 * and access it from the global window object.
 */

// Type definitions for the dcc-transactions library
interface SeedKeyPair {
  publicKey: string;
  privateKey: string;
}

interface SeedInstance {
  phrase: string;
  address: string;
  keyPair: SeedKeyPair;
}

interface SeedConstructor {
  new (phrase: string, networkCode?: number): SeedInstance;
  create(words?: number): SeedInstance;
  encryptSeedPhrase(phrase: string, password: string, rounds: number): string;
  decryptSeedPhrase(encryptedPhrase: string, password: string, rounds: number): string;
}

interface SeedUtils {
  Seed: SeedConstructor;
  generateNewSeed(length?: number): string;
}

interface DCCTransactions {
  seedUtils: SeedUtils;
}

// Access the global DCCTransactions object loaded via script tag
declare global {
  interface Window {
    DCCTransactions: DCCTransactions;
  }
}

// Get seedUtils from the global object
const getDCCTransactions = (): DCCTransactions => {
  if (typeof window === 'undefined' || !window.DCCTransactions) {
    throw new Error(
      'DCCTransactions library not loaded. Ensure dcc-transactions.min.js is loaded via script tag in index.html',
    );
  }
  return window.DCCTransactions;
};

const getSeedUtils = () => {
  const dccTransactions = getDCCTransactions();
  if (!dccTransactions.seedUtils?.Seed) {
    throw new Error('seedUtils.Seed not available in DCCTransactions library');
  }
  return dccTransactions.seedUtils;
};

// Get the Seed class from the library
const SeedClass = getSeedUtils().Seed;

/**
 * Seed class for generating and managing seed phrases
 * Matches the Angular implementation exactly:
 * - Uses ds.Seed.create() for new seeds
 * - Uses new ds.Seed(phrase, networkCode) for restoration
 *
 * @example
 * // Create new seed (matches: const phrase = ds.Seed.create().phrase)
 * const seed = Seed.create();
 * // Use seed.phrase and seed.address — never log or expose seed material
 *
 * @example
 * // Restore from phrase (matches: new ds.Seed(this.seed, window.DCCApp.network.code))
 * const seed = Seed.fromExistingPhrase('word1 word2 ... word15');
 */
export class Seed {
  public readonly phrase: string;
  public readonly address: string;
  public readonly keyPair: {
    publicKey: string;
    privateKey: string;
  };

  /**
   * Constructor - creates Seed from phrase
   * Matches Angular: new ds.Seed(phrase, networkCode)
   * @param phrase - Seed phrase (15 words)
   * @param chainId - Network byte (default: from env or '?')
   */
  constructor(phrase: string, chainId?: string) {
    const networkByte = chainId || import.meta.env.VITE_NETWORK_BYTE || '?';
    const chainCode = typeof networkByte === 'string' ? networkByte.charCodeAt(0) : networkByte;
    const seedInstance = new SeedClass(phrase, chainCode);

    this.phrase = seedInstance.phrase;
    this.address = seedInstance.address;
    this.keyPair = {
      privateKey: seedInstance.keyPair.privateKey,
      publicKey: seedInstance.keyPair.publicKey,
    };
  }

  /**
   * Create a new random seed phrase
   * Matches Angular: ds.Seed.create()
   * @param words - Number of words (default: 15)
   * @returns New Seed instance with random phrase
   */
  static create(words: number = 15): Seed {
    const seedInstance = SeedClass.create(words);
    const networkByte = import.meta.env.VITE_NETWORK_BYTE || '?';
    return new Seed(seedInstance.phrase, networkByte);
  }

  /**
   * Restore seed from existing phrase
   * Matches Angular: new ds.Seed(this.seed, window.DCCApp.network.code)
   * @param phrase - Existing seed phrase (15 words)
   * @returns Seed instance restored from phrase
   */
  static fromExistingPhrase(phrase: string): Seed {
    const networkByte = import.meta.env.VITE_NETWORK_BYTE || '?';
    return new Seed(phrase, networkByte);
  }

  /**
   * Encrypt seed phrase with password
   * @param password - Password to encrypt with
   * @param encryptionRounds - Number of encryption rounds (default: 5000)
   * @returns Encrypted seed phrase
   */
  encrypt(password: string, encryptionRounds: number = 5000): string {
    return SeedClass.encryptSeedPhrase(this.phrase, password, encryptionRounds);
  }

  /**
   * Decrypt encrypted seed phrase with password
   * @param encryptedPhrase - Encrypted seed phrase
   * @param password - Password to decrypt with
   * @param encryptionRounds - Number of encryption rounds (default: 5000)
   * @returns Decrypted seed phrase
   */
  static decrypt(
    encryptedPhrase: string,
    password: string,
    encryptionRounds: number = 5000,
  ): string {
    return SeedClass.decryptSeedPhrase(encryptedPhrase, password, encryptionRounds);
  }
}

// Export utility function for generating new seed phrases
export const generateNewSeed = getSeedUtils().generateNewSeed;
