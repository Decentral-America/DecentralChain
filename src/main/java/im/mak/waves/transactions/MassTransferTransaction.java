package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.AssetId;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Waves;
import im.mak.waves.transactions.mass.Transfer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

import static java.nio.charset.StandardCharsets.UTF_8;

public class MassTransferTransaction extends Transaction {

    public static final int TYPE = 11;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 100_000;

    private final List<Transfer> transfers;
    private final AssetId assetId;
    private final byte[] attachment;

    public MassTransferTransaction(PublicKey sender, AssetId assetId, List<Transfer> transfers, byte[] attachment) {
        this(sender, assetId, transfers, attachment, Waves.chainId, Amount.of(0), System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public MassTransferTransaction(PublicKey sender, AssetId assetId, List<Transfer> transfers, byte[] attachment, byte chainId, Amount fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, calculateFee(transfers, fee), timestamp, proofs);

        this.assetId = assetId == null ? AssetId.WAVES : assetId;
        this.transfers = transfers == null ? new ArrayList<>() : transfers;
        this.attachment = attachment == null ? Bytes.empty() : attachment;
    }

    public static MassTransferTransaction fromBytes(byte[] bytes) throws IOException {
        return (MassTransferTransaction) Transaction.fromBytes(bytes);
    }

    public static MassTransferTransaction fromJson(String json) throws IOException {
        return (MassTransferTransaction) Transaction.fromJson(json);
    }

    public static MassTransferTransactionBuilder with(List<Transfer> transfers) {
        return new MassTransferTransactionBuilder(transfers);
    }

    public static MassTransferTransactionBuilder with(Transfer... transfers) {
        return with(Arrays.asList(transfers));
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

    public String attachment() {
        return new String(attachment, UTF_8);
    }

    public byte[] attachmentBytes() {
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
                && Bytes.equal(this.attachment, that.attachment);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), transfers, assetId, attachment);
    }

    public static class MassTransferTransactionBuilder
            extends TransactionBuilder<MassTransferTransactionBuilder, MassTransferTransaction> {
        private final List<Transfer> transfers;
        private AssetId assetId;
        private byte[] attachment;

        protected MassTransferTransactionBuilder(List<Transfer> transfers) {
            super(LATEST_VERSION, 0);
            this.transfers = transfers;
            this.assetId = AssetId.WAVES;
            this.attachment = Bytes.empty();
        }

        public MassTransferTransactionBuilder assetId(AssetId assetId) {
            this.assetId = assetId;
            return this;
        }

        public MassTransferTransactionBuilder attachment(byte[] attachment) {
            this.attachment = attachment;
            return this;
        }

        public MassTransferTransactionBuilder attachment(String attachment) {
            return attachment(attachment.getBytes(UTF_8));
        }

        protected MassTransferTransaction _build() {
            return new MassTransferTransaction(
                    sender, assetId, transfers, attachment, chainId, fee, timestamp, version, Proof.emptyList());
        }
    }

}
