package im.mak.waves.transactions.data;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.base.Base64;

public class BinaryEntry extends DataEntry {

    public static BinaryEntry as(String key, byte[] value) {
        return new BinaryEntry(key, value);
    }

    public static BinaryEntry as(String key, String base64Encoded) {
        return new BinaryEntry(key, base64Encoded);
    }

    public BinaryEntry(String key, byte[] value) {
        super(key, EntryType.BINARY, value == null ? Bytes.empty() : value);
    }

    public BinaryEntry(String key, String base64Encoded) {
        this(key, base64Encoded == null ? Bytes.empty() : Base64.decode(base64Encoded));
    }

    public byte[] value() {
        return (byte[]) super.valueAsObject();
    }

    public String valueEncoded() {
        return Base64.encode(value());
    }

}
