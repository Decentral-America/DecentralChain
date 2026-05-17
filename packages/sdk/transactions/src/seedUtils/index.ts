/**
 * @module seedUtils
 */

import { serializePrimitives } from '@decentralchain/marshall';
import {
  address,
  base16Encode,
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
