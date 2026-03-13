import { type PERMISSIONS } from './constants';

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
  totalAmount?: undefined | undefined;
  interval?: undefined | undefined;
}

export type PermissionValue = PermissionType | PermissionObject;
