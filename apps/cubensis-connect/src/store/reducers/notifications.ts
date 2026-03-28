import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { Message } from '../../messages/types';
import type { NotificationsStoreItem } from '../../notifications/types';

// ─── notifications ─────────────────────────────────────────────────────────
const notificationsSlice = createSlice({
  initialState: [] as NotificationsStoreItem[][],
  name: 'notifications',
  reducers: {
    setNotifications: (_state, action: PayloadAction<NotificationsStoreItem[][]>) => action.payload,
  },
});
export const notifications = notificationsSlice.reducer;
export const { setNotifications } = notificationsSlice.actions;

// ─── activePopup ───────────────────────────────────────────────────────────
interface ActivePopupState {
  msg?: Message | undefined;
  notify?: NotificationsStoreItem[] | undefined;
}

interface SetActiveAutoPayload {
  allMessages?: Message[] | undefined;
  messages: Message[];
  notifications: NotificationsStoreItem[][];
}

const activePopupSlice = createSlice({
  initialState: null as ActivePopupState | null,
  name: 'activePopup',
  reducers: {
    clearActive: (): null => null,
    setActiveAuto: (
      state,
      action: PayloadAction<SetActiveAutoPayload>,
    ): ActivePopupState | null => {
      const payload = action.payload;

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
              payload.notifications.find(([item]) => item?.origin === notify[0]?.origin) ??
              payload.notifications[0],
          };
        }
      }

      return payload.messages.length + payload.notifications.length > 1
        ? null
        : payload.messages.length === 1
          ? { msg: payload.messages[0] }
          : { notify: payload.notifications[0] };
    },
    setActiveMessage: (
      _state,
      action: PayloadAction<Message | undefined>,
    ): ActivePopupState | null => {
      const msg = action.payload;
      return msg != null ? { msg } : null;
    },
    setActiveNotification: (
      _state,
      action: PayloadAction<NotificationsStoreItem[] | undefined>,
    ): ActivePopupState | null => {
      const notify = action.payload;
      return notify != null ? { notify } : null;
    },
  },
});
export const activePopup = activePopupSlice.reducer;
export const { setActiveAuto, clearActive, setActiveMessage, setActiveNotification } =
  activePopupSlice.actions;
