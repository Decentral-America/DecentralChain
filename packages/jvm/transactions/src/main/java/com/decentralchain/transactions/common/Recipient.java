package io.decentralchain.transactions.common;

public interface Recipient {

    byte type();

    byte chainId();

    byte[] bytes();

}
