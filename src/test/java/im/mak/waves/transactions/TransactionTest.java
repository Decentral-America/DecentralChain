package im.mak.waves.transactions;

import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.Alias;
import im.mak.waves.transactions.common.Recipient;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class TransactionTest {

    @Test
    void twoSubTypes__withSameFields_areNotEqual() { //todo standardize test naming
        PublicKey sender = PublicKey.as("AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV");
        long timestamp = 1600000000000L;

        Transaction leaseTx = LeaseTransaction
                .with(Alias.as("rich"), 100)
                .sender(sender)
                .timestamp(timestamp)
                .getUnsigned();

        Transaction leaseCancelTx = LeaseCancelTransaction
                .with(leaseTx.id())
                .sender(sender)
                .timestamp(timestamp)
                .getUnsigned();

        assertThat(leaseTx).isNotEqualTo(leaseCancelTx);
    }

}
