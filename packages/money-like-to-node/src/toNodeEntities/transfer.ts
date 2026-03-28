import { type TransferTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TMoney, type TWithPartialFee } from '../types/index.js';
import { defaultTo, getAssetId, getCoins, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const transfer = factory<IClientTransfer, TWithPartialFee<TransferTransaction<string>>>({
  ...getDefaultTransform(),
  amount: pipe<IClientTransfer, TMoney, string>(prop('amount'), getCoins),
  assetId: pipe(prop('amount'), getAssetId),
  attachment: pipe(prop('attachment'), defaultTo('')),
  feeAssetId: pipe(prop('fee'), getAssetId),
  recipient: prop('recipient'),
});

export interface IClientTransfer extends IDefaultGuiTx<typeof TYPES.TRANSFER> {
  recipient: string;
  amount: TMoney;
  attachment?: string | undefined;
}
