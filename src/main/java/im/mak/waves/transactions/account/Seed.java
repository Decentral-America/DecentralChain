package im.mak.waves.transactions.account;

import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

/**
 * Seed is a set of bytes that private and public keys are deterministically generated from.
 */
public abstract class Seed {

    /**
     * Generates random seed bytes.
     *
     * @return byte[] random seed bytes
     */
    public static byte[] randomBytes() {
        byte[] bytes = new byte[120]; //todo length? readable?
        try {
            SecureRandom.getInstanceStrong().nextBytes(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Failed to get random number generator", e);
        }
        return bytes;
    }

}
