package com.wavesplatform.transactions.common;

import com.google.common.base.Suppliers;
import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.base.Base58;

import java.util.Arrays;
import java.util.function.Supplier;

public class Base58String implements ByteString {

    protected final byte[] bytes;
    private final Supplier<String> encoded;

    public static Base58String empty() {
        return new Base58String(Bytes.empty());
    }

    public Base58String(byte[] bytes) throws IllegalArgumentException {
        this.bytes = bytes == null ? Bytes.empty() : bytes;
        this.encoded = Suppliers.memoize(() -> Base58.encode(this.bytes))::get;
    }

    public Base58String(String encoded) throws IllegalArgumentException {
        this(Base58.decode(encoded == null ? "" : encoded));
    }

    @Override
    public byte[] bytes() {
        return bytes;
    }

    @Override
    public String encoded() {
        return encoded.get();
    }

    @Override
    public String encodedWithPrefix() {
        return "base58:" + encoded();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!ByteString.class.isAssignableFrom(o.getClass())) return false;
        ByteString that = (ByteString) o;
        return Arrays.equals(bytes, that.bytes());
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(bytes);
    }

    @Override
    public String toString() {
        return encoded();
    }

}
