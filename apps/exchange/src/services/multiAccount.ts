/**
 * MultiAccount Service
 * Handles encrypted multi-account management
 * EXACT PORT of Angular's src/modules/app/services/MultiAccount.js
 *
 * This service encrypts all user seed phrases and private keys using a password
 * and stores them in a single encrypted blob in localStorage.
 *
 * Encryption: PBKDF2-SHA-256 (key derivation) + AES-256-GCM (authenticated
 * encryption). Uses the Web Crypto API — browser-native, zero dependencies.
 *
 * Wire format (base64):
 *   byte 0       : version = 0x01
 *   bytes 1–16   : PBKDF2 salt (16 random bytes)
 *   bytes 17–28  : AES-GCM IV (12 random bytes)
 *   bytes 29–end : AES-GCM ciphertext + 16-byte auth tag
 */
import {
  base58Encode,
  blake2b,
  address as buildAddress,
  publicKey as buildPublicKey,
  stringToBytes,
} from '@decentralchain/ts-lib-crypto';

// ---------------------------------------------------------------------------
// Web Crypto helpers — PBKDF2 key derivation + AES-256-GCM encrypt/decrypt
// ---------------------------------------------------------------------------

const ENC_VERSION = 0x01;
const SALT_LEN = 16;
const IV_LEN = 12;
// OWASP Password Storage Cheat Sheet (2026): PBKDF2-HMAC-SHA256 minimum = 600,000 iterations.
// Source: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
const MIN_PBKDF2_ITERATIONS = 600_000;

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  rounds: number,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { hash: 'SHA-256', iterations: Math.max(MIN_PBKDF2_ITERATIONS, rounds), name: 'PBKDF2', salt },
    rawKey,
    { length: 256, name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptString(plaintext: string, password: string, rounds: number): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt, rounds);
  const cipherBuf = await crypto.subtle.encrypt(
    { iv, name: 'AES-GCM' },
    key,
    new TextEncoder().encode(plaintext),
  );
  const out = new Uint8Array(1 + SALT_LEN + IV_LEN + cipherBuf.byteLength);
  out[0] = ENC_VERSION;
  out.set(salt, 1);
  out.set(iv, 1 + SALT_LEN);
  out.set(new Uint8Array(cipherBuf), 1 + SALT_LEN + IV_LEN);
  // Array.from is stack-safe for any buffer size; spread operator can overflow for large Uint8Arrays.
  return btoa(Array.from(out, (c) => String.fromCharCode(c)).join(''));
}

async function decryptString(encrypted: string, password: string, rounds: number): Promise<string> {
  const bytes = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  if (bytes[0] !== ENC_VERSION) {
    // Old OpenSSL/MD5 format starts with bytes for "Salted__" (0x53, 0x61, …).
    // That format was removed in DCC-176. Users with legacy encrypted data must
    // reset their accounts — the old encryption scheme is no longer safe.
    throw new Error(
      'Legacy encrypted data format detected (pre-DCC-176). ' +
        'Please reset your account: sign out and re-import your seed.',
    );
  }
  const salt = bytes.slice(1, 1 + SALT_LEN);
  const iv = bytes.slice(1 + SALT_LEN, 1 + SALT_LEN + IV_LEN);
  const ciphertext = bytes.slice(1 + SALT_LEN + IV_LEN);
  const key = await deriveKey(password, salt, rounds);
  const plainBuf = await crypto.subtle.decrypt({ iv, name: 'AES-GCM' }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}

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
   * @param rounds - PBKDF2 rounds for key derivation (default: OWASP minimum 600,000 for PBKDF2-HMAC-SHA256)
   * @returns Encrypted data and hash
   */
  async signUp(
    password: string,
    rounds: number = MIN_PBKDF2_ITERATIONS,
  ): Promise<{
    multiAccountData: string;
    multiAccountHash: string;
  }> {
    this.password = password;
    this.rounds = rounds;
    this.users = {};

    const str = JSON.stringify(this.users);
    const multiAccountHash = base58Encode(blake2b(stringToBytes(str)));
    const multiAccountData = await encryptString(str, this.password, this.rounds);

    return { multiAccountData, multiAccountHash };
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
  async signIn(
    encryptedAccount: string,
    password: string,
    rounds: number,
    hash: string,
  ): Promise<void> {
    const str = await decryptString(encryptedAccount, password, rounds);

    // Verify integrity
    if (base58Encode(blake2b(stringToBytes(str))) !== hash) {
      throw new Error('Hash does not match - data may be corrupted');
    }

    this.password = password;
    this.rounds = rounds;
    this.users = JSON.parse(str);
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
  async addUser(userData: UserData): Promise<AddUserResult> {
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
      // PrivateKey account: pass as TPrivateKey<string> — string extends TBinaryIn
      publicKey = buildPublicKey({ privateKey: userData.privateKey });
    } else {
      throw new Error('Must provide seed, privateKey, or publicKey');
    }

    // Generate user hash (unique identifier)
    const userHash = this.hash(userData.networkByte + publicKey);

    // Store user data (ENCRYPTED when saved to storage)
    // NOTE: Ledger accounts have NO seed/privateKey - device holds private key
    this.users[userHash] = {
      id: userData.id,
      ledgerId: userData.ledgerId,
      ledgerPath: userData.ledgerPath,
      networkByte: userData.networkByte,
      privateKey: userData.userType !== 'ledger' ? userData.privateKey : undefined,
      publicKey,
      seed: userData.userType !== 'ledger' ? userData.seed : undefined,
      userType: userData.userType,
    };

    // Encrypt all users data
    const str = JSON.stringify(this.users);
    const multiAccountHash = base58Encode(blake2b(stringToBytes(str)));
    const multiAccountData = await encryptString(str, this.password, this.rounds);

    return { multiAccountData, multiAccountHash, userHash };
  }

  /**
   * Delete User - Remove account from encrypted multi-account system
   *
   * @param userHash - Hash identifier of user to remove
   * @returns Updated encrypted data and hash
   */
  async deleteUser(userHash: string): Promise<AddUserResult> {
    if (!this.password || !this.rounds) {
      throw new Error('Must be signed in to delete user');
    }

    delete this.users[userHash];

    const str = JSON.stringify(this.users);
    const multiAccountHash = base58Encode(blake2b(stringToBytes(str)));
    const multiAccountData = await encryptString(str, this.password, this.rounds);

    return { multiAccountData, multiAccountHash, userHash };
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
          address: buildAddress(
            { publicKey: _user.publicKey },
            String.fromCharCode(_user.networkByte),
          ),
          hash: userHash,
          id: _user.id,
          ledgerId: _user.ledgerId,
          // Ledger-specific fields
          ledgerPath: _user.ledgerPath,
          networkByte: _user.networkByte,
          privateKey: _user.privateKey,
          publicKey: _user.publicKey,
          seed: _user.seed, // Decrypted seed (only in memory!)
          userType: _user.userType,
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
  async changePassword(
    encryptedAccount: string,
    oldPassword: string,
    newPassword: string,
    rounds: number,
    hash: string,
  ): Promise<{
    multiAccountData: string;
    multiAccountHash: string;
  }> {
    // Decrypt with old password
    const str = await decryptString(encryptedAccount, oldPassword, rounds);

    // Verify integrity
    if (base58Encode(blake2b(stringToBytes(str))) !== hash) {
      throw new Error('Hash does not match');
    }

    // Re-encrypt with new password
    this.password = newPassword;
    this.rounds = rounds;
    this.users = JSON.parse(str);

    const multiAccountData = await encryptString(str, this.password, this.rounds);

    return { multiAccountData, multiAccountHash: hash };
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
