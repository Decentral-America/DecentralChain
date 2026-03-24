import { type PopupThunkAction } from 'popup/store/types';
import Background from 'ui/services/Background';

import { type Message } from '../../messages/types';
import { type NotificationsStoreItem } from '../../notifications/types';
import { ACTION } from './constants';

export function deleteNotifications(
  ids: string[],
  next?: NotificationsStoreItem[],
): PopupThunkAction<Promise<void>> {
  return async (dispatch) => {
    await Background.deleteNotifications(ids);
    dispatch(setActiveNotification(next));
  };
}

export const setShowNotification = (options: { origin: string; canUse: boolean | null }) => ({
  payload: options,
  type: ACTION.NOTIFICATIONS.SET_PERMS,
});

export const setActiveNotification = (notify: NotificationsStoreItem[] | undefined) => ({
  payload: notify,
  type: ACTION.MESSAGES.SET_ACTIVE_NOTIFICATION,
});

export const setActiveMessage = (msg: Message | undefined) => ({
  payload: msg,
  type: ACTION.MESSAGES.SET_ACTIVE_MESSAGE,
});

export const updateActiveState = () => ({
  payload: null,
  type: ACTION.MESSAGES.UPDATE_ACTIVE,
});
