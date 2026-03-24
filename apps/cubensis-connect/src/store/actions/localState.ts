import { createAsyncThunk } from '@reduxjs/toolkit';
import { type PopupState, type PopupThunkAction } from '../../popup/store/types';
import { type PreferencesAccount } from '../../preferences/types';
import Background from '../../ui/services/Background';
import { type NewAccountState } from '../reducers/stateTypes';
import { ACTION } from './constants';
import { setActiveMessage, setActiveNotification } from './notifications';

export const newAccountName = (payload: string | null | undefined) => ({
  payload,
  type: ACTION.NEW_ACCOUNT_NAME,
});

export const newAccountSelect = (payload: NewAccountState) => ({
  payload,
  type: ACTION.NEW_ACCOUNT_SELECT,
});

export const selectAccount = (payload: PreferencesAccount) => ({
  payload,
  type: ACTION.SELECT_ACCOUNT,
});

const notificationDelete = (payload: boolean) => ({
  payload,
  type: ACTION.NOTIFICATION_DELETE,
});

export const deleteAccount = createAsyncThunk<void, string, { state: PopupState }>(
  'localState/deleteAccount',
  async (address, { dispatch, getState }) => {
    const { currentNetwork } = getState();

    await Background.removeWallet(address, currentNetwork);

    dispatch(notificationDelete(true));
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    dispatch(notificationDelete(false));
  },
);

export const setLoading = (payload: boolean) => ({
  payload,
  type: ACTION.SET_LOADING,
});

export const notificationSelect = (payload: boolean) => ({
  payload,
  type: ACTION.NOTIFICATION_SELECT,
});

export const notificationChangeName = (payload: boolean) => ({
  payload,
  type: ACTION.NOTIFICATION_NAME_CHANGED,
});

export function clearMessagesStatus(): PopupThunkAction<void> {
  return (dispatch, getState) => {
    const { activePopup, messages, notifications } = getState();

    const message = messages.find((x) => x.id !== activePopup?.msg?.id);

    if (message) {
      dispatch(setActiveMessage(message));
    } else {
      dispatch(setActiveNotification(notifications[0]));
    }
  };
}

export const setIdle = (payload: string) => ({
  payload,
  type: ACTION.REMOTE_CONFIG.SET_IDLE,
});
