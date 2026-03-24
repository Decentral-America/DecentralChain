// Address operations — these are command actions intercepted by BackgroundMW.
// The BackgroundMW forwards each to the corresponding Background service method.
import { createAction } from '@reduxjs/toolkit';

export const setAddresses = createAction<Record<string, string>>('addresses/setAll');
export const setAddress = createAction<{ address: string; name: string }>('addresses/set');
export const removeAddress = createAction<{ address: string }>('addresses/remove');
