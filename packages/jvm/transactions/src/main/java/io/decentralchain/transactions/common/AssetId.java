package io.decentralchain.transactions.common;

import io.decentralchain.crypto.Bytes;

import java.util.Locale;

public class AssetId extends Id {

    public static final int BYTE_LENGTH = 32;
    public static final AssetId DCC = new AssetId("");

    private static final String DCC_STRING = "DCC";

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
        return new AssetId(id == null || DCC_STRING.equals(id.toUpperCase(Locale.ENGLISH)) ? "" : id);
    }

    public boolean isDcc() {
        return Bytes.equal(this.bytes(), Bytes.empty());
    }

    @Override
    public String toString() {
        return isDcc() ? DCC_STRING : encoded();
    }
}
