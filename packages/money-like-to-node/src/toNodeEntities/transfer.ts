import { type TransferTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { defaultTo, getAssetId, getCoins, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const transfer = factory<IDCCGuiTransfer, TWithPartialFee<TransferTransaction<string>>>({
  ...getDefaultTransform(),
  amount: pipe<IDCCGuiTransfer, TMoney, string>(prop('amount'), getCoins),
  assetId: pipe(prop('amount'), getAssetId),
  attachment: pipe(prop('attachment'), defaultTo('')),
  feeAssetId: pipe<IDCCGuiTransfer, TMoney | TLong | undefined | null, string | null, string>(
    prop('fee'),
    getAssetId,
    defaultTo('DCC'),
  ),
  recipient: prop('recipient'),
});

export interface IDCCGuiTransfer extends IDefaultGuiTx<typeof TYPES.TRANSFER> {
  recipient: string;
  amount: TMoney;
  attachment?: string | undefined;
}
