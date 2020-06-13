package im.mak.waves.transactions.invocation;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.base.Base64;

public class BinaryArg extends Arg {

    public static BinaryArg as(byte[] value) {
        return new BinaryArg(value);
    }

    public static BinaryArg as(String base64Encoded) {
        return new BinaryArg(base64Encoded);
    }

    public BinaryArg(byte[] value) {
        super(ArgType.BINARY, value == null ? Bytes.empty() : value);
    }

    public BinaryArg(String base64Encoded) {
        this(base64Encoded == null ? Bytes.empty() : Base64.decode(base64Encoded));
    }

    public byte[] value() {
        return (byte[]) super.valueAsObject();
    }

    public String valueEncoded() {
        return Base64.encode(value());
    }

}
