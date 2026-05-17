package com.wavesplatform.transactions.exchange;

import com.wavesplatform.transactions.common.AssetId;

import java.util.Objects;

public class AssetPair {

    private final AssetId left;
    private final AssetId right;

    public AssetPair(AssetId left, AssetId right) {
        this.left = left == null ? AssetId.WAVES : left;
        this.right = right == null ? AssetId.WAVES : right;
    }

    public static AssetPair of(AssetId left, AssetId right) {
        return new AssetPair(left, right);
    }

    public AssetId left() {
        return left;
    }

    public AssetId right() {
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
