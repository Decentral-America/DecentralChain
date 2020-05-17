package im.mak.waves.transactions.common;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.base.Base58;

public class Asset extends Base58Encoded {

    public static final int BYTE_LENGTH = 32;
    public static final Asset WAVES = new Asset("");

    public static Asset id(byte[] id) {
        return new Asset(id);
    }

    public static Asset id(String id) {
        return new Asset(id);
    }

    public Asset(byte[] id) {
        super(id);
    }

    public Asset(String id) {
        super(id);
    }

    @Override
    protected byte[] validateAndGet(byte[] value) throws IllegalArgumentException {
        if (value.length == 0)
            return Bytes.empty();
        else if (value.length == BYTE_LENGTH)
            return value;
        else throw new IllegalArgumentException("Wrong asset id '" + Base58.encode(value)
                + "' byte length " + value.length + ". Must be " + BYTE_LENGTH + " or 0 for WAVES");
    }

}
