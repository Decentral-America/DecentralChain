package util;

import static io.decentralchain.sdk.util.DccEthConverter.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import io.decentralchain.transactions.common.ChainId;
import io.decentralchain.sdk.Node;
import io.decentralchain.sdk.Profile;
import io.decentralchain.sdk.exceptions.NodeException;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import org.junit.jupiter.api.Test;

public class DccEthConverterTest {

  @Test
  public void convertWavesToEthAddressTest() {
    String ethAddress = wavesToEthAddress("3Mi63XiwniEj6mTC557pxdRDddtpj7fZMMw");
    assertEquals("0xc01187f4ae820a0c956c48c06ee73f85c373cc03", ethAddress);
  }

  @Test
  public void convertEthToWavesAddressTest() {
    String wavesAddress =
        ethToWavesAddress("0xc01187f4ae820a0c956c48c06ee73f85c373cc03", ChainId.STAGENET);
    assertEquals("3Mi63XiwniEj6mTC557pxdRDddtpj7fZMMw", wavesAddress);
  }

  @Test
  public void convertWavesToEthAssetTest() {
    String wavesToEthAsset = wavesToEthAsset("9DNEvLFSSnSSaNCb5WEYMz64hsadDjx1THZw3z2hiyJe");
    assertEquals("0x7a087b3384447a48393eda243e630b07db443597", wavesToEthAsset);
  }

  @Test
  public void convertEthToWavesAssetTest() throws NodeException, IOException {
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
    String wavesToEthAsset = ethToWavesAsset(node, "0x7a087b3384447a48393eda243e630b07db443597");
    assertEquals("9DNEvLFSSnSSaNCb5WEYMz64hsadDjx1THZw3z2hiyJe", wavesToEthAsset);
  }
}
