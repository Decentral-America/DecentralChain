package im.mak.waves.transactions.components;

import im.mak.waves.crypto.base.Base58;

public class Payment {

    private long amount;
    private Base58 assetId;

    public Payment(long amount, Base58 assetId) {
        this.amount = amount;
        this.assetId = assetId;
    }

    public long amount() {
        return amount;
    }

    public Base58 assetId() {
        return assetId;
    }
}
