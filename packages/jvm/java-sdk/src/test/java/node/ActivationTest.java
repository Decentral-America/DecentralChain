package node;

import base.BaseTestWithNodeInDocker;
import io.decentralchain.sdk.exceptions.NodeException;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertFalse;

public class ActivationTest extends BaseTestWithNodeInDocker {

    @Test
    void activationStatus() throws NodeException, IOException {
        assertFalse(node.getActivationStatus().features().isEmpty());
    }

}
