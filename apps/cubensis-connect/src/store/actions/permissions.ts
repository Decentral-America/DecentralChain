// Permission command actions — intercepted by the permissions middleware.
// None of these update Redux state directly; state comes back via background updateState.
import { createAction } from '@reduxjs/toolkit';

export const allowOrigin = createAction<string>('permissions/allow');
export const setAutoOrigin = createAction<{
  origin: string | undefined;
  params: Partial<{
    type: 'allowAutoSign';
    totalAmount: string | null;
    interval: number | null;
    approved?: unknown[];
  }>;
}>('permissions/setAuto');
export const disableOrigin = createAction<string>('permissions/disallow');
export const deleteOrigin = createAction<string>('permissions/delete');
export const pendingOrigin = createAction<boolean>('permissions/pending');
export const allowOriginDone = createAction<unknown>('permissions/allowDone');
export const autoOriginDone = createAction<unknown>('permissions/autoDone');
export const disallowOriginDone = createAction<unknown>('permissions/disallowDone');
export const deleteOriginDone = createAction<unknown>('permissions/deleteDone');
