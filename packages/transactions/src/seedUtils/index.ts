/**
 * @module seedUtils
 */

import { serializePrimitives } from '@decentralchain/marshall';
import {
  address,
  base16Encode,
  decryptSeed,
  encryptSeed,
  privateKey,
  publicKey,
  randomSeed,
  sha256,
} from '@decentralchain/ts-lib-crypto';

export class Seed {
  public readonly phrase: string;
  public readonly address: string;
  public readonly keyPair: {
    publicKey: string;
    privateKey: string;
  };

  constructor(phrase: string, chainId?: string) {
    if (phrase.length < 12) {
      throw new Error('Your seed length is less than allowed in config');
    }

    this.phrase = phrase;
    this.address = address(phrase, chainId);
    this.keyPair = {
      privateKey: privateKey(phrase),
      publicKey: publicKey(phrase),
    };

    Object.freeze(this);
    Object.freeze(this.keyPair);
  }

  /** @deprecated Uses legacy KDF. See `Seed.encryptSeedPhrase` deprecation. */
  public encrypt(password: string, encryptionRounds?: number) {
    return Seed.encryptSeedPhrase(this.phrase, password, encryptionRounds);
  }

  /** @deprecated Uses legacy KDF (5K SHA-256 + MD5 EVP). Migrate to V2 when available. */
  public static encryptSeedPhrase(
    seedPhrase: string,
    password: string,
    encryptionRounds = 5000,
  ): string {
    if (password && password.length < 8) {
      console.warn(
        '@decentralchain/transactions: Encryption password is shorter than 8 characters — consider using a stronger password.',
      );
    }

    if (encryptionRounds < 1000) {
      console.warn(
        '@decentralchain/transactions: Encryption rounds below 1000 — brute-force risk is elevated.',
      );
    }

    if (seedPhrase.length < 12) {
      throw new Error('The seed phrase you are trying to encrypt is too short');
    }

    return encryptSeed(seedPhrase, password, encryptionRounds);
  }

  /** @deprecated Uses legacy KDF (5K SHA-256 + MD5 EVP). Migrate to V2 when available. */
  public static decryptSeedPhrase(
    encryptedSeedPhrase: string,
    password: string,
    encryptionRounds = 5000,
  ): string {
    const wrongPasswordMessage = 'The password is wrong';

    let phrase: string;

    try {
      phrase = decryptSeed(encryptedSeedPhrase, password, encryptionRounds);
    } catch (_e) {
      throw new Error(wrongPasswordMessage, { cause: _e });
    }

    if (phrase === '' || phrase.length < 12) {
      throw new Error(wrongPasswordMessage);
    }

    return phrase;
  }

  public static create(words = 15): Seed {
    const phrase = generateNewSeed(words);
    const minimumSeedLength = 12;

    if (phrase.length < minimumSeedLength) {
      // If you see that error you should increase the number of words in the generated seed
      throw new Error(
        `The resulted seed length is less than the minimum length (${minimumSeedLength})`,
      );
    }

    return new Seed(phrase);
  }

  public static fromExistingPhrase(phrase: string): Seed {
    const minimumSeedLength = 12;

    if (phrase.length < minimumSeedLength) {
      // If you see that error you should increase the number of words or set it lower in the config
      throw new Error(
        `The resulted seed length is less than the minimum length (${minimumSeedLength})`,
      );
    }

    return new Seed(phrase);
  }
}

export function generateNewSeed(length = 15) {
  return randomSeed(length);
}

/** @deprecated Weak KDF — only 5,000 SHA-256 rounds. Use PBKDF2 (600K+) or Argon2id instead. */
export function strengthenPassword(password: string, rounds = 5000): string {
  while (rounds--) {
    const bytes = serializePrimitives.STRING(password);
    password = base16Encode(sha256(bytes));
  }
  return password;
}

/**
 * @deprecated Legacy KDF — uses 5,000 rounds of SHA-256 + MD5 EVP_BytesToKey.
 * Modern standards require 600,000+ PBKDF2 iterations or Argon2id.
 * Retained only for backward compatibility with seeds encrypted in the old format.
 * Will be removed in a future major version — migrate to `encryptSeedV2` when available.
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */
export { encryptSeed, decryptSeed };
