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

export function setShowNotification(options: { origin: string; canUse: boolean | null }) {
  return {
    payload: options,
    type: ACTION.NOTIFICATIONS.SET_PERMS,
  };
}

export function setActiveNotification(notify: NotificationsStoreItem[] | undefined) {
  return {
    payload: notify,
    type: ACTION.MESSAGES.SET_ACTIVE_NOTIFICATION,
  };
}

export function setActiveMessage(msg: Message | undefined) {
  return {
    payload: msg,
    type: ACTION.MESSAGES.SET_ACTIVE_MESSAGE,
  };
}

export function updateActiveState() {
  return {
    payload: null,
    type: ACTION.MESSAGES.UPDATE_ACTIVE,
  };
}
