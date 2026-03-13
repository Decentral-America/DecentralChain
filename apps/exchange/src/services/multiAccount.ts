/**
 * MultiAccount Service
 * Handles encrypted multi-account management
 * EXACT PORT of Angular's src/modules/app/services/MultiAccount.js
 *
 * This service encrypts all user seed phrases and private keys using a password
 * and stores them in a single encrypted blob in localStorage.
 */
// Import crypto functions from @decentralchain/ts-lib-crypto
import {
  base58Encode,
  blake2b,
  address as buildAddress,
  publicKey as buildPublicKey,
  decryptSeed,
  encryptSeed,
  stringToBytes,
} from '@decentralchain/ts-lib-crypto';

interface UserData {
  userType: 'seed' | 'privateKey' | 'ledger';
  networkByte: number;
  seed?: string;
  id?: string;
  privateKey?: string;
  publicKey?: string;
  // Ledger-specific fields
  ledgerPath?: string; // BIP44 derivation path
  ledgerId?: string; // Address index on device
}

interface EncryptedUser {
  userType: string;
  networkByte: number;
  seed?: string | undefined;
  id?: string | undefined;
  privateKey?: string | undefined;
  publicKey: string;
  // Ledger-specific fields
  ledgerPath?: string | undefined;
  ledgerId?: string | undefined;
}

/**
 * User object returned by toList() - merges encrypted user data with metadata
 */
export interface MultiAccountUser {
  userType: string;
  networkByte: number;
  id: string | undefined;
  seed: string | undefined;
  privateKey: string | undefined;
  publicKey: string;
  address: string;
  hash: string;
  ledgerPath: string | undefined;
  ledgerId: string | undefined;
  lastLogin?: number;
  /** Spread from metadata - allows additional fields like name, settings, matcherSign */
  [key: string]: unknown;
}

interface AddUserResult {
  multiAccountData: string; // Encrypted JSON string containing all users
  multiAccountHash: string; // Blake2b hash for integrity verification
  userHash: string; // Individual user identifier hash
}

/**
 * MultiAccount Service Class
 * Manages encrypted multi-account data in memory and storage
 */
class MultiAccountService {
  private password: string | undefined;
  private rounds: number | undefined;
  private users: Record<string, EncryptedUser> = {};

  /**
   * Check if user is signed in (has decrypted data in memory)
   */
  get isSignedIn(): boolean {
    return !!this.password;
  }

  /**
   * Sign Up - Initialize new multi-account system with password
   * Called when creating the very first account
   *
   * @param password - Master password for encrypting all accounts
   * @param rounds - PBKDF2 rounds for key derivation (default 5000)
   * @returns Encrypted data and hash
   */
  signUp(
    password: string,
    rounds: number = 5000,
  ): Promise<{
    multiAccountData: string;
    multiAccountHash: string;
  }> {
    this.password = password;
    this.rounds = rounds;
    this.users = {};

    const str = JSON.stringify(this.users);
    const multiAccountHash = base58Encode(blake2b(stringToBytes(str)));
    const multiAccountData = encryptSeed(str, this.password, this.rounds);

    return Promise.resolve({
      multiAccountData,
      multiAccountHash,
    });
  }

  /**
   * Sign In - Decrypt existing multi-account data with password
   * Called when user enters password to access their accounts
   *
   * @param encryptedAccount - Encrypted JSON string from storage
   * @param password - User's master password
   * @param rounds - PBKDF2 rounds used for encryption
   * @param hash - Expected hash for verification
   * @throws Error if password is wrong or data corrupted
   */
  signIn(encryptedAccount: string, password: string, rounds: number, hash: string): Promise<void> {
    try {
      const str = decryptSeed(encryptedAccount, password, rounds);

      // Verify integrity
      if (base58Encode(blake2b(stringToBytes(str))) !== hash) {
        throw new Error('Hash does not match - data may be corrupted');
      }

      this.password = password;
      this.rounds = rounds;
      this.users = JSON.parse(str);

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Sign Out - Clear password and decrypted data from memory
   * CRITICAL: Always call this on logout to protect user data
   */
  signOut(): void {
    this.password = undefined;
    this.rounds = undefined;
    this.users = {};
  }

  /**
   * Add User - Add a new account to the encrypted multi-account system
   * THIS IS THE CRITICAL FUNCTION - encrypts seed/privateKey
   *
   * IMPORTANT: Ledger accounts do NOT have seed/privateKey
   * They only store publicKey, networkByte, and Ledger-specific fields
   *
   * @param userData - User account data (seed, privateKey, or Ledger)
   * @returns Encrypted data, hash, and user identifier
   */
  addUser(userData: UserData): Promise<AddUserResult> {
    if (!this.password || !this.rounds) {
      throw new Error('Must call signUp() or signIn() first');
    }

    // Build public key from seed, private key, or use provided publicKey (Ledger)
    let publicKey: string;

    if (userData.userType === 'ledger') {
      // Ledger: publicKey must be provided from device
      if (!userData.publicKey) {
        throw new Error('Ledger accounts must provide publicKey from device');
      }
      publicKey = userData.publicKey;
    } else if (userData.seed) {
      // Seed account
      publicKey = buildPublicKey(userData.seed);
    } else if (userData.privateKey) {
      // PrivateKey account
      publicKey = buildPublicKey({ privateKey: userData.privateKey } as unknown as string);
    } else {
      throw new Error('Must provide seed, privateKey, or publicKey');
    }

    // Generate user hash (unique identifier)
    const userHash = this.hash(userData.networkByte + publicKey);

    // Store user data (ENCRYPTED when saved to storage)
    // NOTE: Ledger accounts have NO seed/privateKey - device holds private key
    this.users[userHash] = {
      userType: userData.userType,
      networkByte: userData.networkByte,
      seed: userData.userType !== 'ledger' ? userData.seed : undefined,
      id: userData.id,
      privateKey: userData.userType !== 'ledger' ? userData.privateKey : undefined,
      publicKey,
      ledgerPath: userData.ledgerPath,
      ledgerId: userData.ledgerId,
    };

    // Encrypt all users data
    const str = JSON.stringify(this.users);
    const multiAccountHash = base58Encode(blake2b(stringToBytes(str)));
    const multiAccountData = encryptSeed(str, this.password, this.rounds);

    return Promise.resolve({
      multiAccountData,
      multiAccountHash,
      userHash,
    });
  }

  /**
   * Delete User - Remove account from encrypted multi-account system
   *
   * @param userHash - Hash identifier of user to remove
   * @returns Updated encrypted data and hash
   */
  deleteUser(userHash: string): Promise<AddUserResult> {
    if (!this.password || !this.rounds) {
      throw new Error('Must be signed in to delete user');
    }

    delete this.users[userHash];

    const str = JSON.stringify(this.users);
    const multiAccountHash = base58Encode(blake2b(stringToBytes(str)));
    const multiAccountData = encryptSeed(str, this.password, this.rounds);

    return Promise.resolve({
      multiAccountData,
      multiAccountHash,
      userHash,
    });
  }

  /**
   * To List - Convert stored user metadata to list with decrypted sensitive data
   * Merges encrypted user data (seeds/keys) with unencrypted metadata (name, settings)
   *
   * @param multiAccountUsers - User metadata from localStorage
   * @returns Array of complete user objects with decrypted data
   */
  toList(multiAccountUsers: Record<string, Record<string, unknown>>): MultiAccountUser[] {
    if (!this.isSignedIn) {
      return [];
    }

    return Object.entries(multiAccountUsers || {})
      .map(([userHash, user]) => {
        const _user = this.users[userHash];
        if (!_user) {
          return null;
        }

        return {
          ...user,
          userType: _user.userType,
          networkByte: _user.networkByte,
          id: _user.id,
          seed: _user.seed, // Decrypted seed (only in memory!)
          privateKey: _user.privateKey,
          publicKey: _user.publicKey,
          address: buildAddress(
            { publicKey: _user.publicKey },
            String.fromCharCode(_user.networkByte),
          ),
          hash: userHash,
          // Ledger-specific fields
          ledgerPath: _user.ledgerPath,
          ledgerId: _user.ledgerId,
        } satisfies MultiAccountUser;
      })
      .filter((u): u is MultiAccountUser => u != null)
      .sort((a, b) => (Number(b.lastLogin) || 0) - (Number(a.lastLogin) || 0));
  }

  /**
   * Hash - Generate Blake2b hash of string
   * Used for creating user identifiers and data integrity verification
   *
   * @param str - String to hash
   * @returns Base58-encoded Blake2b hash
   */
  hash(str: string): string {
    return base58Encode(blake2b(stringToBytes(str)));
  }

  /**
   * Change Password - Re-encrypt all account data with new password
   *
   * @param encryptedAccount - Current encrypted data
   * @param oldPassword - Current password
   * @param newPassword - New password
   * @param rounds - PBKDF2 rounds
   * @param hash - Current hash for verification
   * @returns New encrypted data with same hash
   */
  changePassword(
    encryptedAccount: string,
    oldPassword: string,
    newPassword: string,
    rounds: number,
    hash: string,
  ): Promise<{
    multiAccountData: string;
    multiAccountHash: string;
  }> {
    try {
      // Decrypt with old password
      const str = decryptSeed(encryptedAccount, oldPassword, rounds);

      // Verify integrity
      if (base58Encode(blake2b(stringToBytes(str))) !== hash) {
        throw new Error('Hash does not match');
      }

      // Re-encrypt with new password
      this.password = newPassword;
      this.rounds = rounds;
      this.users = JSON.parse(str);

      const multiAccountData = encryptSeed(str, this.password, this.rounds);

      return Promise.resolve({
        multiAccountData,
        multiAccountHash: hash, // Hash stays the same
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

/**
 * Singleton instance
 * Import and use this throughout the application
 *
 * @example
 * import { multiAccount } from '@/services/multiAccount';
 *
 * // Initialize with password
 * await multiAccount.signUp('myPassword');
 *
 * // Add a user
 * const result = await multiAccount.addUser({
 *   userType: 'seed',
 *   seed: 'word1 word2 ... word15',
 *   networkByte: 87
 * });
 *
 * // Save encrypted data
 * localStorage.setItem('multiAccountData', result.multiAccountData);
 * localStorage.setItem('multiAccountHash', result.multiAccountHash);
 */
export const multiAccount = new MultiAccountService();
