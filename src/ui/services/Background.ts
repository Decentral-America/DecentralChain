import type { __BackgroundUiApiDirect } from 'background';
import type { IdentityUser } from 'controllers/IdentityController';
import type { AnalyticsEvent } from 'controllers/statistics';
import type { MessageInputOfType, MessageTx, MoneyLike } from 'messages/types';
import type { NetworkName } from 'networks/types';
import type { PreferencesAccount } from 'preferences/types';
import type { UiState } from 'store/reducers/updateState';
import type { CreateWalletInput } from 'wallets/types';

import type { IgnoreErrorsContext } from '../../constants';
import type { StorageLocalState } from '../../storage/storage';

export type BackgroundUiApi = __BackgroundUiApiDirect;

class Background {
  static instance: Background;
  background: BackgroundUiApi | undefined;
  initPromise: Promise<void>;
  updatedByUser = false;
  _connect: () => void;
  _defer: {
    resolve?: () => void;
    reject?: () => void;
    promise?: Promise<unknown>;
  };
  _lastUpdateIdle = 0;
  _tmr: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this._connect = () => undefined;
    this._defer = {};
    this.initPromise = new Promise((res, rej) => {
      this._defer.resolve = res;
      this._defer.reject = rej;
    });
    this._defer.promise = this.initPromise;
  }

  init(background: BackgroundUiApi) {
    this.background = background;
    this._connect = () => undefined;
    this._defer.resolve?.();
  }

  setConnect(connect: () => void) {
    this._connect = connect;
  }

  private async getBackground(): Promise<BackgroundUiApi> {
    await this.initPromise;
    this._connect();

    if (!this.background) {
      throw new Error('Background not initialized');
    }

    return this.background;
  }

  async getState<K extends keyof StorageLocalState>(params?: K[]) {
    const bg = await this.getBackground();
    return bg.getState(params);
  }

  async updateIdle() {
    this.updatedByUser = true;
    this._updateIdle();
  }

  async setIdleOptions(options: { type: string }) {
    const bg = await this.getBackground();
    return bg.setIdleOptions(options);
  }

  async allowOrigin(origin: string) {
    const bg = await this.getBackground();
    return bg.allowOrigin(origin);
  }

  async disableOrigin(origin: string) {
    const bg = await this.getBackground();
    return bg.disableOrigin(origin);
  }

  async deleteOrigin(origin: string) {
    const bg = await this.getBackground();
    return bg.deleteOrigin(origin);
  }

  async setAutoSign(origin: string, options: { interval: number; totalAmount: number }) {
    const bg = await this.getBackground();
    return (bg.setAutoSign as any)(origin, options);
  }

  async setNotificationPermissions(options: { origin: string; canUse: boolean | null }) {
    const bg = await this.getBackground();
    return bg.setNotificationPermissions(options);
  }

  async setCurrentLocale(lng: string): Promise<void> {
    const bg = await this.getBackground();
    return bg.setCurrentLocale(lng);
  }

  async setUiState(newUiState: UiState) {
    const bg = await this.getBackground();
    return bg.setUiState(newUiState);
  }

  async selectAccount(address: string, network: NetworkName): Promise<void> {
    const bg = await this.getBackground();
    return bg.selectAccount(address, network);
  }

  async addWallet(input: CreateWalletInput, network: NetworkName, networkCode: string) {
    const bg = await this.getBackground();
    return bg.addWallet(input, network, networkCode);
  }

  async batchAddWallets(
    inputs: Array<CreateWalletInput & { network: NetworkName; networkCode: string }>,
  ) {
    const bg = await this.getBackground();
    return bg.batchAddWallets(inputs);
  }

  async removeWallet(address: string, network: NetworkName): Promise<void> {
    const bg = await this.getBackground();
    return bg.removeWallet(address, network);
  }

  async deleteVault() {
    const bg = await this.getBackground();
    return bg.deleteVault();
  }

  async closeNotificationWindow(): Promise<void> {
    const bg = await this.getBackground();
    return bg.closeNotificationWindow();
  }

  async showTab(url: string, name: string): Promise<void> {
    const bg = await this.getBackground();
    return bg.showTab(url, name);
  }

  async closeCurrentTab(): Promise<void> {
    const bg = await this.getBackground();
    return bg.closeCurrentTab();
  }

  async lock(): Promise<void> {
    const bg = await this.getBackground();
    return bg.lock();
  }

  async unlock(password: string): Promise<void> {
    const bg = await this.getBackground();
    return bg.unlock(password);
  }

  async initVault(password: string): Promise<void> {
    const bg = await this.getBackground();
    return bg.initVault(password);
  }

  async assertPasswordIsValid(password: string) {
    const bg = await this.getBackground();
    return await bg.assertPasswordIsValid(password);
  }

  async getAccountSeed(address: string, network: NetworkName, password: string) {
    const bg = await this.getBackground();
    return bg.getAccountSeed(address, network, password);
  }

  async getAccountEncodedSeed(address: string, network: NetworkName, password: string) {
    const bg = await this.getBackground();
    return bg.getAccountEncodedSeed(address, network, password);
  }

  async getAccountPrivateKey(address: string, network: NetworkName, password: string) {
    const bg = await this.getBackground();
    return bg.getAccountPrivateKey(address, network, password);
  }

  async editWalletName(address: string, name: string, network: NetworkName) {
    const bg = await this.getBackground();
    return bg.editWalletName(address, name, network);
  }

  async newPassword(oldPassword: string, newPassword: string): Promise<void> {
    const bg = await this.getBackground();
    return bg.newPassword(oldPassword, newPassword);
  }

  async clearMessages(): Promise<void> {
    const bg = await this.getBackground();
    return bg.clearMessages();
  }

  async approve(messageId: string) {
    const bg = await this.getBackground();
    return bg.approve(messageId);
  }

  async reject(messageId: string, forever = false): Promise<void> {
    const bg = await this.getBackground();
    return bg.reject(messageId, forever);
  }

  async updateTransactionFee(messageId: string, fee: MoneyLike) {
    const bg = await this.getBackground();
    return bg.updateTransactionFee(messageId, fee);
  }

  async setNetwork(network: NetworkName): Promise<void> {
    const bg = await this.getBackground();
    return bg.setNetwork(network);
  }

  async setCustomNode(url: string | null, network: NetworkName) {
    const bg = await this.getBackground();
    return bg.setCustomNode(url, network);
  }

  async setCustomCode(code: string | null, network: NetworkName) {
    const bg = await this.getBackground();
    return bg.setCustomCode(code, network);
  }

  async setCustomMatcher(url: string | null, network: NetworkName) {
    const bg = await this.getBackground();
    return bg.setCustomMatcher(url, network);
  }

  async assetInfo(assetId: string) {
    const bg = await this.getBackground();
    return bg.assetInfo(assetId || 'WAVES');
  }

  async updateAssets(assetIds: string[], options: { ignoreCache?: boolean } = {}) {
    const bg = await this.getBackground();
    return await bg.updateAssets(assetIds, options);
  }

  async updateUsdPricesByAssetIds(assetIds: string[]) {
    const bg = await this.getBackground();
    return await bg.updateUsdPricesByAssetIds(assetIds);
  }

  async setAddress(address: string, name: string): Promise<void> {
    const bg = await this.getBackground();
    return bg.setAddress(address, name);
  }

  async setAddresses(addresses: Record<string, string>): Promise<void> {
    const bg = await this.getBackground();
    return bg.setAddresses(addresses);
  }

  async removeAddress(address: string): Promise<void> {
    const bg = await this.getBackground();
    return bg.removeAddress(address);
  }

  async toggleAssetFavorite(assetId: string): Promise<void> {
    const bg = await this.getBackground();
    return bg.toggleAssetFavorite(assetId);
  }

  async deleteNotifications(ids: string[]) {
    const bg = await this.getBackground();
    return bg.deleteNotifications(ids);
  }

  async track(event: AnalyticsEvent) {
    const bg = await this.getBackground();
    return bg.track(event);
  }

  async updateCurrentAccountBalance() {
    const bg = await this.getBackground();
    return await bg.updateCurrentAccountBalance();
  }

  async updateOtherAccountsBalances() {
    const bg = await this.getBackground();
    return await bg.updateOtherAccountsBalances();
  }

  async signTransaction(account: PreferencesAccount, tx: MessageTx) {
    const bg = await this.getBackground();
    return bg.signTransaction(account, tx);
  }

  async broadcastTransaction(tx: MessageTx) {
    const bg = await this.getBackground();
    return bg.broadcastTransaction(tx);
  }

  async signAndPublishTransaction(data: MessageInputOfType<'transaction'>['data']) {
    const bg = await this.getBackground();
    return bg.signAndPublishTransaction(data);
  }

  async getExtraFee(address: string, network: NetworkName) {
    const bg = await this.getBackground();
    return bg.getExtraFee(address, network);
  }

  async getMessageById(messageId: string) {
    const bg = await this.getBackground();
    return bg.getMessageById(messageId);
  }

  async shouldIgnoreError(context: IgnoreErrorsContext, message: string) {
    const bg = await this.getBackground();
    return bg.shouldIgnoreError(context, message);
  }

  async identityRestore(userId: string): Promise<void> {
    const bg = await this.getBackground();
    return (await bg.identityRestore(userId)) as any;
  }

  async identityUpdate(): Promise<void> {
    const bg = await this.getBackground();
    return bg.identityUpdate();
  }

  async identityClear(): Promise<void> {
    const bg = await this.getBackground();
    return bg.identityClear();
  }

  async identitySignIn(username: string, password: string) {
    const bg = await this.getBackground();
    return bg.identitySignIn(username, password);
  }

  async identityConfirmSignIn(code: string) {
    const bg = await this.getBackground();
    return bg.identityConfirmSignIn(code);
  }

  async identityUser(): Promise<IdentityUser> {
    const bg = await this.getBackground();
    return (await bg.identityUser()) as any;
  }

  async ledgerSignResponse(requestId: string, error: unknown): Promise<void>;
  async ledgerSignResponse(requestId: string, error: null, signature: string): Promise<void>;
  async ledgerSignResponse(requestId: string, error: unknown, signature?: string) {
    const bg = await this.getBackground();
    return bg.ledgerSignResponse(
      requestId,
      error && (error as any).message ? (error as any).message : null,
      signature,
    );
  }

  async _updateIdle() {
    const now = Date.now();

    if (this._tmr != null) {
      clearTimeout(this._tmr);
    }

    this._tmr = setTimeout(() => this._updateIdle(), 4000);

    if (!this.updatedByUser || now - this._lastUpdateIdle < 4000) {
      return null;
    }

    this.updatedByUser = false;
    this._lastUpdateIdle = now;
    const bg = await this.getBackground();
    return bg.updateIdle();
  }
}

export default new Background();

export enum WalletTypes {
  New = 'new',
  Seed = 'seed',
  EncodedSeed = 'encoded_seed',
  PrivateKey = 'private_key',
  Wx = 'wx',
  Ledger = 'ledger',
  Keystore = 'keystore',
  KeystoreWx = 'keystore_wx',
  Debug = 'debug',
}
