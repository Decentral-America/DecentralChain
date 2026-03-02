import { type TLong } from '../../interface';
import { BigNumber } from '@decentralchain/bignumber';
import { fetchAssetsBalance, type TAssetBalance } from '../../api-node/assets';
import { filter, map, pipe, prop } from '../utils';

export default function (base: string, address: string, dccFee: TLong): Promise<TAssetFeeInfo[]> {
  return fetchAssetsBalance(base, address).then(
    pipe(prop('balances'), filter(canBeSponsor(dccFee)), map(currentFee(dccFee))),
  );
}

/** 0.001 * 10^8 expressed as an exact integer to avoid IEEE 754 floating-point imprecision. */
const MIN_FEE_UNITS = 100_000;

function canBeSponsor(dccFee: TLong): (balance: TAssetBalance) => boolean {
  return (balance) =>
    Boolean(
      balance.minSponsoredAssetFee &&
      BigNumber.toBigNumber(balance.sponsorBalance ?? 0).gte(dccFee) &&
      BigNumber.toBigNumber(balance.minSponsoredAssetFee)
        .mul(dccFee)
        .div(MIN_FEE_UNITS)
        .lte(balance.balance),
    );
}

function currentFee(dccFee: TLong): (balance: TAssetBalance) => TAssetFeeInfo {
  return (balance) => ({
    assetId: balance.assetId,
    dccFee,
    assetFee: BigNumber.toBigNumber(balance.minSponsoredAssetFee ?? 0)
      .mul(dccFee)
      .div(MIN_FEE_UNITS)
      .toFixed(),
  });
}

/** @public — exposed via create().tools.addresses.availableSponsoredBalances() return type */
export interface TAssetFeeInfo {
  assetId: string;
  dccFee: TLong;
  assetFee: TLong;
}
