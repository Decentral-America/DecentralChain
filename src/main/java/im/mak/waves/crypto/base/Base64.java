package im.mak.waves.crypto.base;

/**
 * Base64 is used to represent byte arrays as a readable string.
 *
 * Mainly used to encode binary data entries of account and compiled Ride smart contracts.
 */
public abstract class Base64 {

    /**
     * Encodes the given bytes as a base64 string (no checksum is appended).
     *
     * @param source the bytes to encode
     * @return the base64-encoded string
     */
    public static String encode(byte[] source) {
        return java.util.Base64.getEncoder().encodeToString(source);
    }

    /**
     * Encodes the given bytes as a base64 string with prefix "base64:" (no checksum is appended).
     *
     * @param source the bytes to encode
     * @return the base64-encoded string with prefix "base64:"
     */
    public static String encodeWithPrefix(byte[] source) {
        return "base64:" + java.util.Base64.getEncoder().encodeToString(source);
    }

    /**
     * Decodes the given base64 string into the original data bytes.
     *
     * @param source the base64-encoded string to decode
     * @return the decoded data bytes
     * @throws IllegalArgumentException if the given string is not a valid base64 string
     */
    public static byte[] decode(String source) throws IllegalArgumentException {
        if (source == null) throw new IllegalArgumentException("Base64 string can't be null");
        if (source.startsWith("base64:")) source = source.substring(7);
        return java.util.Base64.getDecoder().decode(source);
    }

}
