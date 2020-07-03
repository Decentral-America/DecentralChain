package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.Hash;
import im.mak.waves.crypto.account.Address;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Id;
import im.mak.waves.transactions.serializers.BytesWriter;

import java.io.IOException;
import java.util.Objects;

public class GenesisTransaction extends Transaction {

    public static final int TYPE = 1;
    public static final int LATEST_VERSION = 1;

    private final Address recipient;
    private final long amount;

    public GenesisTransaction(Address recipient, long amount, long timestamp) {
        super(TYPE, LATEST_VERSION, recipient.chainId(), PublicKey.as(new byte[PublicKey.BYTES_LENGTH]),
                0, Asset.WAVES, timestamp, Proof.list(generateSignature(recipient, amount, timestamp)));

        this.recipient = recipient;
        this.amount =  amount;
    }

    private static Proof generateSignature(Address recipient, long amount, long timestamp) {
        byte[] message = new BytesWriter()
                .writeInt(TYPE)
                .writeLong(timestamp)
                .write(recipient.bytes())
                .writeLong(amount)
                .getBytes();
        byte[] hash = Hash.blake(message);
        return Proof.as(Bytes.concat(hash, hash));
    }

    public static GenesisTransaction fromBytes(byte[] bytes) throws IOException {
        return (GenesisTransaction) Transaction.fromBytes(bytes);
    }

    public static GenesisTransaction fromJson(String json) throws IOException {
        return (GenesisTransaction) Transaction.fromJson(json);
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
        GenesisTransaction that = (GenesisTransaction) o;
        return this.recipient.equals(that.recipient) && this.amount == that.amount;
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), recipient, amount);
    }

}
