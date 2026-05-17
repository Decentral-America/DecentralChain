package com.wavesplatform.transactions.common;

public interface ByteString {

    byte[] bytes();
    String encoded();
    String encodedWithPrefix();

}
