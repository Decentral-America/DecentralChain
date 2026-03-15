import { type AppActionOfType } from '../types';
import { ACTION } from './constants';

export const allowOrigin = (origin: string): AppActionOfType<typeof ACTION.PERMISSIONS.ALLOW> => ({
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
}): AppActionOfType<typeof ACTION.PERMISSIONS.SET_AUTO> => ({
  payload: origin,
  type: ACTION.PERMISSIONS.SET_AUTO,
});

export const disableOrigin = (
  origin: string,
): AppActionOfType<typeof ACTION.PERMISSIONS.DISALLOW> => ({
  payload: origin,
  type: ACTION.PERMISSIONS.DISALLOW,
});

export const deleteOrigin = (
  origin: string,
): AppActionOfType<typeof ACTION.PERMISSIONS.DELETE> => ({
  payload: origin,
  type: ACTION.PERMISSIONS.DELETE,
});

export const pendingOrigin = (
  state: boolean,
): AppActionOfType<typeof ACTION.PERMISSIONS.PENDING> => ({
  payload: state,
  type: ACTION.PERMISSIONS.PENDING,
});

export const allowOriginDone = (
  state: unknown,
): AppActionOfType<typeof ACTION.PERMISSIONS.CONFIRMED_ALLOW> => ({
  payload: state,
  type: ACTION.PERMISSIONS.CONFIRMED_ALLOW,
});

export const autoOriginDone = (
  state: unknown,
): AppActionOfType<typeof ACTION.PERMISSIONS.CONFIRMED_AUTO> => ({
  payload: state,
  type: ACTION.PERMISSIONS.CONFIRMED_AUTO,
});

export const disallowOriginDone = (
  state: unknown,
): AppActionOfType<typeof ACTION.PERMISSIONS.CONFIRMED_ALLOW> => ({
  payload: state,
  type: ACTION.PERMISSIONS.CONFIRMED_ALLOW,
});

export const deleteOriginDone = (
  state: unknown,
): AppActionOfType<typeof ACTION.PERMISSIONS.CONFIRMED_ALLOW> => ({
  payload: state,
  type: ACTION.PERMISSIONS.CONFIRMED_ALLOW,
});
