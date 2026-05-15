import { type CancelLeaseTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TWithPartialFee } from '../types/index.js';
import { prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const cancelLease = factory<
  IClientCancelLease,
  TWithPartialFee<CancelLeaseTransaction<string>>
>({
  ...getDefaultTransform(),
  chainId: prop('chainId'),
  leaseId: prop('leaseId'),
});

export interface IClientCancelLease extends IDefaultGuiTx<typeof TYPES.CANCEL_LEASE> {
  leaseId: string;
  chainId: number;
}
