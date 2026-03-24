import { ACTION } from './constants';

export const allowOrigin = (origin: string) => ({
  payload: origin,
  type: ACTION.PERMISSIONS.ALLOW,
});

export const setAutoOrigin = (origin: {
  origin: string | undefined;
  params: Partial<{
    type: 'allowAutoSign';
    totalAmount: string | null;
    interval: number | null;
    approved?: unknown[];
  }>;
}) => ({ payload: origin, type: ACTION.PERMISSIONS.SET_AUTO });

export const disableOrigin = (origin: string) => ({
  payload: origin,
  type: ACTION.PERMISSIONS.DISALLOW,
});

export const deleteOrigin = (origin: string) => ({
  payload: origin,
  type: ACTION.PERMISSIONS.DELETE,
});

export const pendingOrigin = (state: boolean) => ({
  payload: state,
  type: ACTION.PERMISSIONS.PENDING,
});

export const allowOriginDone = (state: unknown) => ({
  payload: state,
  type: ACTION.PERMISSIONS.CONFIRMED_ALLOW,
});

export const autoOriginDone = (state: unknown) => ({
  payload: state,
  type: ACTION.PERMISSIONS.CONFIRMED_AUTO,
});

export const disallowOriginDone = (state: unknown) => ({
  payload: state,
  type: ACTION.PERMISSIONS.CONFIRMED_DISALLOW,
});

export const deleteOriginDone = (state: unknown) => ({
  payload: state,
  type: ACTION.PERMISSIONS.CONFIRMED_DELETE,
});
