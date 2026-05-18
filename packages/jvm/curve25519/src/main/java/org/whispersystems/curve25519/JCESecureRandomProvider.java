/*
 * Copyright (C) 2014-2016 Open Whisper Systems
 *
 * Licensed according to the LICENSE file in this repository.
 */

package org.whispersystems.curve25519;

import java.security.SecureRandom;

public class JCESecureRandomProvider implements SecureRandomProvider {

    /**
     * Single shared instance. {@link SecureRandom} is thread-safe; creating a
     * new instance on every call is expensive (OS entropy drain, seeding cost)
     * and may produce weaker output when entropy is scarce.
     */
    private static final SecureRandom INSTANCE = new SecureRandom();

    @Override
    public void nextBytes(byte[] output) {
        INSTANCE.nextBytes(output);
    }

    @Override
    public int nextInt(int maxValue) {
        return INSTANCE.nextInt(maxValue);
    }
}
