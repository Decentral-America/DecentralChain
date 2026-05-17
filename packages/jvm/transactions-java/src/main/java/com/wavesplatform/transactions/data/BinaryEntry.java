package com.wavesplatform.transactions.data;

import com.wavesplatform.transactions.common.Base64String;

import java.util.Objects;

public class BinaryEntry extends DataEntry {

    public static BinaryEntry as(String key, Base64String value) {
        return new BinaryEntry(key, value);
    }

    public static BinaryEntry as(String key, byte[] value) {
        return new BinaryEntry(key, value);
    }

    public static BinaryEntry as(String key, String base64Encoded) {
        return new BinaryEntry(key, base64Encoded);
    }

    public BinaryEntry(String key, Base64String value) {
        super(key, EntryType.BINARY, value == null ? Base64String.empty() : value);
    }

    public BinaryEntry(String key, byte[] value) {
        this(key, new Base64String(value));
    }

    public BinaryEntry(String key, String base64Encoded) {
        this(key, new Base64String(base64Encoded));
    }

    public Base64String value() {
        return (Base64String) super.valueAsObject();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BinaryEntry that = (BinaryEntry) o;
        return this.key().equals(that.key())
                && this.type() == that.type()
                && Objects.equals(this.value(), that.value());
    }

}
