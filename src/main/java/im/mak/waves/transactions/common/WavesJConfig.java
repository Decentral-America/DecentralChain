package im.mak.waves.transactions.common;

//todo threads
public abstract class WavesJConfig {

    public static final byte MAINNET = 'W';
    public static final byte TESTNET = 'T';
    public static final byte STAGENET = 'S';

    private static byte chainId = MAINNET;

    public static byte chainId() {
        return chainId;
    }

    public static void chainId(byte chainId) {
        WavesJConfig.chainId = chainId;
    }

    public static void chainId(char chainId) {
        chainId((byte) chainId);
    }

}
