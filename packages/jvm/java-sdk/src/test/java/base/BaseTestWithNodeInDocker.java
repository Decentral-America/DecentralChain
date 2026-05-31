package base;

import static java.time.temporal.ChronoUnit.MINUTES;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import io.decentralchain.crypto.Crypto;
import io.decentralchain.sdk.Node;
import io.decentralchain.sdk.Profile;
import io.decentralchain.sdk.exceptions.NodeException;
import io.decentralchain.transactions.DccConfig;
import io.decentralchain.transactions.TransferTransaction;
import io.decentralchain.transactions.account.PrivateKey;
import io.decentralchain.transactions.common.Amount;
import io.decentralchain.transactions.common.Id;
import java.io.IOException;
import java.net.URISyntaxException;
import java.time.Duration;
import org.junit.jupiter.api.BeforeAll;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

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
        container =
            new GenericContainer<>(
                    DockerImageName.parse("ghcr.io/decentral-america/node-scala-private:latest"))
                .withExposedPorts(6869)
                // Env vars consumed by the Docker image entrypoint script
                // (docker/entrypoint.sh) — DCC node-scala conventions.
                .withEnv(
                    "DCC_WALLET_SEED", "TBXHUUcVx2n3Rgszpu5MCybRaR86JGmqCWp7XKh7czU57ox5dgjdX4K4")
                .withEnv("DCC_WALLET_PASSWORD", "test")
                .withEnv("DCC_REST_API_BIND", "0.0.0.0")
                .waitingFor(Wait.forHttp("/node/version").forPort(6869).forStatusCode(200))
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
        // Propagate the node's chain-id (e.g. 82 for DCC private node)
        // into DccConfig (upstream class name) so that all subsequent
        // PrivateKey.fromSeed() and Address construction uses the correct
        // chain-id byte. Without this, DccConfig stays at its default
        // (87 = mainnet 'W'), and the node rejects every address as
        // wrong chain.
        DccConfig.chainId(node.chainId());
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

  private static String requireEnv(String name) {
    String value = System.getenv(name);
    if (value == null || value.isEmpty()) {
      throw new IllegalStateException(name + " env var is required — see .env.example");
    }
    return value;
  }

  protected static final PrivateKey faucet =
      DOCKER_AVAILABLE ? PrivateKey.fromSeed(requireEnv("DCC_TEST_MINER_SEED")) : null;

  protected static PrivateKey createAccountWithBalance() throws IOException, NodeException {
    return PrivateKey.fromSeed(Crypto.getRandomSeedBytes());
  }

  protected static PrivateKey createAccountWithBalance(long dccAmount)
      throws IOException, NodeException {
    PrivateKey account = createAccountWithBalance();

    Id transferTx =
        node.broadcast(
                TransferTransaction.builder(account.address(), Amount.of(dccAmount))
                    .getSignedWith(faucet))
            .id();
    node.waitForTransaction(transferTx);

    return account;
  }

  protected static void printTxInfo(String description, Id txId) {
    System.out.println(
        description + ":\t" + NODE_API_URL + "/transactions/info/" + txId.toString());
  }
}
