package im.mak.waves.transactions;

import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Recipient;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class TransferTransaction extends Transaction {

    //todo checkstyle custom checks
    public static final int TYPE = 4;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final Recipient recipient;
    private final long amount;
    private final Asset asset;
    private final String attachment;

    public TransferTransaction(PublicKey sender, Recipient recipient, long amount, Asset asset, String attachment, byte chainId, long fee, Asset feeAsset, long timestamp, int version) {
        this(sender, recipient, amount, asset, attachment, chainId, fee, feeAsset, timestamp, version, Proof.emptyList());
    }

    public TransferTransaction(PublicKey sender, Recipient recipient, long amount, Asset asset, String attachment, byte chainId, long fee, Asset feeAsset, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, feeAsset, timestamp, proofs);

        this.recipient = recipient;
        this.amount = amount;
        this.asset = asset;
        this.attachment = attachment;
    }

    public static TransferTransaction fromBytes(byte[] bytes) throws IOException {
        return (TransferTransaction) Transaction.fromBytes(bytes);
    }

    public static TransferTransaction fromJson(String json) throws IOException {
        return (TransferTransaction) Transaction.fromJson(json);
    }

    public static TransferTransactionBuilder with(Recipient recipient, long amount) {
        return new TransferTransactionBuilder(recipient, amount);
    }

    public Recipient recipient() {
        return recipient;
    }

    public long amount() {
        return amount;
    }

    public Asset asset() {
        return asset;
    }

    public String attachment() {
        return attachment;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        TransferTransaction that = (TransferTransaction) o;
        return this.amount == that.amount
                && this.recipient.equals(that.recipient)
                && this.asset.equals(that.asset)
                && this.attachment.equals(that.attachment);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), recipient, amount, asset, attachment);
    }

    public static class TransferTransactionBuilder
            extends TransactionBuilder<TransferTransactionBuilder, TransferTransaction> {
        private final Recipient recipient;
        private final long amount;
        private Asset asset;
        private String attachment;

        protected TransferTransactionBuilder(Recipient recipient, long amount) {
            super(LATEST_VERSION, MIN_FEE);
            this.recipient = recipient;
            this.amount = amount;
            this.asset = Asset.WAVES;
            this.attachment = "";
        }

        public TransferTransactionBuilder asset(Asset asset) {
            this.asset = asset;
            return this;
        }

        public TransferTransactionBuilder attachment(String attachment) {
            this.attachment = attachment;
            return this;
        }

        protected TransferTransaction _build() {
            return new TransferTransaction(sender, recipient, amount, asset, attachment, chainId, fee, feeAsset, timestamp, version);
        }
    }

}
