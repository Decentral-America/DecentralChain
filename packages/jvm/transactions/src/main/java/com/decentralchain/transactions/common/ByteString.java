package com.decentralchain.transactions.common;

public interface ByteString {

    byte[] bytes();
    String encoded();
    String encodedWithPrefix();

}
