package com.wavesplatform.transactions.data;

import com.wavesplatform.crypto.base.Base64;

import java.util.Objects;

public abstract class DataEntry {

    private final String key;
    private final EntryType type;
    private final Object value;

    protected DataEntry(String key, EntryType type, Object value) {
        this.key = key == null ? "" : key;
        this.type = type == null ? EntryType.DELETE : type;
        this.value = value;
    }

    public String key() {
        return key;
    }

    public EntryType type() {
        return type;
    }

    public Object valueAsObject() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DataEntry that = (DataEntry) o;
        return this.key.equals(that.key)
                && this.type == that.type
                && Objects.equals(this.value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(key, type, value);
    }

    @Override
    public String toString() {
        String value;
        if (this.value == null)
            value = "";
        else if (this.value instanceof byte[])
            value = Base64.encode((byte[]) this.value);
        else if (this.value instanceof Boolean)
            value = String.valueOf((boolean) this.value);
        else if (this.value instanceof Long)
            value = String.valueOf((long) this.value);
        else if (this.value instanceof String)
            value = (String) this.value;
        else value = "<unknown type>";
        return "DataEntry{" +
                "key='" + key + '\'' +
                ", type=" + type +
                ", value=" + value +
                '}';
    }
}
