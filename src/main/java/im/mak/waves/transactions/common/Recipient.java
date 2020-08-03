package im.mak.waves.transactions.common;

public interface Recipient {

    byte type();

    byte chainId();

    byte[] bytes();

}
