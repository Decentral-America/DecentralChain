package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
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
    private final Asset asset;
    private final byte[] attachment;

    public MassTransferTransaction(PublicKey sender, List<Transfer> transfers, Asset asset, byte[] attachment, byte chainId, long fee, long timestamp, int version) {
        this(sender, transfers, asset, attachment, chainId, fee, timestamp, version, Proof.emptyList());
    }

    public MassTransferTransaction(PublicKey sender, List<Transfer> transfers, Asset asset, byte[] attachment, byte chainId, long fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, Asset.WAVES, timestamp, proofs);

        this.transfers = transfers == null ? new ArrayList<>() : transfers;
        this.asset = asset == null ? Asset.WAVES : asset;
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

    public long total() {
        return transfers.stream().mapToLong(Transfer::amount).sum();
    }

    public List<Transfer> transfers() {
        return transfers;
    }

    public Asset asset() {
        return asset;
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
                && this.asset.equals(that.asset)
                && Bytes.equal(this.attachment, that.attachment);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), transfers, asset, attachment);
    }

    public static class MassTransferTransactionBuilder
            extends TransactionBuilder<MassTransferTransactionBuilder, MassTransferTransaction> {
        private final List<Transfer> transfers;
        private Asset asset;
        private byte[] attachment;

        protected MassTransferTransactionBuilder(List<Transfer> transfers) {
            super(LATEST_VERSION, MIN_FEE);
            this.transfers = transfers;
            this.asset = Asset.WAVES;
            this.attachment = Bytes.empty();
        }

        public MassTransferTransactionBuilder asset(Asset asset) {
            this.asset = asset;
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
            return new MassTransferTransaction(sender, transfers, asset, attachment, chainId, fee, timestamp, version);
        }
    }

}
