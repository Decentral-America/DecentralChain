package im.mak.waves.transactions.components;

import im.mak.waves.crypto.Bytes;

public class BinaryEntry extends DataEntry {

    public static BinaryEntry as(String key, byte[] value) {
        return new BinaryEntry(key, value);
    }

    public BinaryEntry(String key, byte[] value) {
        super(key, EntryType.BINARY, value == null ? Bytes.empty() : value);
    }

    public byte[] value() {
        return (byte[]) super.valueAsObject();
    }

}
