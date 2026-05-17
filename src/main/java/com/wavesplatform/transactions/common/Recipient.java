package com.wavesplatform.transactions.common;

public interface Recipient {

    byte type();

    byte chainId();

    byte[] bytes();

}
