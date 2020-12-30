package com.wavesplatform.transactions;

import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.*;
import im.mak.waves.transactions.common.*;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class TransferTransaction extends Transaction {

    public static final int TYPE = 4;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final Recipient recipient;
    private final Amount amount;
    private final Base58String attachment;

    public TransferTransaction(PublicKey sender, Recipient recipient, Amount amount, Base58String attachment) {
        this(sender, recipient, amount, attachment, WavesConfig.chainId(), Amount.of(MIN_FEE),
                System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public TransferTransaction(PublicKey sender, Recipient recipient, Amount amount, Base58String attachment,
                               byte chainId, Amount fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);

        this.recipient = recipient;
        this.amount = amount == null ? Amount.of(0, AssetId.WAVES) : amount;
        this.attachment = attachment;
    }

    public static TransferTransaction fromBytes(byte[] bytes) throws IOException {
        return (TransferTransaction) Transaction.fromBytes(bytes);
    }

    public static TransferTransaction fromJson(String json) throws IOException {
        return (TransferTransaction) Transaction.fromJson(json);
    }

    public static TransferTransactionBuilder builder(Recipient recipient, Amount amount) {
        return new TransferTransactionBuilder(recipient, amount);
    }

    public Recipient recipient() {
        return recipient;
    }

    public Amount amount() {
        return amount;
    }

    public Base58String attachment() {
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
                && this.attachment.equals(that.attachment);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), recipient, amount, attachment);
    }

    public static class TransferTransactionBuilder
            extends TransactionBuilder<TransferTransactionBuilder, TransferTransaction> {
        private final Recipient recipient;
        private final Amount amount;
        private Base58String attachment;

        protected TransferTransactionBuilder(Recipient recipient, Amount amount) {
            super(LATEST_VERSION, MIN_FEE);
            this.recipient = recipient;
            this.amount = amount;
            this.attachment = Base58String.empty();
        }

        public TransferTransactionBuilder attachment(Base58String attachment) {
            this.attachment = attachment;
            return this;
        }

        protected TransferTransaction _build() {
            return new TransferTransaction(sender, recipient, amount, attachment,
                    chainId, feeWithExtra(), timestamp, version, Proof.emptyList());
        }
    }

}
