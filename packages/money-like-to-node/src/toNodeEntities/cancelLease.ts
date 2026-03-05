import type { CancelLeaseTransaction } from '@decentralchain/ts-types';
import type { TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { prop } from '../utils/index.js';

export const cancelLease = factory<
  IDCCGuiCancelLease,
  TWithPartialFee<CancelLeaseTransaction<string>>
>({
  ...getDefaultTransform(),
  leaseId: prop('leaseId'),
  chainId: prop('chainId'),
});

export interface IDCCGuiCancelLease extends IDefaultGuiTx<typeof TYPES.CANCEL_LEASE> {
  leaseId: string;
  chainId: number;
}
