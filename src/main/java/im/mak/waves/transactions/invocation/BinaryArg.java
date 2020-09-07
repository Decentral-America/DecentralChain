package im.mak.waves.transactions.invocation;

import im.mak.waves.transactions.common.Base64String;

import java.util.Objects;

public class BinaryArg extends Arg {

    public static BinaryArg as(Base64String value) {
        return new BinaryArg(value);
    }

    public static BinaryArg as(byte[] value) {
        return new BinaryArg(value);
    }

    public static BinaryArg as(String base64Encoded) {
        return new BinaryArg(base64Encoded);
    }

    public BinaryArg(Base64String value) {
        super(ArgType.BINARY, value == null ? Base64String.empty() : value);
    }

    public BinaryArg(byte[] value) {
        this(new Base64String(value));
    }

    public BinaryArg(String base64Encoded) {
        this(new Base64String(base64Encoded));
    }

    public Base64String value() {
        return (Base64String) super.valueAsObject();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BinaryArg that = (BinaryArg) o;
        return this.type().equals(that.type())
                && Objects.equals(this.value(), that.value());
    }

}
