package io.decentralchain.sdk.util;

import static com.wavesplatform.crypto.Hash.blake;
import static com.wavesplatform.crypto.Hash.keccak;
import static com.wavesplatform.crypto.base.Base58.encode;
import static java.util.Arrays.copyOfRange;
import static org.bouncycastle.util.encoders.Hex.decode;

import com.wavesplatform.crypto.base.Base58;
import io.decentralchain.sdk.Node;
import io.decentralchain.sdk.exceptions.NodeException;
import java.io.IOException;
import org.bouncycastle.util.encoders.Hex;
import org.web3j.utils.Numeric;

public class DccEthConverter {

  private DccEthConverter() {}

  /** Concatenates two byte arrays without any external dependency. */
  private static byte[] concat(byte[] a, byte[] b) {
    byte[] result = new byte[a.length + b.length];
    System.arraycopy(a, 0, result, 0, a.length);
    System.arraycopy(b, 0, result, a.length, b.length);
    return result;
  }

  public static String wavesToEthAddress(String address) {
    byte[] wavesAddress = Base58.decode(address);
    byte[] ethAddress = copyOfRange(wavesAddress, 2, 22);
    return Numeric.toHexString(ethAddress);
  }

  public static String ethToWavesAddress(String address, byte chainId) {
    byte[] pkHash = copyOfRange(decode(address.substring(2)), 0, 20);
    byte[] prefixBytes = new byte[] {0x01, chainId};
    byte[] checkSumBytes = concat(prefixBytes, pkHash);
    byte[] checkSum = keccak(blake(checkSumBytes));
    byte[] wavesBytes = concat(concat(prefixBytes, pkHash), copyOfRange(checkSum, 0, 4));
    return encode(wavesBytes);
  }

  public static String wavesToEthAsset(String asset) {
    byte[] decode = copyOfRange(Base58.decode(asset), 0, 20);
    return "0x" + Hex.toHexString(decode);
  }

  public static String ethToWavesAsset(Node node, String asset) throws NodeException, IOException {
    return node.ethToWavesAsset(asset);
  }
}
