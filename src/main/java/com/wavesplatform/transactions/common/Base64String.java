package com.wavesplatform.transactions.common;

import com.google.common.base.Suppliers;
import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.base.Base64;

import java.util.Arrays;
import java.util.function.Supplier;

public class Base64String implements ByteString {

    private final byte[] bytes;
    private final Supplier<String> encoded;

    public static Base64String empty() {
        return new Base64String(Bytes.empty());
    }

    public Base64String(byte[] bytes) throws IllegalArgumentException {
        this.bytes = bytes == null ? Bytes.empty() : bytes;
        this.encoded = Suppliers.memoize(() -> Base64.encode(this.bytes))::get;
    }

    public Base64String(String encoded) throws IllegalArgumentException {
        this(Base64.decode(encoded == null ? "" : encoded));
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
        return "base64:" + encoded();
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
