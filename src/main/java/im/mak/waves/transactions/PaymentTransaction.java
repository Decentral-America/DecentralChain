package im.mak.waves.transactions;

import im.mak.waves.crypto.account.Address;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Id;

import java.io.IOException;
import java.util.Objects;

@Deprecated
public class PaymentTransaction extends Transaction {

    public static final int TYPE = 2;
    public static final int LATEST_VERSION = 1;
    public static final long MIN_FEE = 100_000; //todo ???

    private final Address recipient;
    private final long amount;

    public PaymentTransaction(PublicKey sender, Address recipient, long amount, long fee, long timestamp) {
        this(sender, recipient, amount, fee, timestamp, null);
    }

    public PaymentTransaction(
            PublicKey sender, Address recipient, long amount, long fee, long timestamp, Proof signature) {
        super(TYPE, LATEST_VERSION, recipient.chainId(), sender, fee, Asset.WAVES, timestamp,
                signature == null ? Proof.emptyList() : Proof.list(signature));

        this.recipient = recipient;
        this.amount =  amount;
    }

    public static PaymentTransaction fromBytes(byte[] bytes) throws IOException {
        return (PaymentTransaction) Transaction.fromBytes(bytes);
    }

    public static PaymentTransaction fromJson(String json) throws IOException {
        return (PaymentTransaction) Transaction.fromJson(json);
    }

    @Override
    public Id id() {
        return Id.as(proofs().get(0).bytes());
    }

    public Address recipient() {
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
        PaymentTransaction that = (PaymentTransaction) o;
        return this.recipient.equals(that.recipient) && this.amount == that.amount;
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), recipient, amount);
    }

}
