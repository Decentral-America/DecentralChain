import { createReducer } from '@reduxjs/toolkit';

import { type Message } from '../../messages/types';
import { type NotificationsStoreItem } from '../../notifications/types';
import { ACTION } from '../actions/constants';
import { typedPayload } from '../types';

export const notifications = createReducer([] as NotificationsStoreItem[][], (builder) => {
  builder.addCase(ACTION.NOTIFICATIONS.SET, (_, action) => typedPayload(action));
});

interface ActivePopupState {
  msg?: Message | undefined;
  notify?: NotificationsStoreItem[] | undefined;
}

export const activePopup = createReducer(null as ActivePopupState | null, (builder) => {
  builder
    .addCase(ACTION.MESSAGES.SET_ACTIVE_AUTO, (state, action): ActivePopupState | null => {
      const payload = typedPayload(action);

      if (state != null) {
        const { msg, notify } = state;

        if (msg) {
          return {
            msg:
              payload.allMessages?.find((item) => item.id === msg.id) ?? payload.allMessages?.[0],
          };
        }

        if (notify) {
          return {
            notify:
              payload.notifications.find(([item]) => item!.origin === notify[0]!.origin) ??
              payload.notifications[0]!,
          };
        }
      }

      return payload.messages.length + payload.notifications.length > 1
        ? null
        : payload.messages.length === 1
          ? { msg: payload.messages[0] }
          : { notify: payload.notifications[0] };
    })
    .addCase(ACTION.MESSAGES.UPDATE_ACTIVE, () => null)
    .addCase(ACTION.MESSAGES.SET_ACTIVE_MESSAGE, (_, action): ActivePopupState | null => {
      const msg = typedPayload(action);
      return msg != null ? { msg } : null;
    })
    .addCase(ACTION.MESSAGES.SET_ACTIVE_NOTIFICATION, (_, action): ActivePopupState | null => {
      const notify = typedPayload(action);
      return notify != null ? { notify } : null;
    });
});
