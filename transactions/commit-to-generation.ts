import {
    Long,
    SignedTransaction,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction } from './index';

export type CommitToGenerationTransactionFields<LONG = Long> = {
    generationPeriodStart: number;
    endorserPublicKey: string;
    commitmentSignature: string;
};

export type CommitToGenerationTransactionV1<LONG> = WithVersion<
    CommitToGenerationTransactionFields & BaseTransaction<LONG, 19>,
    1
>;

export type CommitToGenerationTransactionMap<LONG = Long> = {
    1: CommitToGenerationTransactionV1<LONG>;
};

export type CommitToGenerationTransaction<LONG = Long> =
    CommitToGenerationTransactionV1<LONG>;

export type CommitToGenerationTransactionFromNode<LONG = Long> = SignedTransaction<
    CommitToGenerationTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };


