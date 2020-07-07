package im.mak.waves.transactions.common;

import java.util.Objects;

public class Amount {

    private final long value;
    private final AssetId assetId;

    public Amount(long value, AssetId assetId) {
        this.value = value;
        this.assetId = assetId == null ? AssetId.WAVES : assetId;
    }

    public Amount(long value) {
        this(value, AssetId.WAVES);
    }

    public static Amount of(long value, AssetId assetId) {
        return new Amount(value, assetId);
    }

    public static Amount of(long value) {
        return new Amount(value);
    }

    public long value() {
        return this.value;
    }

    public AssetId assetId() {
        return this.assetId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Amount that = (Amount) o;
        return this.value == that.value
                && this.assetId.equals(that.assetId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value, assetId);
    }

    @Override
    public String toString() {
        return "Amount{" +
                "value=" + value +
                ", asset=" + assetId +
                '}';
    }

}
