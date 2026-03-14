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
  IDCCGuiSponsorship,
  TWithPartialFee<IUpdatedISponsorshipTransaction<string>>
>({
  ...getDefaultTransform(),
  assetId: pipe<IDCCGuiSponsorship, TMoney, string>(prop('minSponsoredAssetFee'), getAssetId),
  minSponsoredAssetFee: ifElse(
    pipe<IDCCGuiSponsorship, TMoney, string, boolean>(
      prop('minSponsoredAssetFee'),
      getCoins,
      isStopSponsorship,
    ),
    () => null,
    pipe<IDCCGuiSponsorship, TMoney, string>(prop('minSponsoredAssetFee'), getCoins),
  ),
});

export interface IDCCGuiSponsorship extends IDefaultGuiTx<typeof TYPES.SPONSORSHIP> {
  minSponsoredAssetFee: TMoney;
}
