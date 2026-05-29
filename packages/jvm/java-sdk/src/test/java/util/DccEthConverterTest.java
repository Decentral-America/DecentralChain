package util;

import static io.decentralchain.sdk.util.DccEthConverter.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import io.decentralchain.sdk.Node;
import io.decentralchain.sdk.Profile;
import io.decentralchain.sdk.exceptions.NodeException;
import io.decentralchain.transactions.common.ChainId;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import org.junit.jupiter.api.Test;

public class DccEthConverterTest {

  @Test
  public void convertDccToEthAddressTest() {
    String ethAddress = dccToEthAddress("3Mi63XiwniEj6mTC557pxdRDddtpj7fZMMw");
    assertEquals("0xc01187f4ae820a0c956c48c06ee73f85c373cc03", ethAddress);
  }

  @Test
  public void convertEthToDccAddressTest() {
    String dccAddress =
        ethToDccAddress("0xc01187f4ae820a0c956c48c06ee73f85c373cc03", ChainId.STAGENET);
    assertEquals("3Mi63XiwniEj6mTC557pxdRDddtpj7fZMMw", dccAddress);
  }

  @Test
  public void convertDccToEthAssetTest() {
    String dccToEthAsset = dccToEthAsset("9DNEvLFSSnSSaNCb5WEYMz64hsadDjx1THZw3z2hiyJe");
    assertEquals("0x7a087b3384447a48393eda243e630b07db443597", dccToEthAsset);
  }

  @Test
  public void convertEthToDccAssetTest() throws NodeException, IOException {
    try {
      HttpURLConnection conn =
          (HttpURLConnection)
              new URL("https://stagenet-node.decentralchain.io/node/version").openConnection();
      conn.setConnectTimeout(3_000);
      conn.setReadTimeout(3_000);
      conn.getResponseCode();
    } catch (IOException e) {
      assumeTrue(false, "Stagenet node unreachable — skipping live network test");
    }
    Node node = new Node(Profile.STAGENET);
    String dccToEthAsset = ethToDccAsset(node, "0x7a087b3384447a48393eda243e630b07db443597");
    assertEquals("9DNEvLFSSnSSaNCb5WEYMz64hsadDjx1THZw3z2hiyJe", dccToEthAsset);
  }
}
