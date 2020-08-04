package im.mak.waves.transactions.common;

import im.mak.waves.crypto.Bytes;

import java.util.Arrays;
import java.util.Objects;

import static java.nio.charset.StandardCharsets.UTF_8;

public class Alias implements Recipient {

    public static final String PREFIX = "alias:";
    public static final byte TYPE = 2;
    public static final int MIN_LENGTH = 4;
    public static final int MAX_LENGTH = 30;
    public static final int BYTES_LENGTH = 1 + 1 + MAX_LENGTH;

    private static final String ALPHABET = "-.0-9@_a-z";

    private final byte[] bytes;
    private final String name;
    private final String fullAlias;

    public Alias(String name) {
        this(WavesJConfig.chainId(), name);
    }

    public Alias(byte chainId, String name) {
        if (isValid(chainId, name)) {
            this.name = name.replaceFirst("^" + PREFIX + (char) chainId + ":", "");
            this.bytes = Bytes.concat(Bytes.of(TYPE, chainId), Bytes.toSizedByteArray(this.name.getBytes(UTF_8)));
            this.fullAlias = PREFIX + (char) bytes[1] + ":" + this.name;
        } else throw new IllegalArgumentException("Alias must be " + MIN_LENGTH
                + " to " + MAX_LENGTH + " long of " + ALPHABET + " characters"
                + " and may have a prefix '" + PREFIX + (char) chainId + ":', but actual is '" + name + "'");
    }

    public static boolean isValid(String alias) {
        return isValid(WavesJConfig.chainId(), alias);
    }

    public static boolean isValid(byte chainId, String alias) {
        String maybeAlias = alias.replaceFirst("^" + PREFIX + (char) chainId + ":", "");

        return maybeAlias.matches("[" + ALPHABET + "]{" + MIN_LENGTH + "," + MAX_LENGTH + "}");
    }

    public static Alias as(String alias) {
        return new Alias(alias);
    }

    public static Alias as(byte chainId, String value) {
        return new Alias(chainId, value);
    }

    public byte type() {
        return TYPE;
    }

    public byte chainId() {
        return bytes[1];
    }

    public String name() {
        return name;
    }

    public byte[] bytes() {
        return bytes;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Alias alias = (Alias) o;
        return Arrays.equals(bytes, alias.bytes) &&
                Objects.equals(name, alias.name) &&
                Objects.equals(fullAlias, alias.fullAlias);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(name, fullAlias);
        result = 31 * result + Arrays.hashCode(bytes);
        return result;
    }

    @Override
    public String toString() {
        return fullAlias;
    }
}
