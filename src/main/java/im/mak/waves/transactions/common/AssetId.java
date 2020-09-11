package im.mak.waves.transactions.common;

import im.mak.waves.crypto.Bytes;

import java.util.Locale;

public class AssetId extends Id {

    public static final int BYTE_LENGTH = 32;
    public static final AssetId WAVES = new AssetId("");

    private static final String WAVES_STRING = "WAVES";

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
        return new AssetId(id == null || id.toUpperCase(Locale.ENGLISH).equals(WAVES_STRING) ? "" : id);
    }

    public boolean isWaves() {
        return Bytes.equal(this.bytes(), Bytes.empty());
    }

    @Override
    public String toString() {
        return isWaves() ? WAVES_STRING : encoded();
    }
}
