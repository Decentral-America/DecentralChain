import type { StoreApi } from 'zustand/vanilla';

import type { PopupState } from './popupStore';

export type { PopupState } from './popupStore';

export type PopupStore = StoreApi<PopupState>;
