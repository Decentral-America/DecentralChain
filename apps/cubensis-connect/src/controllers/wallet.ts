import {
  base58Encode,
  base64Decode,
  base64Encode,
  deriveSeedEncryptionKey,
  utf8Decode,
  utf8Encode,
} from '@decentralchain/crypto';
import { EventEmitter } from 'events';
import { type NetworkName } from 'networks/types';
import ObservableStore from 'obs-store';
import invariant from 'tiny-invariant';
import { DebugWallet } from 'wallets/debug';
import { EncodedSeedWallet } from 'wallets/encodedSeed';
import { type LedgerApi, LedgerWallet } from 'wallets/ledger';
import { PrivateKeyWallet } from 'wallets/privateKey';
import { SeedWallet } from 'wallets/seed';
import { type CreateWalletInput, type WalletPrivateData } from 'wallets/types';
import { type Wallet } from 'wallets/wallet';

import { NETWORK_CONFIG } from '../constants';
import { type ExtensionStorage } from '../storage/storage';
import { CONFIG } from '../ui/appConfig';
import { type AssetInfoController } from './assetInfo';
import { type TrashController } from './trash';

/**
 * Encrypt wallet data using a pre-derived AES-GCM-256 CryptoKey.
 * Format: [16-byte random salt][12-byte nonce][ciphertext + 16-byte GCM auth tag].
 * The leading 16-byte salt is not used for key derivation here (the key is pre-derived);
 * it maintains format consistency with decryptVault which reads nonce at offset 16.
 */
async function encryptVault(input: WalletPrivateData[], key: CryptoKey): Promise<string> {
  const json = JSON.stringify(input);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ iv: nonce, name: 'AES-GCM' }, key, utf8Encode(json)),
  );

  return base64Encode(Uint8Array.of(...salt, ...nonce, ...ciphertext));
}

/**
 * Decrypt a vault blob using a pre-derived AES-GCM-256 CryptoKey.
 * Throws if the authentication tag is invalid (wrong key or corrupt blob).
 */
async function decryptVault(vault: string, key: CryptoKey): Promise<WalletPrivateData[]> {
  try {
    const bytes = base64Decode(vault);
    const nonce = bytes.subarray(16, 28); // skip 16-byte salt prefix
    const ciphertext = bytes.subarray(28);

    const plaintext = new Uint8Array(
      await crypto.subtle.decrypt({ iv: nonce, name: 'AES-GCM' }, key, ciphertext),
    );

    return JSON.parse(utf8Decode(plaintext)) as WalletPrivateData[];
  } catch {
    throw new Error('Invalid password');
  }
}

export class WalletController extends EventEmitter {
  #assetInfo;
  #ledger;
  /** Derived AES-GCM-256 vault key. Never the password. */
  #vaultKey: CryptoKey | null | undefined;
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
        WalletController: { vault: undefined, vaultSalt: undefined },
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
      // Import the stored key and restore wallets without requiring the password.
      crypto.subtle
        .importKey('raw', base64Decode(vaultKeyBytes), 'AES-GCM', true, ['encrypt', 'decrypt'])
        .then((key) => {
          this.#vaultKey = key;
          return this.#restoreWallets();
        })
        .catch(() => {
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

  async #setVaultKey(key: CryptoKey | null): Promise<void> {
    this.#vaultKey = key;

    if (key) {
      const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
      this.#setSession({ vaultKeyBytes: base64Encode(raw) });
    } else {
      this.#setSession({ vaultKeyBytes: null });
    }
  }

  async #saveWallets(): Promise<void> {
    invariant(this.#vaultKey);

    const vault = await encryptVault(
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

    const decryptedVault = await decryptVault(vault, this.#vaultKey);

    this.#wallets = await Promise.all(
      decryptedVault.map((user) => this.#createWallet(user, user.network, user.networkCode)),
    );

    this.emit('updateWallets');
  }

  #getWalletsByNetwork(network: NetworkName) {
    return this.#wallets.filter((wallet) => wallet.data.network === network);
  }

  async #putWalletIntoTrash(wallet: Wallet<WalletPrivateData>): Promise<void> {
    invariant(this.#vaultKey);

    const data = utf8Encode(JSON.stringify(wallet.data));
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt({ iv: nonce, name: 'AES-GCM' }, this.#vaultKey, data),
    );

    this.#trashController.addItem({
      address: wallet.data.address,
      walletsData: base64Encode(Uint8Array.of(...nonce, ...ciphertext)),
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
    await this.#saveWallets();

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

    await this.#saveWallets();

    newWallets.forEach((wallet) => {
      this.emit('addWallet', wallet);
    });

    this.emit('updateWallets');
  }

  async removeWallet(address: string, network: NetworkName) {
    const wallet = this.#getWalletsByNetwork(network).find((w) => w.data.address === address);

    if (!wallet) return;

    await this.#putWalletIntoTrash(wallet);
    this.#wallets = this.#wallets.filter((w) => w !== wallet);
    await this.#saveWallets();
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
      await this.#saveWallets();
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

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveSeedEncryptionKey(utf8Encode(password), salt);

    // Persist salt so future password verification can re-derive the same key.
    const current = this.store.getState().WalletController;
    this.store.updateState({ WalletController: { ...current, vaultSalt: base64Encode(salt) } });

    await this.#setVaultKey(key);
    await this.#saveWallets();
  }

  async deleteVault() {
    await Promise.all(this.#wallets.map((wallet) => this.#putWalletIntoTrash(wallet)));

    this.#wallets.forEach((wallet) => {
      this.emit('removeWallet', wallet);
    });

    await this.#setVaultKey(null);
    this.#wallets = [];
    this.emit('updateWallets');
    this.store.updateState({ WalletController: { vault: undefined, vaultSalt: undefined } });
  }

  async assertPasswordIsValid(password: string) {
    const { vault, vaultSalt } = this.store.getState().WalletController;

    if (!vault || !vaultSalt) throw new Error('Vault not initialized');

    const key = await deriveSeedEncryptionKey(utf8Encode(password), base64Decode(vaultSalt));
    await decryptVault(vault, key); // throws on wrong password
  }

  async newPassword(oldPassword: string, newPassword: string) {
    if (newPassword.length < CONFIG.PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${CONFIG.PASSWORD_MIN_LENGTH} characters`);
    }

    await this.assertPasswordIsValid(oldPassword);

    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    const newKey = await deriveSeedEncryptionKey(utf8Encode(newPassword), newSalt);

    const current = this.store.getState().WalletController;
    this.store.updateState({
      WalletController: { ...current, vaultSalt: base64Encode(newSalt) },
    });

    await this.#setVaultKey(newKey);
    await this.#saveWallets();
  }

  lock() {
    void this.#setVaultKey(null);
    this.#wallets = [];
  }

  async unlock(password: string) {
    const { vault, vaultSalt } = this.store.getState().WalletController;

    if (!vault) return;

    if (!vaultSalt) throw new Error('Vault salt missing — vault may be from an older version');

    const key = await deriveSeedEncryptionKey(utf8Encode(password), base64Decode(vaultSalt));
    const decryptedVault = await decryptVault(vault, key); // throws on wrong password

    await this.#setVaultKey(key);

    this.#wallets = await Promise.all(
      decryptedVault.map((user) => this.#createWallet(user, user.network, user.networkCode)),
    );

    if (this.#wallets.some((wallet) => !wallet.data.network)) {
      const networks = Object.fromEntries(
        Object.values(NETWORK_CONFIG).map((net) => [net.networkCode, net.name]),
      );

      this.#wallets = await Promise.all(
        this.#wallets.map((wallet) =>
          this.#createWallet(
            wallet.data,
            networks[wallet.data.networkCode]!,
            wallet.data.networkCode,
          ),
        ),
      );

      await this.#saveWallets();
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
