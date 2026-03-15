import { type SponsorshipTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TMoney, type TWithPartialFee } from '../types/index.js';
import { getAssetId, getCoins, ifElse, isStopSponsorship, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export interface IUpdatedISponsorshipTransaction<LONG>
  extends Omit<SponsorshipTransaction<LONG>, 'minSponsoredAssetFee'> {
  minSponsoredAssetFee: LONG | null;
}

export const sponsorship = factory<
  IClientSponsorship,
  TWithPartialFee<IUpdatedISponsorshipTransaction<string>>
>({
  ...getDefaultTransform(),
  assetId: pipe<IClientSponsorship, TMoney, string>(prop('minSponsoredAssetFee'), getAssetId),
  minSponsoredAssetFee: ifElse(
    pipe<IClientSponsorship, TMoney, string, boolean>(
      prop('minSponsoredAssetFee'),
      getCoins,
      isStopSponsorship,
    ),
    () => null,
    pipe<IClientSponsorship, TMoney, string>(prop('minSponsoredAssetFee'), getCoins),
  ),
});

export interface IClientSponsorship extends IDefaultGuiTx<typeof TYPES.SPONSORSHIP> {
  minSponsoredAssetFee: TMoney;
}
