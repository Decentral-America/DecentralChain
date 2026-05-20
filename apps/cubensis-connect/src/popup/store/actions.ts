/**
 * Popup window action functions — replace all Redux middleware + async thunks.
 *
 * These are plain functions (or async functions) that update the popupStore
 * directly and/or call Background service methods. They are imported directly
 * by components instead of using a `dispatch` hook.
 */
import i18next from 'i18next';

import type { Message } from '#messages/types';
import type { NetworkName } from '#networks/types';
import type { NotificationsStoreItem } from '#notifications/types';
import type { PreferencesAccount } from '#preferences/types';
import type { NewAccountState, UiState } from '#store/reducers/stateTypes';
import Background, { WalletTypes } from '#ui/services/Background';
import type { CreateWalletInput } from '#wallets/types';

import type { ActivePopupState, NotificationsLocalState } from './popupStore';
import { popupStore } from './popupStore';

// ─── Helpers ────────────────────────────────────────────────────────────────

function setLocalState(update: Partial<NotificationsLocalState> & { loading?: boolean }): void {
  popupStore.setState((s) => ({ localState: { ...s.localState, ...update } }));
}

function setNotifications(update: Partial<NotificationsLocalState>): void {
  popupStore.setState((s) => ({
    localState: {
      ...s.localState,
      notifications: { ...s.localState.notifications, ...update },
    },
  }));
}

// ─── Local state mutations ───────────────────────────────────────────────────

export function setLoading(loading: boolean): void {
  setLocalState({ loading });
}

export function setNewAccountName(name: string | null | undefined): void {
  popupStore.setState((s) => ({
    localState: {
      ...s.localState,
      newAccount: { ...s.localState.newAccount, name: name ?? s.localState.newAccount.name },
    },
  }));
}

export function newAccountSelect(partial: Partial<NewAccountState>): void {
  popupStore.setState((s) => ({
    localState: {
      ...s.localState,
      newAccount: { ...s.localState.newAccount, ...partial } as NewAccountState,
    },
  }));
}

export function notificationChangeName(value: boolean): void {
  setNotifications({ changeName: value });
}

export function setNotificationSelected(value: boolean): void {
  setNotifications({ selected: value });
}

export function setNotificationDeleted(value: boolean): void {
  setNotifications({ deleted: value });
}

// ─── Active popup ────────────────────────────────────────────────────────────

export function updateActiveState(): void {
  popupStore.setState({ activePopup: null });
}

export function setActiveMessage(msg: Message | undefined): void {
  popupStore.setState({ activePopup: msg != null ? { msg } : null });
}

export function setActiveNotification(notify: NotificationsStoreItem[] | undefined): void {
  popupStore.setState({ activePopup: notify != null ? { notify } : null });
}

export function setActiveAuto(payload: {
  allMessages?: Message[] | undefined;
  messages: Message[];
  notifications: NotificationsStoreItem[][];
}): void {
  const current = popupStore.getState().activePopup;
  let next: ActivePopupState | null;

  if (current != null) {
    const { msg, notify } = current;
    if (msg) {
      next = {
        msg: payload.allMessages?.find((item) => item.id === msg.id) ?? payload.allMessages?.[0],
      };
    } else if (notify) {
      next = {
        notify:
          payload.notifications.find(([item]) => item?.origin === notify[0]?.origin) ??
          payload.notifications[0],
      };
    } else {
      next = null;
    }
  } else {
    next =
      payload.messages.length + payload.notifications.length > 1
        ? null
        : payload.messages.length === 1
          ? { msg: payload.messages[0] }
          : { notify: payload.notifications[0] };
  }

  popupStore.setState({ activePopup: next });
}

// ─── Background command actions ──────────────────────────────────────────────

export function setLocale(locale: string): void {
  const { currentLocale } = popupStore.getState();
  if (locale !== currentLocale) {
    Background.setCurrentLocale(locale);
  }
}

export function setIdle(type: string): void {
  Background.setIdleOptions({ type });
}

export function refreshBalances(): void {
  Background.updateCurrentAccountBalance();
}

export function setShowNotification(params: { origin: string; canUse: boolean | null }): void {
  Background.setNotificationPermissions(params);
}

export function setAddress(params: { address: string; name: string }): void {
  Background.setAddress(params.address, params.name);
}

export function setAddresses(record: Record<string, string>): void {
  Background.setAddresses(record);
}

export function removeAddress(params: { address: string }): void {
  Background.removeAddress(params.address);
}

export function setCustomNode(params: { network: NetworkName; node: string | null }): void {
  Background.setCustomNode(params.node, params.network);
}

export function setCustomCode(params: { network: NetworkName; code: string | null }): void {
  Background.setCustomCode(params.code, params.network);
}

export function setCustomMatcher(params: { network: NetworkName; matcher: string | null }): void {
  Background.setCustomMatcher(params.matcher, params.network);
}

export async function setNetwork(network: NetworkName): Promise<void> {
  await Background.setNetwork(network);
}

// ─── Account selection ───────────────────────────────────────────────────────

export function selectAccount(account: PreferencesAccount): void {
  const { currentNetwork, selectedAccount } = popupStore.getState();
  popupStore.setState({ selectedAccount: account });

  if (selectedAccount?.address !== account.address) {
    void Background.selectAccount(account.address, currentNetwork).then(() => {
      setNotificationSelected(true);
      setTimeout(() => setNotificationSelected(false), 1000);
    });
  }
}

// ─── UiState ─────────────────────────────────────────────────────────────────

export function mergeUiState(partial: Partial<UiState>): void {
  const { uiState } = popupStore.getState();
  const newState = { ...uiState, ...partial };
  popupStore.setState({ uiState: newState });
  Background.setUiState(newState);
}

// ─── Notifications management ─────────────────────────────────────────────────

export function clearMessagesStatus(): void {
  const { activePopup, messages, notifications } = popupStore.getState();
  const message = messages.find((x) => x.id !== activePopup?.msg?.id);
  if (message) {
    setActiveMessage(message);
  } else {
    setActiveNotification(notifications[0]);
  }
}

export async function deleteNotifications(
  ids: string[],
  next?: NotificationsStoreItem[],
): Promise<void> {
  await Background.deleteNotifications(ids);
  setActiveNotification(next);
}

// ─── Permissions ─────────────────────────────────────────────────────────────

let _permissionTimer: ReturnType<typeof setTimeout> | undefined;

async function _permissionOp(
  method: () => Promise<unknown>,
  setDone: (value: boolean) => void,
): Promise<void> {
  popupStore.setState((s) => ({
    permissionsUiState: { ...s.permissionsUiState, pending: true },
  }));
  try {
    await method();
    clearTimeout(_permissionTimer);
    setDone(true);
    popupStore.setState((s) => ({
      permissionsUiState: { ...s.permissionsUiState, pending: false },
    }));
    _permissionTimer = setTimeout(() => {
      setDone(false);
    }, 1000);
  } catch {
    popupStore.setState((s) => ({
      permissionsUiState: { ...s.permissionsUiState, pending: false },
    }));
  }
}

export async function allowOrigin(origin: string): Promise<void> {
  await _permissionOp(
    () => Background.allowOrigin(origin),
    (value) =>
      popupStore.setState((s) => ({
        permissionsUiState: { ...s.permissionsUiState, allowed: value },
      })),
  );
}

export async function setAutoOrigin(params: {
  origin: string;
  params: Partial<{
    type: 'allowAutoSign';
    totalAmount: string | null;
    interval: number | null;
    approved: unknown[];
  }>;
}): Promise<void> {
  await _permissionOp(
    () => Background.setAutoSign(params),
    (value) =>
      popupStore.setState((s) => ({
        permissionsUiState: { ...s.permissionsUiState, allowed: value },
      })),
  );
}

export async function disableOrigin(origin: string): Promise<void> {
  await _permissionOp(
    () => Background.disableOrigin(origin),
    (value) =>
      popupStore.setState((s) => ({
        permissionsUiState: { ...s.permissionsUiState, disallowed: value },
      })),
  );
}

export async function deleteOrigin(origin: string): Promise<void> {
  await _permissionOp(
    () => Background.deleteOrigin(origin),
    (value) =>
      popupStore.setState((s) => ({
        permissionsUiState: { ...s.permissionsUiState, deleted: value },
      })),
  );
}

// ─── Account management ───────────────────────────────────────────────────────

export async function deleteAllAccounts(): Promise<void> {
  await Background.deleteVault();
  updateActiveState();
}

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
  const { currentNetwork, customCodes } = popupStore.getState();
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

export async function deleteAccount(address: string): Promise<void> {
  const { currentNetwork } = popupStore.getState();
  await Background.removeWallet(address, currentNetwork);
  setNotificationDeleted(true);
  await new Promise<void>((resolve) => setTimeout(resolve, 1000));
  setNotificationDeleted(false);
}

// ─── i18n sync (called from createUpdateState when locale changes) ───────────

export function syncLocale(locale: string): void {
  void i18next.changeLanguage(locale);
}
