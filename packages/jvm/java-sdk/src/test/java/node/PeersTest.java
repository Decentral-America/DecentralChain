package node;

import base.BaseTestWithNodeInDocker;
import io.decentralchain.sdk.exceptions.NodeException;
import java.io.IOException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class PeersTest extends BaseTestWithNodeInDocker {

  @Test
  void getAllPeers() throws IOException, NodeException {
    Assertions.assertNotNull(node.getAllPeers());
  }

  @Test
  void getBlacklistedPeers() throws IOException, NodeException {
    Assertions.assertNotNull(node.getBlacklistedPeers());
  }

  @Test
  void getConnectedPeers() throws IOException, NodeException {
    Assertions.assertNotNull(node.getConnectedPeers());
  }

  @Test
  void getSuspendedPeers() throws IOException, NodeException {
    Assertions.assertNotNull(node.getSuspendedPeers());
  }
}
