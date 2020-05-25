package im.mak.waves.transactions;

import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Recipient;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class LeaseTransaction extends Transaction {

    //todo checkstyle custom checks
    public static final int TYPE = 8;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 100_000;

    private final Recipient recipient;
    private final long amount;

    //todo third shortest constructor LeaseTransaction(PublicKey sender, Recipient recipient, long amount)
    public LeaseTransaction(PublicKey sender, Recipient recipient, long amount, byte chainId, long fee, long timestamp, int version) {
        this(sender, recipient, amount, chainId, fee, timestamp, version, Proof.emptyList());
    }

    public LeaseTransaction(PublicKey sender, Recipient recipient, long amount, byte chainId, long fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, Asset.WAVES, timestamp, proofs);

        this.recipient = recipient;
        this.amount = amount;
    }

    public static LeaseTransaction fromBytes(byte[] bytes) throws IOException {
        return (LeaseTransaction) Transaction.fromBytes(bytes);
    }

    public static LeaseTransaction fromJson(String json) throws IOException {
        return (LeaseTransaction) Transaction.fromJson(json);
    }

    public static LeaseTransactionBuilder with(Recipient recipient, long amount) {
        return new LeaseTransactionBuilder(recipient, amount);
    }

    public Recipient recipient() {
        return recipient;
    }

    public long amount() {
        return amount;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        LeaseTransaction that = (LeaseTransaction) o;
        return this.amount == that.amount
                && this.recipient.equals(that.recipient);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), recipient, amount);
    }

    public static class LeaseTransactionBuilder
            extends TransactionBuilder<LeaseTransactionBuilder, LeaseTransaction> {
        private final Recipient recipient;
        private final long amount;

        protected LeaseTransactionBuilder(Recipient recipient, long amount) {
            super(LATEST_VERSION, MIN_FEE);
            this.recipient = recipient;
            this.amount = amount;
        }

        protected LeaseTransaction _build() {
            return new LeaseTransaction(sender, recipient, amount, chainId, fee, timestamp, version);
        }
    }

}
