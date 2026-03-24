import { createAsyncThunk } from '@reduxjs/toolkit';
import { type CreateWalletInput } from 'wallets/types';

import { type AccountsState } from '../../accounts/store/types';
import { NETWORK_CONFIG } from '../../constants';
import { type NetworkName } from '../../networks/types';
import Background, { WalletTypes } from '../../ui/services/Background';
import { ACTION } from './constants';
import { selectAccount } from './localState';
import { updateActiveState } from './notifications';

export const deleteAllAccounts = createAsyncThunk<void, void, { state: AccountsState }>(
  'user/deleteAllAccounts',
  async (_, { dispatch }) => {
    await Background.deleteVault();

    dispatch(updateActiveState());
  },
);

export const createAccount = createAsyncThunk<
  void,
  {
    account: { name: string } & (
      | { type: 'debug'; address: string }
      | { type: 'encodedSeed'; encodedSeed: string }
      | { type: 'ledger'; address: string; id: number; publicKey: string }
      | { type: 'privateKey'; privateKey: string }
      | { type: 'seed'; seed: string }
    );
    type: WalletTypes;
  },
  { state: AccountsState }
>('user/createAccount', async ({ account, type }, { dispatch, getState }) => {
  const { currentNetwork, customCodes } = getState();

  const networkCode = customCodes[currentNetwork] || NETWORK_CONFIG[currentNetwork].networkCode;

  dispatch(selectAccount(await Background.addWallet(account, currentNetwork, networkCode)));

  if (type !== WalletTypes.Debug) {
    Background.track({ eventType: 'addWallet', type });
  }
});

export const batchAddAccounts = createAsyncThunk<
  void,
  {
    accounts: Array<CreateWalletInput & { network: NetworkName; networkCode: string }>;
    type: WalletTypes;
  },
  { state: AccountsState }
>('user/batchAddAccounts', async ({ accounts, type }) => {
  await Background.batchAddWallets(accounts);

  if (type !== WalletTypes.Debug) {
    Background.track({ eventType: 'addWallet', type });
  }
});

export const setLocale = (payload: string) => ({
  payload,
  type: ACTION.CHANGE_LNG,
});
