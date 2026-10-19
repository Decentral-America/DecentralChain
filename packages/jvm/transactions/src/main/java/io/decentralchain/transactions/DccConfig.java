package io.decentralchain.transactions;

import io.decentralchain.transactions.common.ChainId;

public abstract class DccConfig {

    private static byte chainId = ChainId.MAINNET;

    public static byte chainId() {
        return chainId;
    }

    public static void chainId(byte chainId) {
        DccConfig.chainId = chainId;
    }

    public static void chainId(char chainId) {
        chainId((byte) chainId);
    }

}
