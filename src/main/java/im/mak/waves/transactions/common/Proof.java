package im.mak.waves.transactions.common;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Proof extends Base58String {

    public static final byte LATEST_VERSION = 1;
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
    public String toString() {
        return encoded();
    }

}
