package im.mak.waves.transactions;

import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.mass.Transfer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

public class MassTransferTransaction extends Transaction {

    public static final int TYPE = 11;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 100_000;

    private final List<Transfer> transfers;
    private final AssetId assetId;
    private final Base58String attachment;

    public MassTransferTransaction(PublicKey sender, AssetId assetId, List<Transfer> transfers, Base58String attachment) {
        this(sender, assetId, transfers, attachment, WavesConfig.chainId(), Amount.of(0), System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public MassTransferTransaction(PublicKey sender, AssetId assetId, List<Transfer> transfers, Base58String attachment, byte chainId, Amount fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, calculateFee(transfers, fee), timestamp, proofs);

        this.assetId = assetId == null ? AssetId.WAVES : assetId;
        this.transfers = transfers == null ? new ArrayList<>() : transfers;
        this.attachment = attachment == null ? Base58String.empty() : attachment;
    }

    public static MassTransferTransaction fromBytes(byte[] bytes) throws IOException {
        return (MassTransferTransaction) Transaction.fromBytes(bytes);
    }

    public static MassTransferTransaction fromJson(String json) throws IOException {
        return (MassTransferTransaction) Transaction.fromJson(json);
    }

    public static MassTransferTransactionBuilder builder(List<Transfer> transfers) {
        return new MassTransferTransactionBuilder(transfers);
    }

    public static MassTransferTransactionBuilder builder(Transfer... transfers) {
        return builder(Arrays.asList(transfers));
    }

    private static Amount calculateFee(List<Transfer> transfers, Amount fee) {
        if (fee.value() > 0)
            return fee;
        if (transfers == null)
            return Amount.of(MIN_FEE);

        return Amount.of(MIN_FEE * (1 + (transfers.size() + 1) / 2));
    }

    public long total() {
        return transfers.stream().mapToLong(Transfer::amount).sum();
    }

    public List<Transfer> transfers() {
        return transfers;
    }

    public AssetId assetId() {
        return assetId;
    }

    public Base58String attachment() {
        return attachment;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        MassTransferTransaction that = (MassTransferTransaction) o;
        return this.transfers.equals(that.transfers)
                && this.assetId.equals(that.assetId)
                && this.attachment.equals(that.attachment);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), transfers, assetId, attachment);
    }

    public static class MassTransferTransactionBuilder
            extends TransactionBuilder<MassTransferTransactionBuilder, MassTransferTransaction> {
        private final List<Transfer> transfers;
        private AssetId assetId;
        private Base58String attachment;

        protected MassTransferTransactionBuilder(List<Transfer> transfers) {
            super(LATEST_VERSION, 0);
            this.transfers = transfers;
            this.assetId = AssetId.WAVES;
            this.attachment = Base58String.empty();
        }

        public MassTransferTransactionBuilder assetId(AssetId assetId) {
            this.assetId = assetId;
            return this;
        }

        public MassTransferTransactionBuilder attachment(Base58String attachment) {
            this.attachment = attachment;
            return this;
        }

        protected MassTransferTransaction _build() {
            Amount calculatedFee = calculateFee(transfers, fee);
            Amount calculatedFeeWithExtra = Amount.of(calculatedFee.value() + extraFee, calculatedFee.assetId());
            return new MassTransferTransaction(
                    sender, assetId, transfers, attachment,
                    chainId, calculatedFeeWithExtra, timestamp, version, Proof.emptyList());
        }
    }

}
