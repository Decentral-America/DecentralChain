package im.mak.waves.transactions.exchange;

import im.mak.waves.transactions.common.Asset;

import java.util.Objects;

public class AssetPair {

    private final Asset left;
    private final Asset right;

    public AssetPair(Asset left, Asset right) {
        this.left = left == null ? Asset.WAVES : left;
        this.right = right == null ? Asset.WAVES : right;
    }

    public static AssetPair of(Asset left, Asset right) {
        return new AssetPair(left, right);
    }

    public Asset left() {
        return left;
    }

    public Asset right() {
        return right;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AssetPair assetPair = (AssetPair) o;
        return left.equals(assetPair.left) &&
                right.equals(assetPair.right);
    }

    @Override
    public int hashCode() {
        return Objects.hash(left, right);
    }

    @Override
    public String toString() {
        return "AssetPair{" +
                "left=" + left +
                ", right=" + right +
                '}';
    }

}
