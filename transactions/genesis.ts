import type { Long, WithApiMixin, WithId, WithVersion } from '../src';
import type { BaseTransaction, Omit, SignedTransaction } from './index';

export type GenesisTransactionFields<LONG = Long> = {
    recipient: string;
    amount: LONG;
};

export type GenesisTransactionV1<LONG> = WithVersion<
    GenesisTransactionFields<LONG> &
        Omit<BaseTransaction<LONG, 1>, 'senderPublicKey'>,
    1
>;

export type GenesisTransactionMap<LONG = Long> = {
    1: GenesisTransactionV1<LONG>;
};

export type GenesisTransaction<LONG = Long> = GenesisTransactionV1<LONG>;

export type GenesisTransactionFromNode<LONG = Long> = SignedTransaction<
    GenesisTransaction<LONG>
> &
    WithId &
    Omit<WithApiMixin, 'sender'>;
