package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.*;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

import static java.nio.charset.StandardCharsets.UTF_8;

public class TransferTransaction extends Transaction {

    public static final int TYPE = 4;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final Recipient recipient;
    private final Amount amount;
    private final byte[] attachment;

    public TransferTransaction(PublicKey sender, Recipient recipient, Amount amount, byte[] attachment) {
        this(sender, recipient, amount, attachment, Waves.chainId, Amount.of(MIN_FEE),
                System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public TransferTransaction(PublicKey sender, Recipient recipient, Amount amount, byte[] attachment,
                               byte chainId, Amount fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);

        this.recipient = recipient;
        this.amount = amount == null ? Amount.of(0, Asset.WAVES) : amount;
        this.attachment = attachment;
    }

    public static TransferTransaction fromBytes(byte[] bytes) throws IOException {
        return (TransferTransaction) Transaction.fromBytes(bytes);
    }

    public static TransferTransaction fromJson(String json) throws IOException {
        return (TransferTransaction) Transaction.fromJson(json);
    }

    public static TransferTransactionBuilder with(Recipient recipient, Amount amount) {
        return new TransferTransactionBuilder(recipient, amount);
    }

    public Recipient recipient() {
        return recipient;
    }

    public Amount amount() {
        return amount;
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
        TransferTransaction that = (TransferTransaction) o;
        return this.amount.equals(that.amount)
                && this.recipient.equals(that.recipient)
                && Bytes.equal(this.attachment, that.attachment);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), recipient, amount, attachment);
    }

    public static class TransferTransactionBuilder
            extends TransactionBuilder<TransferTransactionBuilder, TransferTransaction> {
        private final Recipient recipient;
        private final Amount amount;
        private byte[] attachment;

        protected TransferTransactionBuilder(Recipient recipient, Amount amount) {
            super(LATEST_VERSION, MIN_FEE);
            this.recipient = recipient;
            this.amount = amount;
            this.attachment = Bytes.empty();
        }

        public TransferTransactionBuilder attachment(byte[] attachment) {
            this.attachment = attachment;
            return this;
        }

        public TransferTransactionBuilder attachment(String attachment) {
            return attachment(attachment.getBytes(UTF_8));
        }

        protected TransferTransaction _build() {
            return new TransferTransaction(
                    sender, recipient, amount, attachment, chainId, fee, timestamp, version, Proof.emptyList());
        }
    }

}
