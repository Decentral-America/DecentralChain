package im.mak.waves.transactions;

import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.AssetId;
import im.mak.waves.transactions.common.Proof;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class UpdateAssetInfoTransaction extends Transaction {

    public static final int TYPE = 17;
    public static final int LATEST_VERSION = 1;
    public static final long MIN_FEE = 100_000;

    private final AssetId assetId;
    private final String name;
    private final String description;

    public UpdateAssetInfoTransaction(PublicKey sender, AssetId assetId, String name, String description) {
        this(sender, assetId, name, description, WavesConfig.chainId(), Amount.of(MIN_FEE),
                System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public UpdateAssetInfoTransaction(PublicKey sender, AssetId assetId, String name, String description,
                                      byte chainId, Amount fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);
        if (assetId.isWaves())
            throw new IllegalArgumentException("Can't be Waves");

        this.assetId = assetId;
        this.name = name == null ? "" : name;
        this.description = description == null ? "" : description;
    }

    public static UpdateAssetInfoTransaction fromBytes(byte[] bytes) throws IOException {
        return (UpdateAssetInfoTransaction) Transaction.fromBytes(bytes);
    }

    public static UpdateAssetInfoTransaction fromJson(String json) throws IOException {
        return (UpdateAssetInfoTransaction) Transaction.fromJson(json);
    }

    public static UpdateAssetInfoTransactionBuilder builder(AssetId assetId, String name, String description) {
        return new UpdateAssetInfoTransactionBuilder(assetId, name, description);
    }

    public AssetId assetId() {
        return assetId;
    }

    public String name() {
        return name;
    }

    public String description() {
        return description;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        UpdateAssetInfoTransaction that = (UpdateAssetInfoTransaction) o;
        return this.assetId.equals(that.assetId)
                && this.name.equals(that.name)
                && this.description.equals(that.description);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), assetId, name, description);
    }

    public static class UpdateAssetInfoTransactionBuilder
            extends TransactionBuilder<UpdateAssetInfoTransactionBuilder, UpdateAssetInfoTransaction> {
        private final AssetId assetId;
        private final String name;
        private final String description;

        protected UpdateAssetInfoTransactionBuilder(AssetId assetId, String name, String description) {
            super(LATEST_VERSION, MIN_FEE);
            this.assetId = assetId;
            this.name = name;
            this.description = description;
        }

        protected UpdateAssetInfoTransaction _build() {
            return new UpdateAssetInfoTransaction(
                    sender, assetId, name, description, chainId, feeWithExtra(), timestamp, version, Proof.emptyList());
        }
    }
    
}
