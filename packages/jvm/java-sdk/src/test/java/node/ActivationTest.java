package node;

import static org.junit.jupiter.api.Assertions.assertFalse;

import base.BaseTestWithNodeInDocker;
import io.decentralchain.sdk.exceptions.NodeException;
import java.io.IOException;
import org.junit.jupiter.api.Test;

public class ActivationTest extends BaseTestWithNodeInDocker {

  @Test
  void activationStatus() throws NodeException, IOException {
    assertFalse(node.getActivationStatus().features().isEmpty());
  }
}
