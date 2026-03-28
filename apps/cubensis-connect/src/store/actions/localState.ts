import { createAsyncThunk } from '@reduxjs/toolkit';

import type { PopupState, PopupThunkAction } from '../../popup/store/types';
import Background from '../../ui/services/Background';
import {
  setNewAccountName,
  setNewAccountSelect,
  setNotificationDeleted,
} from '../reducers/localState';
import { setActiveMessage, setActiveNotification } from './notifications';

// Re-export slice action creators under backward-compatible names
export {
  setLoading,
  setNotificationNameChanged as notificationChangeName,
} from '../reducers/localState';
export { selectAccount } from '../reducers/updateState';

export const newAccountName = setNewAccountName;
export const newAccountSelect = setNewAccountSelect;

export const deleteAccount = createAsyncThunk<void, string, { state: PopupState }>(
  'localState/deleteAccount',
  async (address, { dispatch, getState }) => {
    const { currentNetwork } = getState();

    await Background.removeWallet(address, currentNetwork);

    dispatch(setNotificationDeleted(true));
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    dispatch(setNotificationDeleted(false));
  },
);

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

// setIdle is a BackgroundMW command action — kept as a typed action creator
export { setIdle } from './network';
