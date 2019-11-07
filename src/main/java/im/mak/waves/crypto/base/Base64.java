package im.mak.waves.crypto.base;

import java.util.Arrays;

/**
 * Base64 is used to represent byte arrays as a readable string.
 *
 * Mainly used to encode binary data entries of account and compiled Ride smart contracts.
 */
public class Base64 {

    /**
     * Encodes the given bytes as a base64 string (no checksum is appended).
     *
     * @param source the bytes to encode
     * @return the base64-encoded string
     */
    public static String encode(byte[] source) {
        return new Base64(source).encoded();
    }

    /**
     * Decodes the given base64 string into the original data bytes.
     *
     * @param source the base64-encoded string to decode
     * @return the decoded data bytes
     * @throws IllegalArgumentException if the given string is not a valid base64 string
     */
    public static byte[] decode(String source) throws IllegalArgumentException {
        return new Base64(source).decoded();
    }

    private byte[] bytes;
    private String encoded;

    /**
     * Create Base64 from array of bytes.
     *
     * @param source the bytes to encode
     */
    public Base64(byte[] source) {
        this.encoded = java.util.Base64.getEncoder().encodeToString(source);
        this.bytes = source.clone();
    }

    /**
     * Create Base64 from base64-encoded string.
     *
     * @param encodedString base64-encoded string
     * @throws IllegalArgumentException if the string is null or can't be parsed as base64 string
     */
    public Base64(String encodedString) {
        if (encodedString == null) throw new IllegalArgumentException("Base64 string can't be null");
        if (encodedString.startsWith("base64:")) encodedString = encodedString.substring(7);
        this.bytes = java.util.Base64.getDecoder().decode(encodedString);
        this.encoded = encodedString;
    }

    /**
     * Get encoded string of the bytes.
     *
     * @return base64-encoded string
     */
    public String encoded() {
        return this.encoded;
    }

    /**
     * Get original bytes.
     *
     * @return decoded array of bytes
     */
    public byte[] decoded() {
        return this.bytes;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Base64 base64 = (Base64) o;
        return Arrays.equals(bytes, base64.bytes);
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(bytes);
    }

    @Override
    public String toString() {
        return this.encoded();
    }

}
