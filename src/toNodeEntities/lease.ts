import { type LeaseTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TMoney, type TWithPartialFee } from '../types/index.js';
import { getCoins, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const lease = factory<IDCCGuiLease, TWithPartialFee<LeaseTransaction<string>>>({
  ...getDefaultTransform(),
  amount: pipe<IDCCGuiLease, TMoney, string>(prop('amount'), getCoins),
  recipient: prop('recipient'),
});

export interface IDCCGuiLease extends IDefaultGuiTx<typeof TYPES.LEASE> {
  amount: TMoney;
  recipient: string;
}
