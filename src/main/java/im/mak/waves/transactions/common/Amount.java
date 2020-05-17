package im.mak.waves.transactions.common;

import im.mak.waves.crypto.base.Base58;

public class Amount { //TODO use in transactions

    public static Amount of(long value, Base58 assetId) {
        return new Amount(value, assetId);
    }

    private final long value;
    private final Base58 assetId;

    public Amount(long value, Base58 assetId) {
        this.value = value;
        this.assetId = assetId;
    }

    public long value() {
        return this.value;
    }

    public Base58 assetId() {
        return this.assetId;
    }

}
