package im.mak.waves.transactions;

import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Waves;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class ReissueTransaction extends Transaction {

    public static final int TYPE = 5;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final Amount amount;
    private final boolean reissuable;

    public ReissueTransaction(PublicKey sender, Amount amount, boolean reissuable) {
        this(sender, amount, reissuable, Waves.chainId, Amount.of(MIN_FEE),
                System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public ReissueTransaction(PublicKey sender, Amount amount, boolean reissuable, byte chainId, Amount fee,
                              long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);
        if (amount.assetId().isWaves())
            throw new IllegalArgumentException("Can't be Waves");

        this.amount = amount;
        this.reissuable = reissuable;
    }

    public static ReissueTransaction fromBytes(byte[] bytes) throws IOException {
        return (ReissueTransaction) Transaction.fromBytes(bytes);
    }

    public static ReissueTransaction fromJson(String json) throws IOException {
        return (ReissueTransaction) Transaction.fromJson(json);
    }

    public static ReissueTransactionBuilder with(Amount amount) {
        return new ReissueTransactionBuilder(amount);
    }

    public Amount amount() {
        return amount;
    }

    public boolean isReissuable() {
        return reissuable;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        ReissueTransaction that = (ReissueTransaction) o;
        return this.amount.equals(that.amount)
                && this.reissuable == that.reissuable;
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), amount, reissuable);
    }

    public static class ReissueTransactionBuilder
            extends TransactionBuilder<ReissueTransactionBuilder, ReissueTransaction> {
        private final Amount amount;
        private boolean reissuable;

        protected ReissueTransactionBuilder(Amount amount) {
            super(LATEST_VERSION, MIN_FEE);
            this.amount = amount;
            this.reissuable = true;
        }

        public ReissueTransactionBuilder reissuable(boolean reissuable) {
            this.reissuable = reissuable;
            return this;
        }

        protected ReissueTransaction _build() {
            return new ReissueTransaction(
                    sender, amount, reissuable, chainId, fee, timestamp, version, Proof.emptyList());
        }
    }

}
