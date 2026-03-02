import type { TFeeInfo } from '@waves/node-api-js/cjs/api-node/transactions';
import { fetchCalculateFee } from '@waves/node-api-js/cjs/api-node/transactions';
import type { SignerTx } from '@decentralchain/signer';

export function calculateFee(base: string, tx: any): Promise<SignerTx> {
  return fetchCalculateFee(base, tx)
    .then((info: TFeeInfo) => ({ ...tx, fee: info.feeAmount }))
    .catch(() => tx);
}
