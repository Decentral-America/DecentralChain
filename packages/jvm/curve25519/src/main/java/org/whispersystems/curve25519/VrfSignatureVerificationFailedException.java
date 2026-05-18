/*
 * Copyright (C) 2014-2016 Open Whisper Systems
 *
 * Licensed according to the LICENSE file in this repository.
 */

package org.whispersystems.curve25519;

public class VrfSignatureVerificationFailedException extends Exception {

    public VrfSignatureVerificationFailedException() {
        super();
    }

    public VrfSignatureVerificationFailedException(String message) {
        super(message);
    }

    public VrfSignatureVerificationFailedException(Exception exception) {
        super(exception);
    }
}
