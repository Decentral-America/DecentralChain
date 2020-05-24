package im.mak.waves.transactions;

import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class BurnTransaction extends Transaction {

    public static final int TYPE = 6;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final Asset assetId;
    private final long amount;

    public BurnTransaction(PublicKey sender, Asset assetId, long amount, byte chainId, long fee, long timestamp, int version) {
        this(sender, assetId, amount, chainId, fee, timestamp, version, Proof.emptyList());
    }

    public BurnTransaction(PublicKey sender, Asset assetId, long amount, byte chainId, long fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, Asset.WAVES, timestamp, proofs);

        this.assetId = assetId;
        this.amount = amount;
    }

    public static BurnTransaction fromBytes(byte[] bytes) throws IOException {
        return (BurnTransaction) Transaction.fromBytes(bytes);
    }

    public static BurnTransaction fromJson(String json) throws IOException {
        return (BurnTransaction) Transaction.fromJson(json);
    }

    public static BurnTransactionBuilder with(Asset assetId, long amount) {
        return new BurnTransactionBuilder(assetId, amount);
    }

    public Asset asset() {
        return assetId;
    }

    public long amount() {
        return amount;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        BurnTransaction that = (BurnTransaction) o;
        return this.assetId.equals(that.assetId)
                && this.amount == that.amount;
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), assetId, amount);
    }

    public static class BurnTransactionBuilder
            extends TransactionBuilder<BurnTransactionBuilder, BurnTransaction> {
        private final Asset assetId;
        private final long amount;

        protected BurnTransactionBuilder(Asset assetId, long amount) {
            super(LATEST_VERSION, MIN_FEE);
            this.assetId = assetId;
            this.amount = amount;
        }

        protected BurnTransaction _build() {
            return new BurnTransaction(sender, assetId, amount, chainId, fee, timestamp, version);
        }
    }

}
