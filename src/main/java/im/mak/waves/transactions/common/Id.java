package im.mak.waves.transactions.common;

import im.mak.waves.crypto.base.Base58;

public class Id extends Base58Encoded {

    public static final int BYTE_LENGTH = 32;

    public Id(byte[] id) {
        super(id);
    }

    public Id(String id) {
        super(id);
    }

    public static Id as(byte[] id) {
        return new Id(id);
    }

    public static Id as(String id) {
        return new Id(id);
    }

    @Override
    protected byte[] validateAndGet(byte[] value) throws IllegalArgumentException {
        if (value.length == BYTE_LENGTH || value.length == BYTE_LENGTH * 2) // x2 for PaymentTransaction
            return value;
        else throw new IllegalArgumentException("Wrong id '" + Base58.encode(value)
                + "' byte length " + value.length + ". Must be " + BYTE_LENGTH);
    }

}
