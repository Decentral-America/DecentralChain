import type {
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type SponsorshipTransactionFields<LONG = Long> = {
    assetId: string;
    minSponsoredAssetFee: LONG | null;
};

export type SponsorshipTransactionV1<LONG> = WithVersion<
    SponsorshipTransactionFields<LONG> & BaseTransaction<LONG, 14>,
    1
>;
export type SponsorshipTransactionV2<LONG> = WithVersion<
    SponsorshipTransactionFields<LONG> & BaseTransaction<LONG, 14>,
    2
>;

export type SponsorshipTransactionMap<LONG = Long> = {
    1: SponsorshipTransactionV1<LONG>;
    2: SponsorshipTransactionV2<LONG>;
};

export type SponsorshipTransaction<LONG = Long> =
    | SponsorshipTransactionV1<LONG>
    | SponsorshipTransactionV2<LONG>;

export type SponsorshipTransactionFromNode<LONG = Long> = SignedTransaction<
    SponsorshipTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };
