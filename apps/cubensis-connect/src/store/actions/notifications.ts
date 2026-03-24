import { createAction } from '@reduxjs/toolkit';
import { type PopupThunkAction } from 'popup/store/types';
import Background from 'ui/services/Background';

import { type NotificationsStoreItem } from '../../notifications/types';
import { setActiveNotification } from '../reducers/notifications';

export {
  clearActive as updateActiveState,
  setActiveMessage,
  setActiveNotification,
} from '../reducers/notifications';

export function deleteNotifications(
  ids: string[],
  next?: NotificationsStoreItem[],
): PopupThunkAction<Promise<void>> {
  return async (dispatch) => {
    await Background.deleteNotifications(ids);
    dispatch(setActiveNotification(next));
  };
}

// Command action — intercepted by BackgroundMW (setNotificationPerms), does not update Redux state
export const setShowNotification = createAction<{ origin: string; canUse: boolean | null }>(
  'notifications/setShowPermission',
);
