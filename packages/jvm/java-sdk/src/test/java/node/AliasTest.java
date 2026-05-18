package node;

import static org.assertj.core.api.Assertions.assertThat;

import base.BaseTestWithNodeInDocker;
import com.decentralchain.transactions.CreateAliasTransaction;
import com.decentralchain.transactions.account.PrivateKey;
import com.decentralchain.transactions.common.Alias;
import io.decentralchain.sdk.exceptions.NodeException;
import java.io.IOException;
import org.junit.jupiter.api.Test;

public class AliasTest extends BaseTestWithNodeInDocker {

  @Test
  void aliases() throws IOException, NodeException {
    PrivateKey alice = createAccountWithBalance(CreateAliasTransaction.MIN_FEE);
    Alias alias = Alias.as("alias-" + System.currentTimeMillis());

    node.waitForTransaction(
        node.broadcast(CreateAliasTransaction.builder(alias.toString()).getSignedWith(alice)).id());

    assertThat(node.getAliasesByAddress(alice.address())).containsExactly(alias);
    assertThat(node.getAddressByAlias(alias)).isEqualTo(alice.address());
  }
}
