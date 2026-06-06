package io.decentralchain.sdk.util;

import io.decentralchain.crypto.Hash;
import io.decentralchain.crypto.base.Base58;
import io.decentralchain.sdk.Node;
import io.decentralchain.sdk.exceptions.NodeException;
import java.io.IOException;
import java.util.Arrays;
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

  public static String dccToEthAddress(String address) {
    byte[] dccAddress = Base58.decode(address);
    byte[] ethAddress = Arrays.copyOfRange(dccAddress, 2, 22);
    return Numeric.toHexString(ethAddress);
  }

  public static String ethToDccAddress(String address, byte chainId) {
    byte[] pkHash = Arrays.copyOfRange(Hex.decode(address.substring(2)), 0, 20);
    byte[] prefixBytes = new byte[] {0x01, chainId};
    byte[] checkSumBytes = concat(prefixBytes, pkHash);
    byte[] checkSum = Hash.keccak(Hash.blake(checkSumBytes));
    byte[] dccBytes = concat(concat(prefixBytes, pkHash), Arrays.copyOfRange(checkSum, 0, 4));
    return Base58.encode(dccBytes);
  }

  public static String dccToEthAsset(String asset) {
    byte[] decode = Arrays.copyOfRange(Base58.decode(asset), 0, 20);
    return "0x" + Hex.toHexString(decode);
  }

  public static String ethToDccAsset(Node node, String asset) throws NodeException, IOException {
    return node.ethToDccAsset(asset);
  }
}
