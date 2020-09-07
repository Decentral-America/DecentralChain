package im.mak.waves.transactions.common;

import im.mak.waves.crypto.Bytes;

public class AssetId extends Id {

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
    public String toString() {
        return isWaves() ? "WAVES" : encoded();
    }
}
