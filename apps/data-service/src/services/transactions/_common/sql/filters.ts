import { limit, where, whereIn, whereRaw } from '../../../../utils/db/knex/index';
import { md5 } from '../../../../utils/hash';

const id = (id: string) => where('t.id', id);

const ids = (ids: string[]) => whereIn('t.id', ids);

const sender = (addr: string) => where('t.sender', addr);

const senders = (addrs: string[]) => whereIn('t.sender', addrs);

const byAssetId = (assetId: string) => where('asset_id', assetId);

const byRecipient = (addressOrAlias: string) =>
  whereRaw(
    `recipient_address = coalesce((select sender from txs_10 where alias = '${addressOrAlias}' limit 1), '${addressOrAlias}')`,
  );

const byScript = (s: string) => whereRaw('md5(script) = ?', md5(s));

const sort = (s: string) => (q: any) => q.clone().orderBy('t.uid', s);

const after =
  ({ uid, sort }: { uid: { toString: () => string }; sort: string }) =>
  (q: any) =>
    q.clone().whereRaw(`t.uid ${sort === 'desc' ? '<' : '>'} ${uid.toString()}`);

const commonFilters = {
  after,
  assetId: byAssetId,
  id,
  ids,
  limit,
  recipient: byRecipient,
  script: byScript,
  sender,
  senders,
  sort,
};

export default commonFilters;
export { after, id, ids, limit, sender, senders, sort };
export const assetId = byAssetId;
export const recipient = byRecipient;
export const script = byScript;
