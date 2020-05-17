package im.mak.waves.transactions.common;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.base.Base58;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Proof extends Base58Encoded {

    public static final int BYTE_LENGTH = 64;
    public static final Proof EMPTY = new Proof("");

    public Proof(byte[] proof) {
        super(proof);
    }

    public Proof(String proof) {
        super(proof);
    }

    public static List<Proof> emptyList() {
        return new ArrayList<>();
    }

    public static List<Proof> list(Proof... proofs) {
        return new ArrayList<>(Arrays.asList(proofs));
    }

    public static Proof as(byte[] proof) {
        return new Proof(proof);
    }

    public static Proof as(String proof) {
        return new Proof(proof);
    }

    @Override
    protected byte[] validateAndGet(byte[] value) throws IllegalArgumentException {
        if (value.length == 0)
            return Bytes.empty();
        else if (value.length == BYTE_LENGTH)
            return value;
        else throw new IllegalArgumentException("Wrong proof '" + Base58.encode(value)
                    + "' byte length " + value.length + ". Must be " + BYTE_LENGTH);
    }

}
