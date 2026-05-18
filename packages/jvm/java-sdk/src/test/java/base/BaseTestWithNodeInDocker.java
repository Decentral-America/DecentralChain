package base;

import com.wavesplatform.crypto.Crypto;
import com.wavesplatform.transactions.TransferTransaction;
import com.wavesplatform.transactions.account.PrivateKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.Id;
import io.decentralchain.sdk.Node;
import io.decentralchain.sdk.Profile;
import io.decentralchain.sdk.exceptions.NodeException;
import org.junit.jupiter.api.BeforeAll;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;

import java.io.IOException;
import java.net.URISyntaxException;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalUnit;

import static java.time.temporal.ChronoUnit.MINUTES;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

public abstract class BaseTestWithNodeInDocker {
    private static final boolean DEBUG = false;
    private static final boolean DOCKER_AVAILABLE;
    private static final GenericContainer<?> NODE_CONTAINER;
    private static final String NODE_API_URL;

    static {
        boolean dockerAvailable = false;
        GenericContainer<?> container = null;
        String apiUrl = null;

        if (DEBUG) {
            dockerAvailable = true;
            apiUrl = Profile.LOCAL.uri().toString();
        } else {
            try {
                container = new GenericContainer<>(DockerImageName.parse("wavesplatform/waves-private-node:v1.6.0"))
                        .withExposedPorts(6869)
                        .withStartupTimeout(Duration.of(5, MINUTES));
                container.start();
                apiUrl = "http://" + container.getHost() + ":" + container.getFirstMappedPort();
                dockerAvailable = true;
            } catch (Exception ignored) {
                // Docker not available — tests will be skipped via @BeforeAll assumption
            }
        }

        DOCKER_AVAILABLE = dockerAvailable;
        NODE_CONTAINER = container;
        NODE_API_URL = apiUrl;
    }

    protected static final Node node;

    static {
        if (DOCKER_AVAILABLE) {
            try {
                node = new Node(NODE_API_URL);
            } catch (URISyntaxException | NodeException | IOException e) {
                throw new RuntimeException(e);
            }
        } else {
            node = null;
        }
    }

    @BeforeAll
    static void requireDocker() {
        assumeTrue(DOCKER_AVAILABLE, "Docker not available — skipping Docker integration test");
    }

    protected static final PrivateKey faucet = PrivateKey.fromSeed("waves private node seed with waves tokens");

    protected static PrivateKey createAccountWithBalance() throws IOException, NodeException {
        return PrivateKey.fromSeed(Crypto.getRandomSeedBytes());
    }

    protected static PrivateKey createAccountWithBalance(long wavesAmount) throws IOException, NodeException {
        PrivateKey account = createAccountWithBalance();

        Id transferTx = node.broadcast(TransferTransaction
                .builder(account.address(), Amount.of(wavesAmount))
                .getSignedWith(faucet)).id();
        node.waitForTransaction(transferTx);

        return account;
    }

    protected static void printTxInfo(String description, Id txId) {
        System.out.println(description + ":\t" + NODE_API_URL + "/transactions/info/" + txId.toString());
    }
}

