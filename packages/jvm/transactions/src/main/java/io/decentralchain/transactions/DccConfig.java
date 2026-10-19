package io.decentralchain.transactions;

import io.decentralchain.transactions.common.ChainId;

public abstract class DccConfig {

    /**
     * Chain id used by convenience constructors that take no explicit chain id.
     * DecentralChain mainnet, like the TypeScript SDK. For testnet call
     * {@code DccConfig.chainId(ChainId.TESTNET)} once, or pass a chain id to the
     * builder's {@code chainId(...)}.
     */
    public static final byte DEFAULT_CHAIN_ID = ChainId.MAINNET;

    private static byte chainId = DEFAULT_CHAIN_ID;

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
