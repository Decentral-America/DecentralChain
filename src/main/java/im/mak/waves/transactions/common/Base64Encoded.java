package im.mak.waves.transactions.common;

import im.mak.waves.crypto.base.Base64;

public abstract class Base64Encoded {

    //todo BinaryEntry, CompiledScript, BinaryArg

    private byte[] bytes;

    public byte[] bytes() {
        return this.bytes.clone();
    }

    protected void bytes(byte[] bytes) {
        this.bytes = bytes;
    }

    @Override
    public String toString() {
        return Base64.encode(bytes());
    }

}
