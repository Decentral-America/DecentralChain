package org.whispersystems.curve25519.java;

import java.security.MessageDigest;

public interface Sha512 {

  public void calculateDigest(byte[] out, byte[] in, long length);
  public MessageDigest initDigest();
  public void updateDigest(MessageDigest md, byte[] in, long length);
  public void finishDigest(byte[] out, MessageDigest md);

}
