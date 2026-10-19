/**
 * Amounts in the units of the asset they belong to.
 *
 * Every non-DCC amount used to be divided by 10^8 and labelled "DCC", so a
 * burn of 100,000 AUDT (2 decimals) rendered as "0.1 DCC".
 */
import { formatAmount } from '@/components/utils/formatters';

export interface AssetMeta {
  decimals: number;
  name: string;
}

export type AssetMetaMap = Readonly<Record<string, AssetMeta>>;

const DCC: AssetMeta = { decimals: 8, name: 'DCC' };

/** The node and data service spell native DCC as null, '' or the literal 'DCC'. */
export function isNativeAsset(assetId: string | null | undefined): boolean {
  return !assetId || assetId === 'DCC';
}

export function assetIdsOf(...ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => !isNativeAsset(id)))];
}

interface AmountCarrier {
  type: number;
  assetId?: string | null;
  order1?: { assetPair?: { amountAsset?: string | null } };
}

/** The asset an amount is denominated in: an exchange's is its pair's amount asset. */
export function amountAssetIdOf(tx: AmountCarrier): string | null {
  if (tx.type === 7) return tx.order1?.assetPair?.amountAsset ?? null;
  return tx.assetId ?? null;
}

export function formatAssetAmount(
  amount: number | string | bigint | null | undefined,
  assetId: string | null | undefined,
  assets: AssetMetaMap,
): string {
  if (isNativeAsset(assetId)) return `${formatAmount(amount, DCC.decimals)} ${DCC.name}`;
  const meta = assets[assetId as string];
  if (!meta) return `${formatAmount(amount, 0)} units`;
  return `${formatAmount(amount, meta.decimals)} ${meta.name}`;
}

export function toAssetMetaMap(
  details: ReadonlyMap<string, { decimals: number; name: string }>,
): Record<string, AssetMeta> {
  const out: Record<string, AssetMeta> = {};
  for (const [id, detail] of details) out[id] = { decimals: detail.decimals, name: detail.name };
  return out;
}
