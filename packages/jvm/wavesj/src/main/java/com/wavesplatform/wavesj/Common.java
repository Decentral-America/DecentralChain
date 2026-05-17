package com.wavesplatform.wavesj;

public final class Common {

    private Common() {}

    public static <T> T notNull(final T value, final String name) {
        if (value == null)
            throw new IllegalArgumentException(name + " may not be null");
        return value;
    }

}
