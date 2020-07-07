package im.mak.waves.transactions;

import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.AssetId;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Waves;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class SponsorFeeTransaction extends Transaction {

    public static final int TYPE = 14;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 100_000;

    private final AssetId assetId;
    private final long minSponsoredFee;

    public SponsorFeeTransaction(PublicKey sender, AssetId assetId, long minSponsoredFee) {
        this(sender, assetId, minSponsoredFee, Waves.chainId, Amount.of(MIN_FEE),
                System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public SponsorFeeTransaction(PublicKey sender, AssetId assetId, long minSponsoredFee, byte chainId, Amount fee,
                                 long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);
        if (assetId.isWaves())
            throw new IllegalArgumentException("Can't be Waves");

        this.assetId = assetId;
        this.minSponsoredFee = minSponsoredFee;
    }

    public static SponsorFeeTransaction fromBytes(byte[] bytes) throws IOException {
        return (SponsorFeeTransaction) Transaction.fromBytes(bytes);
    }

    public static SponsorFeeTransaction fromJson(String json) throws IOException {
        return (SponsorFeeTransaction) Transaction.fromJson(json);
    }

    public static SponsorFeeTransactionBuilder with(AssetId assetId, long minSponsoredFee) {
        return new SponsorFeeTransactionBuilder(assetId, minSponsoredFee);
    }

    public AssetId assetId() {
        return assetId;
    }

    public long minSponsoredFee() {
        return minSponsoredFee;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        SponsorFeeTransaction that = (SponsorFeeTransaction) o;
        return this.assetId.equals(that.assetId)
                && this.minSponsoredFee == that.minSponsoredFee;
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), assetId, minSponsoredFee);
    }

    public static class SponsorFeeTransactionBuilder
            extends TransactionBuilder<SponsorFeeTransactionBuilder, SponsorFeeTransaction> {
        private final AssetId assetId;
        private final long minSponsoredFee;

        protected SponsorFeeTransactionBuilder(AssetId assetId, long minSponsoredFee) {
            super(LATEST_VERSION, MIN_FEE);
            this.assetId = assetId;
            this.minSponsoredFee = minSponsoredFee;
        }

        protected SponsorFeeTransaction _build() {
            return new SponsorFeeTransaction(
                    sender, assetId, minSponsoredFee, chainId, fee, timestamp, version, Proof.emptyList());
        }
    }

}
