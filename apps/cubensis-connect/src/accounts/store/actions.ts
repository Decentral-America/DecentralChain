/**
 * Accounts window action functions — replace all Redux middleware + async thunks
 * for the accounts window.
 */
import i18next from 'i18next';

import type { NetworkName } from '#networks/types';
import type { PreferencesAccount } from '#preferences/types';
import type { NewAccountState } from '#store/reducers/stateTypes';
import Background, { WalletTypes } from '#ui/services/Background';
import type { CreateWalletInput } from '#wallets/types';

import type { NotificationsLocalState } from './accountsStore';
import { accountsStore } from './accountsStore';

// ─── Helpers ────────────────────────────────────────────────────────────────

function setNotifications(update: Partial<NotificationsLocalState>): void {
  accountsStore.setState((s) => ({
    localState: {
      ...s.localState,
      notifications: { ...s.localState.notifications, ...update },
    },
  }));
}

// ─── Local state mutations ───────────────────────────────────────────────────

export function setLoading(loading: boolean): void {
  accountsStore.setState((s) => ({ localState: { ...s.localState, loading } }));
}

export function setNewAccountName(name: string | null | undefined): void {
  accountsStore.setState((s) => ({
    localState: {
      ...s.localState,
      newAccount: { ...s.localState.newAccount, name: name ?? s.localState.newAccount.name },
    },
  }));
}

export function newAccountSelect(partial: Partial<NewAccountState>): void {
  accountsStore.setState((s) => ({
    localState: {
      ...s.localState,
      newAccount: { ...s.localState.newAccount, ...partial } as NewAccountState,
    },
  }));
}

export function setNotificationSelected(value: boolean): void {
  setNotifications({ selected: value });
}

// ─── Account selection ───────────────────────────────────────────────────────

export function selectAccount(account: PreferencesAccount): void {
  const { currentNetwork, selectedAccount } = accountsStore.getState();
  accountsStore.setState({ selectedAccount: account });

  if (selectedAccount?.address !== account.address) {
    void Background.selectAccount(account.address, currentNetwork).then(() => {
      setNotificationSelected(true);
      setTimeout(() => setNotificationSelected(false), 1000);
    });
  }
}

// ─── Account management ───────────────────────────────────────────────────────

export async function createAccount(params: {
  account: { name: string } & (
    | { type: 'debug'; address: string }
    | { type: 'encodedSeed'; encodedSeed: string }
    | { type: 'ledger'; address: string; id: number; publicKey: string }
    | { type: 'privateKey'; privateKey: string }
    | { type: 'seed'; seed: string }
  );
  type: WalletTypes;
}): Promise<void> {
  const { currentNetwork, customCodes } = accountsStore.getState();
  const { NETWORK_CONFIG } = await import('../../constants');
  const networkCode = customCodes[currentNetwork] ?? NETWORK_CONFIG[currentNetwork].networkCode;

  selectAccount(await Background.addWallet(params.account, currentNetwork, networkCode));

  if (params.type !== WalletTypes.Debug) {
    Background.track({ eventType: 'addWallet', type: params.type });
  }
}

export async function batchAddAccounts(params: {
  accounts: Array<CreateWalletInput & { network: NetworkName; networkCode: string }>;
  type: WalletTypes;
}): Promise<void> {
  await Background.batchAddWallets(params.accounts);

  if (params.type !== WalletTypes.Debug) {
    Background.track({ eventType: 'addWallet', type: params.type });
  }
}

// ─── i18n sync (called from createUpdateState when locale changes) ───────────

export function syncLocale(locale: string): void {
  void i18next.changeLanguage(locale);
}
