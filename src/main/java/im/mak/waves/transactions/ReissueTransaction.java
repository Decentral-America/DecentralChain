package im.mak.waves.transactions;

import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class ReissueTransaction extends Transaction {

    public static final int TYPE = 5;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final Asset asset;
    private final long amount;
    private final boolean reissuable;

    public ReissueTransaction(PublicKey sender, Asset asset, long amount, boolean reissuable, byte chainId, long fee, long timestamp, int version) {
        this(sender, asset, amount, reissuable, chainId, fee, timestamp, version, Proof.emptyList());
    }

    public ReissueTransaction(PublicKey sender, Asset asset, long amount, boolean reissuable, byte chainId, long fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, Asset.WAVES, timestamp, proofs);
        if (asset.isWaves())
            throw new IllegalArgumentException("Can't be Waves");

        this.asset = asset;
        this.amount = amount;
        this.reissuable = reissuable;
    }

    public static ReissueTransaction fromBytes(byte[] bytes) throws IOException {
        return (ReissueTransaction) Transaction.fromBytes(bytes);
    }

    public static ReissueTransaction fromJson(String json) throws IOException {
        return (ReissueTransaction) Transaction.fromJson(json);
    }

    public static ReissueTransactionBuilder with(Asset asset, long amount) {
        return new ReissueTransactionBuilder(asset, amount);
    }

    public Asset asset() {
        return asset;
    }

    public long amount() {
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
        return this.asset.equals(that.asset)
                && this.amount == that.amount
                && this.reissuable == that.reissuable;
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), asset, amount, reissuable);
    }

    public static class ReissueTransactionBuilder
            extends TransactionBuilder<ReissueTransactionBuilder, ReissueTransaction> {
        private final Asset asset;
        private final long amount;
        private boolean reissuable;

        protected ReissueTransactionBuilder(Asset asset, long amount) {
            super(LATEST_VERSION, MIN_FEE);
            this.asset = asset;
            this.amount = amount;
            this.reissuable = true;
        }

        public ReissueTransactionBuilder reissuable(boolean reissuable) {
            this.reissuable = reissuable;
            return this;
        }

        protected ReissueTransaction _build() {
            return new ReissueTransaction(sender, asset, amount, reissuable, chainId, fee, timestamp, version);
        }
    }

}
