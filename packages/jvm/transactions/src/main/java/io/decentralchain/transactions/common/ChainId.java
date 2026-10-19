package io.decentralchain.transactions.common;

/**
 * DecentralChain network identifiers (the address-scheme byte). Same values as
 * node-scala's BlockchainSettings: mainnet '?', testnet '!', stagenet 'S'.
 */
public abstract class ChainId {

    /** DecentralChain mainnet ('?', 63). */
    public static final byte MAINNET = '?';

    /** DecentralChain testnet ('!', 33). */
    public static final byte TESTNET = '!';

    /** DecentralChain stagenet ('S', 83). */
    public static final byte STAGENET = 'S';

}
