package im.mak.waves.transactions.common;

import java.util.Objects;

public class Amount { //TODO use in all transactions

    private final long value;
    private final Asset asset;

    public Amount(long value, Asset asset) {
        this.value = value;
        this.asset = asset == null ? Asset.WAVES : asset;
    }

    public Amount(long value) {
        this(value, Asset.WAVES);
    }

    public static Amount of(long value, Asset asset) {
        return new Amount(value, asset);
    }

    public static Amount of(long value) {
        return new Amount(value);
    }

    public long value() {
        return this.value;
    }

    public Asset asset() {
        return this.asset;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Amount that = (Amount) o;
        return this.value == that.value
                && this.asset.equals(that.asset);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value, asset);
    }

    @Override
    public String toString() {
        return "Amount{" +
                "value=" + value +
                ", asset=" + asset +
                '}';
    }

}
