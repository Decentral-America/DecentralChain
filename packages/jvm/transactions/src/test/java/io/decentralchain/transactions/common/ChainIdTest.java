package io.decentralchain.transactions.common;

import io.decentralchain.transactions.DccConfig;
import io.decentralchain.transactions.account.Address;
import io.decentralchain.transactions.account.PrivateKey;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ChainIdTest {

    private static final String PHRASE = "blame vacant regret company chase trip grant funny brisk innocent";

    @Test
    void constantsAreTheDecentralChainNetworks() {
        assertThat(ChainId.MAINNET).isEqualTo((byte) '?');
        assertThat(ChainId.TESTNET).isEqualTo((byte) '!');
        assertThat(ChainId.STAGENET).isEqualTo((byte) 'S');
    }

    @Test
    void defaultChainIdIsDecentralChainMainnet() {
        assertThat(DccConfig.DEFAULT_CHAIN_ID).isEqualTo(ChainId.MAINNET);
    }

    @Test
    void addressesMatchTheTypeScriptSdk() {
        // Expected values: @decentralchain/ts-lib-crypto address(PHRASE, '?') and address(PHRASE, '!').
        PrivateKey pk = PrivateKey.fromSeed(PHRASE);
        assertThat(pk.address(ChainId.MAINNET).toString()).isEqualTo("3DR2Sgyu7fbnAjr6DXeBSyQk1cGeXHvUqQ3");
        assertThat(pk.address(ChainId.TESTNET).toString()).isEqualTo("31LtM9ixUNBstCquco4BtReaQj8vDumEhha");
        assertThat(Address.as("31LtM9ixUNBstCquco4BtReaQj8vDumEhha").chainId()).isEqualTo(ChainId.TESTNET);
    }
}
