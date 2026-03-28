import type { PERMISSIONS } from './constants';

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | 'whiteList';

interface ApprovedItem {
  amount: string;
  time: number;
}

export interface PermissionObject {
  type: PermissionType;
  approved?: ApprovedItem[] | undefined;
  time?: number | undefined;
  canUse?: boolean | null | undefined;
  /** Displayed amount threshold for auto-sign in base units (coins). Null means no limit set. */
  totalAmount?: string | number | null | undefined;
  /** Auto-sign validity window in milliseconds. Null means auto-sign is disabled. */
  interval?: number | null | undefined;
}

export type PermissionValue = PermissionType | PermissionObject;
