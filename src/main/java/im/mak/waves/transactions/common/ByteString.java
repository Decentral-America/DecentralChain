package im.mak.waves.transactions.common;

public interface ByteString {

    byte[] bytes();
    String encoded();
    String encodedWithPrefix();

}
