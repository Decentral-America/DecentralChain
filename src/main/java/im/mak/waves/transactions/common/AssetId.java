package im.mak.waves.transactions.common;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.base.Base58;

public class AssetId extends Base58Encoded {

    public static final int BYTE_LENGTH = 32;
    public static final AssetId WAVES = new AssetId("");

    public AssetId(byte[] id) {
        super(id);
    }

    public AssetId(String id) {
        super(id);
    }

    public static AssetId as(byte[] id) {
        return new AssetId(id);
    }

    public static AssetId as(String id) {
        return new AssetId(id);
    }

    public boolean isWaves() {
        return Bytes.equal(this.bytes(), Bytes.empty());
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

    @Override
    public String toString() {
        return isWaves() ? "WAVES" : super.toString();
    }
}
