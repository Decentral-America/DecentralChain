import type { ITransferTransaction } from '@decentralchain/ts-types';
import type { TLong, TMoney, TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { defaultTo, getAssetId, getCoins, pipe, prop } from '../utils/index.js';

export const transfer = factory<IDCCGuiTransfer, TWithPartialFee<ITransferTransaction<string>>>({
  ...getDefaultTransform(),
  recipient: prop('recipient'),
  amount: pipe<IDCCGuiTransfer, TMoney, string>(prop('amount'), getCoins),
  feeAssetId: pipe<IDCCGuiTransfer, TMoney | TLong | undefined | null, string | null, string>(
    prop('fee'),
    getAssetId,
    defaultTo('DCC'),
  ),
  assetId: pipe(prop('amount'), getAssetId),
  attachment: pipe(prop('attachment'), defaultTo('')),
});

export interface IDCCGuiTransfer extends IDefaultGuiTx<typeof TYPES.TRANSFER> {
  recipient: string;
  amount: TMoney;
  attachment?: string | undefined;
}
