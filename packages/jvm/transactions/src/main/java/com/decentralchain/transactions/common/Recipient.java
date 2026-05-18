package com.decentralchain.transactions.common;

public interface Recipient {

    byte type();

    byte chainId();

    byte[] bytes();

}
