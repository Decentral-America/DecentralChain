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

    private final Asset asset;
    private final long amount;

    public BurnTransaction(PublicKey sender, Asset asset, long amount, byte chainId, long fee, long timestamp, int version) {
        this(sender, asset, amount, chainId, fee, timestamp, version, Proof.emptyList());
    }

    public BurnTransaction(PublicKey sender, Asset asset, long amount, byte chainId, long fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, Asset.WAVES, timestamp, proofs);
        if (asset.isWaves())
            throw new IllegalArgumentException("Can't be Waves");

        this.asset = asset;
        this.amount = amount;
    }

    public static BurnTransaction fromBytes(byte[] bytes) throws IOException {
        return (BurnTransaction) Transaction.fromBytes(bytes);
    }

    public static BurnTransaction fromJson(String json) throws IOException {
        return (BurnTransaction) Transaction.fromJson(json);
    }

    public static BurnTransactionBuilder with(Asset asset, long amount) {
        return new BurnTransactionBuilder(asset, amount);
    }

    public Asset asset() {
        return asset;
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
        return this.asset.equals(that.asset)
                && this.amount == that.amount;
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), asset, amount);
    }

    public static class BurnTransactionBuilder
            extends TransactionBuilder<BurnTransactionBuilder, BurnTransaction> {
        private final Asset asset;
        private final long amount;

        protected BurnTransactionBuilder(Asset asset, long amount) {
            super(LATEST_VERSION, MIN_FEE);
            this.asset = asset;
            this.amount = amount;
        }

        protected BurnTransaction _build() {
            return new BurnTransaction(sender, asset, amount, chainId, fee, timestamp, version);
        }
    }

}
