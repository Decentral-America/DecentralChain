import { Asset, Money } from '@decentralchain/data-entities';
import invariant from 'tiny-invariant';
import type { AssetsRecord } from '#assets/types';
import type { MoneyLike } from '../messages/types';

/**
 * Returns the first (preferred) version from a non-empty tx versions array.
 * Every entry in DEFAULT_TX_VERSIONS / LEDGER_TX_VERSIONS has ≥ 1 element, so
 * this invariant should never fire in production — but it gives a clear error if
 * a new tx type is ever added to the type system before its versions entry is wired.
 */
export function pickDefaultTxVersion<T extends number>(versions: T[], txType: number | string): T {
  invariant(versions.length > 0, `No supported tx versions for type ${String(txType)}`);
  // Invariant above guarantees index 0 is defined; cast avoids noUncheckedIndexedAccess widening.
  return versions[0] as T;
}

export function moneyLikeToMoney(amount: MoneyLike, assets: AssetsRecord) {
  const asset = new Asset(assets[amount.assetId ?? 'DCC'] ?? assets.DCC);

  if (amount.tokens != null || amount.coins != null) {
    let result = new Money(0, asset);

    if ('tokens' in amount) {
      result = result.cloneWithTokens(amount.tokens ?? 0);
    }

    if ('coins' in amount) {
      result = result.add(result.cloneWithCoins(amount.coins ?? 0));
    }

    return result;
  }

  return new Money(amount.amount ?? 0, asset);
}
