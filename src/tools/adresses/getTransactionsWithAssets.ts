import { type Transaction, type WithApiMixin } from '@decentralchain/ts-types';
import { type TAssetDetails } from '../../api-node/assets';
import { fetchTransactions } from '../../api-node/transactions';
import { type TLong } from '../../interface';
import getAssetsByTransaction from './getAssetsByTransaction';

export default function (
  base: string,
  address: string,
  limit: number,
  after?: string,
): Promise<{
  transactions: (Transaction<TLong> & WithApiMixin)[];
  assets: Record<string, TAssetDetails>;
}> {
  return fetchTransactions(base, address, limit, after).then((transactions) =>
    getAssetsByTransaction(base, transactions).then((assets) => ({ transactions, assets })),
  );
}
