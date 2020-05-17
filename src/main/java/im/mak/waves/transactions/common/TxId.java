package im.mak.waves.transactions.common;

import im.mak.waves.crypto.base.Base58;

public class TxId extends Base58Encoded {

    public static final int BYTE_LENGTH = 32;

    public static TxId id(byte[] id) {
        return new TxId(id);
    }

    public static TxId id(String id) {
        return new TxId(id);
    }

    public TxId(byte[] id) {
        super(id);
    }

    public TxId(String id) {
        super(id);
    }

    @Override
    protected byte[] validateAndGet(byte[] value) throws IllegalArgumentException {
        if (value.length == BYTE_LENGTH)
            return value;
        else throw new IllegalArgumentException("Wrong transaction id '" + Base58.encode(value)
                + "' byte length " + value.length + ". Must be " + BYTE_LENGTH);
    }

}
