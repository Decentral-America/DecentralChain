package im.mak.waves.transactions.common;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.base.Base58;

import java.util.Arrays;

public abstract class Base58Encoded {

    private final byte[] bytes;

    public Base58Encoded(byte[] bytes) throws IllegalArgumentException {
        this.bytes = _validate(bytes);
    }

    public Base58Encoded(String value) throws IllegalArgumentException {
        this(value == null ? Bytes.empty() : Base58.decode(value));
    }

    public byte[] bytes() {
        return this.bytes.clone();
    }

    private byte[] _validate(byte[] value) {
        return validateAndGet(value == null ? Bytes.empty() : value);
    }

    protected abstract byte[] validateAndGet(byte[] value) throws IllegalArgumentException;

    public boolean equals(byte[] id) {
        return Bytes.equal(this.bytes, id);
    }

    public boolean equals(String id) {
        return id != null && this.equals(id);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Base58Encoded that = (Base58Encoded) o;
        return Arrays.equals(this.bytes, that.bytes);
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(bytes);
    }

    @Override
    public String toString() {
        return Base58.encode(bytes());
    }

}
