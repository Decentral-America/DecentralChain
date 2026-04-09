import {
  base58Encode,
  base64Decode,
  base64Encode,
  deriveKey,
  utf8Decode,
  utf8Encode,
} from '@decentralchain/crypto';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { EventEmitter } from 'events';
import ObservableStore from 'obs-store';
import invariant from 'tiny-invariant';
import type { NetworkName } from '#networks/types';
import { DebugWallet } from '#wallets/debug';
import { EncodedSeedWallet } from '#wallets/encodedSeed';
import type { LedgerApi } from '#wallets/ledger';
import { LedgerWallet } from '#wallets/ledger';
import { PrivateKeyWallet } from '#wallets/privateKey';
import { SeedWallet } from '#wallets/seed';
import type { CreateWalletInput, WalletPrivateData } from '#wallets/types';
import type { Wallet } from '#wallets/wallet';

import { NETWORK_CONFIG } from '../constants';
import type { ExtensionStorage } from '../storage/storage';
import { CONFIG } from '../ui/appConfig';
import type { AssetInfoController } from './assetInfo';
import type { TrashController } from './trash';

/**
 * Encrypt wallet data using a pre-derived Argon2id key and XChaCha20-Poly1305.
 * Format: [24-byte nonce][ciphertext + 16-byte Poly1305 auth tag].
 * XChaCha20 uses a 192-bit nonce — safe for random generation without birthday bound.
 */
function encryptVault(input: WalletPrivateData[], key: Uint8Array): string {
  const json = JSON.stringify(input);
  const nonce = randomBytes(24);
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(utf8Encode(json));
  const blob = new Uint8Array(nonce.length + ciphertext.length);
  blob.set(nonce, 0);
  blob.set(ciphertext, nonce.length);
  return base64Encode(blob);
}

/**
 * Decrypt a vault blob using a pre-derived Argon2id key and XChaCha20-Poly1305.
 * Throws if the authentication tag is invalid (wrong key or corrupt blob).
 */
function decryptVault(vault: string, key: Uint8Array): WalletPrivateData[] {
  try {
    const bytes = base64Decode(vault);
    const nonce = bytes.subarray(0, 24);
    const ciphertext = bytes.subarray(24);
    const plaintext = xchacha20poly1305(key, nonce).decrypt(ciphertext);
    return JSON.parse(utf8Decode(plaintext)) as WalletPrivateData[];
  } catch {
    throw new Error('Invalid password');
  }
}

export class WalletController extends EventEmitter {
  #assetInfo;
  #ledger;
  /** Derived Argon2id vault key (32-byte raw). Never the password. */
  #vaultKey: Uint8Array | null | undefined;
  #setSession;
  #trashController;
  #wallets: Array<Wallet<WalletPrivateData>>;

  readonly store;

  constructor({
    assetInfo,
    extensionStorage,
    ledger,
    trash,
  }: {
    assetInfo: AssetInfoController['assetInfo'];
    extensionStorage: ExtensionStorage;
    ledger: LedgerApi;
    trash: TrashController;
  }) {
    super();

    this.store = new ObservableStore(
      extensionStorage.getInitState({
        WalletController: {
          vault: undefined as string | undefined,
          vaultPepper: undefined as string | undefined,
          vaultSalt: undefined as string | undefined,
        },
      }),
    );

    extensionStorage.subscribe(this.store);

    this.#assetInfo = assetInfo;
    this.#ledger = ledger;
    this.#setSession = extensionStorage.setSession.bind(extensionStorage);
    this.#trashController = trash;
    this.#wallets = [];

    const { vaultKeyBytes } = extensionStorage.getInitSession();

    if (vaultKeyBytes) {
      // Restore the raw key bytes from session and reload wallets without password.
      this.#vaultKey = base64Decode(vaultKeyBytes);
      this.#restoreWallets().catch(() => {
        // Corrupt session key — clear it; user must re-enter password.
        this.#vaultKey = null;
        this.#setSession({ vaultKeyBytes: null });
      });
    }
  }

  async #createWallet(input: CreateWalletInput, network: NetworkName, networkCode: string) {
    switch (input.type) {
      case 'debug':
        return new DebugWallet({
          address: input.address,
          name: input.name,
          network,
          networkCode,
        });
      case 'encodedSeed':
        return EncodedSeedWallet.create({
          encodedSeed: input.encodedSeed,
          name: input.name,
          network,
          networkCode,
        });
      case 'ledger':
        return new LedgerWallet(
          {
            address: input.address,
            id: input.id,
            name: input.name,
            network,
            networkCode,
            publicKey: input.publicKey,
          },
          this.#ledger,
          this.#assetInfo,
        );
      case 'privateKey':
        return PrivateKeyWallet.create({
          name: input.name,
          network,
          networkCode,
          privateKey: input.privateKey,
        });
      case 'seed':
        return SeedWallet.create({
          name: input.name,
          network,
          networkCode,
          seed: input.seed,
        });
    }
  }

  #setVaultKey(key: Uint8Array | null): void {
    this.#vaultKey = key;
    this.#setSession({ vaultKeyBytes: key ? base64Encode(key) : null });
  }

  #saveWallets(): void {
    invariant(this.#vaultKey);
    const vault = encryptVault(
      this.#wallets.map((wallet) => wallet.data),
      this.#vaultKey,
    );
    // Shallow-merge: preserve vaultSalt alongside vault.
    const current = this.store.getState().WalletController;
    this.store.updateState({ WalletController: { ...current, vault } });
  }

  async #restoreWallets(): Promise<void> {
    invariant(this.#vaultKey, 'Vault key required to restore wallets');

    const { vault } = this.store.getState().WalletController;

    if (!vault) return;

    const decryptedVault = decryptVault(vault, this.#vaultKey);

    this.#wallets = await Promise.all(
      decryptedVault.map((user) => this.#createWallet(user, user.network, user.networkCode)),
    );

    this.emit('updateWallets');
  }

  #getWalletsByNetwork(network: NetworkName) {
    return this.#wallets.filter((wallet) => wallet.data.network === network);
  }

  #putWalletIntoTrash(wallet: Wallet<WalletPrivateData>): void {
    invariant(this.#vaultKey);
    const data = utf8Encode(JSON.stringify(wallet.data));
    const nonce = randomBytes(24);
    const ciphertext = xchacha20poly1305(this.#vaultKey, nonce).encrypt(data);
    const blob = new Uint8Array(nonce.length + ciphertext.length);
    blob.set(nonce, 0);
    blob.set(ciphertext, nonce.length);
    this.#trashController.addItem({
      address: wallet.data.address,
      walletsData: base64Encode(blob),
    });
  }

  async addWallet(input: CreateWalletInput, network: NetworkName, networkCode: string) {
    const wallet = await this.#createWallet(input, network, networkCode);

    const foundWallet = this.#getWalletsByNetwork(network).find(
      (w) => w.data.address === wallet.data.address,
    );

    if (foundWallet) {
      return foundWallet.getAccount();
    }

    this.#wallets.push(wallet);
    this.#saveWallets();

    this.emit('addWallet', wallet);
    this.emit('updateWallets');

    return wallet.getAccount();
  }

  async batchAddWallets(
    inputs: Array<CreateWalletInput & { network: NetworkName; networkCode: string }>,
  ) {
    const newWallets = await Promise.all(
      inputs.map((input) => this.#createWallet(input, input.network, input.networkCode)),
    );

    this.#wallets.push(...newWallets);

    this.#saveWallets();

    newWallets.forEach((wallet) => {
      this.emit('addWallet', wallet);
    });

    this.emit('updateWallets');
  }

  async removeWallet(address: string, network: NetworkName) {
    const wallet = this.#getWalletsByNetwork(network).find((w) => w.data.address === address);

    if (!wallet) return;

    this.#putWalletIntoTrash(wallet);
    this.#wallets = this.#wallets.filter((w) => w !== wallet);
    this.#saveWallets();
    this.emit('removeWallet', wallet);
    this.emit('updateWallets');
  }

  async updateNetworkCode(network: NetworkName, code: string | null) {
    let changed = false;

    await Promise.all(
      this.#wallets.map(async (wallet, index) => {
        if (wallet.data.network === network && wallet.data.networkCode !== code) {
          if (!code) return;

          this.#wallets[index] = await this.#createWallet(wallet.data, wallet.data.network, code);

          changed = true;
        }
      }),
    );

    if (changed) {
      this.#saveWallets();
    }

    this.emit('updateWallets');
  }

  getAccounts() {
    return this.#wallets.map((wallet) => wallet.getAccount());
  }

  async initVault(password: string) {
    if (password.length < CONFIG.PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${CONFIG.PASSWORD_MIN_LENGTH} characters`);
    }

    const salt = randomBytes(32); // RFC 9106 §3.1: ≥128 bits; 256 bits used
    const pepper = randomBytes(32); // OWASP pepper: stored separately from vault data
    const key = await deriveKey(utf8Encode(password), salt, pepper);

    // Persist salt and pepper so future unlocks can re-derive the same key.
    // Pepper is stored separately from the vault blob: protects against offline
    // brute-force if only the vault is exfiltrated (e.g., via backup or partial leak).
    // NOTE (OWASP §pepper): OWASP recommends storing the pepper in an HSM or separate
    // secrets vault. In a browser extension, chrome.storage.local is the best available
    // option — but an attacker who exfiltrates all of chrome.storage.local obtains
    // both the vault blob and the pepper. The pepper still provides meaningful protection
    // against attacks that compromise only the vault blob (e.g., via a backup file or
    // a partial storage leak). This limitation is inherent to the browser extension model.
    const current = this.store.getState().WalletController;
    this.store.updateState({
      WalletController: {
        ...current,
        vaultPepper: base64Encode(pepper),
        vaultSalt: base64Encode(salt),
      },
    });

    this.#setVaultKey(key);
    this.#saveWallets();
  }

  async deleteVault() {
    for (const wallet of this.#wallets) this.#putWalletIntoTrash(wallet);

    this.#wallets.forEach((wallet) => {
      this.emit('removeWallet', wallet);
    });

    this.#setVaultKey(null);
    this.#wallets = [];
    this.emit('updateWallets');
    this.store.updateState({
      WalletController: { vault: undefined, vaultPepper: undefined, vaultSalt: undefined },
    });
  }

  async assertPasswordIsValid(password: string) {
    const { vault, vaultSalt, vaultPepper } = this.store.getState().WalletController;

    if (!vault || !vaultSalt) throw new Error('Vault not initialized');

    // vaultPepper may be undefined for legacy vaults (created before pepper was introduced).
    // deriveKey treats undefined pepper as no-pepper — backward compatible.
    const pepper = vaultPepper != null ? base64Decode(vaultPepper) : undefined;
    const key = await deriveKey(utf8Encode(password), base64Decode(vaultSalt), pepper);
    decryptVault(vault, key); // throws on wrong password
  }

  async newPassword(oldPassword: string, newPassword: string) {
    if (newPassword.length < CONFIG.PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${CONFIG.PASSWORD_MIN_LENGTH} characters`);
    }

    await this.assertPasswordIsValid(oldPassword);

    // Re-generate both salt AND pepper on every password change.
    // If migrating from a legacy vault (no pepper), this transparently adds pepper.
    const newSalt = randomBytes(32); // RFC 9106 §3.1: ≥128 bits; 256 bits used
    const newPepper = randomBytes(32); // OWASP pepper: rotate on password change
    const newKey = await deriveKey(utf8Encode(newPassword), newSalt, newPepper);

    const current = this.store.getState().WalletController;
    this.store.updateState({
      WalletController: {
        ...current,
        vaultPepper: base64Encode(newPepper),
        vaultSalt: base64Encode(newSalt),
      },
    });

    this.#setVaultKey(newKey);
    this.#saveWallets();
  }

  lock() {
    this.#setVaultKey(null);
    this.#wallets = [];
  }

  async unlock(password: string) {
    const { vault, vaultSalt, vaultPepper } = this.store.getState().WalletController;

    if (!vault) return;

    if (!vaultSalt) throw new Error('Vault salt missing — vault may be from an older version');

    // vaultPepper is undefined for legacy vaults — deriveKey treats it as no-pepper.
    // New vaults always have a pepper. Legacy vaults get peppered on next password change.
    const pepper = vaultPepper != null ? base64Decode(vaultPepper) : undefined;
    const key = await deriveKey(utf8Encode(password), base64Decode(vaultSalt), pepper);
    const decryptedVault = decryptVault(vault, key); // throws on wrong password

    this.#setVaultKey(key);

    this.#wallets = await Promise.all(
      decryptedVault.map((user) => this.#createWallet(user, user.network, user.networkCode)),
    );

    if (this.#wallets.some((wallet) => !wallet.data.network)) {
      const networks = Object.fromEntries(
        Object.values(NETWORK_CONFIG).map((net) => [net.networkCode, net.name]),
      );

      this.#wallets = await Promise.all(
        this.#wallets.map((wallet) => {
          const networkName = networks[wallet.data.networkCode];
          invariant(
            networkName != null,
            `wallet: unknown networkCode '${wallet.data.networkCode}' — NETWORK_CONFIG out of sync`,
          );
          return this.#createWallet(wallet.data, networkName, wallet.data.networkCode);
        }),
      );

      this.#saveWallets();
    }

    this.emit('updateWallets');
  }

  getWallet(address: string, network: NetworkName) {
    const wallet = this.#getWalletsByNetwork(network).find((w) => w.data.address === address);

    if (!wallet) throw new Error(`Wallet not found for address ${address}`);

    return wallet;
  }

  async getAccountSeed(address: string, network: NetworkName, password: string) {
    await this.assertPasswordIsValid(password);
    return this.getWallet(address, network).getSeed();
  }

  async getAccountEncodedSeed(address: string, network: NetworkName, password: string) {
    await this.assertPasswordIsValid(password);
    return this.getWallet(address, network).getEncodedSeed();
  }

  async getAccountPrivateKey(address: string, network: NetworkName, password: string) {
    await this.assertPasswordIsValid(password);
    const privateKey = await this.getWallet(address, network).getPrivateKey();
    return base58Encode(privateKey);
  }
}
