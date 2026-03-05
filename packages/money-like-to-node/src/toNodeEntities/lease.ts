import type { LeaseTransaction } from '@decentralchain/ts-types';
import type { TMoney, TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { getCoins, pipe, prop } from '../utils/index.js';

export const lease = factory<IDCCGuiLease, TWithPartialFee<LeaseTransaction<string>>>({
  ...getDefaultTransform(),
  amount: pipe<IDCCGuiLease, TMoney, string>(prop('amount'), getCoins),
  recipient: prop('recipient'),
});

export interface IDCCGuiLease extends IDefaultGuiTx<typeof TYPES.LEASE> {
  amount: TMoney;
  recipient: string;
}
