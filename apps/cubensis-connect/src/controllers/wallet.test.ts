/**
 * Unit tests for WalletController vault cryptography.
 *
 * These tests exercise PBKDF2-SHA-256 key derivation, AES-GCM-256 encryption,
 * password verification, and vault format correctness — all without any
 * WebExtension runtime or DOM.
 *
 * Run with:
 *   pnpm nx run cubensis-connect:test:unit
 */
import { base64Decode } from '@decentralchain/crypto';
import { describe, expect, it, vi } from 'vitest';

import { WalletController } from './wallet';

// ---------------------------------------------------------------------------
// Minimal in-memory double for ExtensionStorage
// ---------------------------------------------------------------------------

function makeExtensionStorage(sessionOverride?: { vaultKeyBytes?: string | null }) {
  const local: Record<string, unknown> = {
    WalletController: { vault: undefined, vaultSalt: undefined },
  };
  const session: Record<string, unknown> = { ...sessionOverride };

  return {
    getInitSession: () => session,
    getInitState: (defaults: Record<string, unknown>) => {
      // Merge stored local state over defaults, like the real implementation.
      const init: Record<string, unknown> = { ...defaults };
      for (const key of Object.keys(defaults)) {
        if (Object.hasOwn(local, key)) init[key] = local[key];
      }
      return init;
    },
    /** Capture session updates so tests can inspect vaultKeyBytes. */
    setSession: vi.fn(async (state: Record<string, unknown>) => {
      Object.assign(session, state);
    }),
    /** No-op — prevents real Browser.storage.local calls in unit tests. */
    subscribe: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Minimal stubs for unused WalletController dependencies
// ---------------------------------------------------------------------------

const stubLedger = {} as Parameters<typeof WalletController.prototype.constructor>[0]['ledger'];
const stubAssetInfo = vi.fn();
const stubTrash = {
  addItem: vi.fn(),
};

function makeController(sessionOverride?: { vaultKeyBytes?: string | null }) {
  const extensionStorage = makeExtensionStorage(sessionOverride);
  const controller = new WalletController({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assetInfo: stubAssetInfo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extensionStorage: extensionStorage as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ledger: stubLedger as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trash: stubTrash as any,
  });
  return { controller, extensionStorage };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WalletController vault cryptography', () => {
  it('round-trip: initVault allows correct password verification', async () => {
    const { controller } = makeController();
    await controller.initVault('correct-horse-battery-staple');
    // Should resolve without throwing.
    await expect(
      controller.assertPasswordIsValid('correct-horse-battery-staple'),
    ).resolves.toBeUndefined();
  });

  it('wrong password: assertPasswordIsValid throws on incorrect password', async () => {
    const { controller } = makeController();
    await controller.initVault('my-strong-password');
    await expect(controller.assertPasswordIsValid('wrong-password')).rejects.toThrow(
      'Invalid password',
    );
  });

  it('corrupt vault: flipping a ciphertext byte causes decryption failure', async () => {
    const { controller } = makeController();
    await controller.initVault('test-password');

    // Corrupt the last byte of the vault blob to break the GCM auth tag.
    const vaultState = controller.store.getState().WalletController;
    const vault = vaultState.vault;
    expect(vault).toBeDefined();

    // Flip the last character in the base64 string (safe ASCII manipulation).
    const corrupted = vault!.slice(0, -1) + (vault!.at(-1) === 'A' ? 'B' : 'A');
    // Manually overwrite the vault in the store to simulate storage corruption.
    controller.store.updateState({
      WalletController: { ...vaultState, vault: corrupted },
    });

    await expect(controller.assertPasswordIsValid('test-password')).rejects.toThrow(
      'Invalid password',
    );
  });

  it('key derivation: same salt produces deterministic key (same assertion outcome)', async () => {
    // Two controllers initialised with the same password will independently
    // derive equivalent keys.  Because the salt is random per initVault call we
    // cannot cross-check keys directly, but we CAN assert that re-init with
    // the same stored vaultSalt always succeeds with the original password.
    const { controller } = makeController();
    await controller.initVault('deterministic-password');

    // Calling assertPasswordIsValid re-derives the key from the stored salt and
    // must produce the same AES key — confirmed by successful decryption.
    await expect(
      controller.assertPasswordIsValid('deterministic-password'),
    ).resolves.toBeUndefined();
    // A second call must also succeed (idempotent derivation).
    await expect(
      controller.assertPasswordIsValid('deterministic-password'),
    ).resolves.toBeUndefined();
  });

  it('corrupt session key: constructor recovers gracefully, leaving vault locked', async () => {
    // Supplying an invalid vaultKeyBytes in the session simulates a corrupt
    // or migrated session (e.g. after extension update clears session storage).
    // The wallet should not throw and should remain locked until unlocked.

    // Use a string that base64-decodes to an invalid AES-GCM key length.
    const corruptKeyBytes = btoa('not-a-valid-256-bit-key');
    const { controller } = makeController({ vaultKeyBytes: corruptKeyBytes });

    // Allow the async importKey → catch path to settle.
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });

    // The wallet should report no accounts (locked / no wallets restored).
    expect(controller.getAccounts()).toHaveLength(0);
  });

  it('salt size: initVault stores a 32-byte PBKDF2 salt (NIST SP 800-132)', async () => {
    const { controller } = makeController();
    await controller.initVault('salt-size-check');

    const { vaultSalt } = controller.store.getState().WalletController;
    expect(vaultSalt).toBeDefined();

    const saltBytes = base64Decode(vaultSalt!);
    expect(saltBytes.byteLength).toBe(32);
  });
});
