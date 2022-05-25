package com.wavesplatform.transactions;

import org.web3j.crypto.Bip32ECKeyPair;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.MnemonicUtils;

public class MetamaskHelper {
    public static Credentials generateCredentials(String mnemonic) {
        return generateCredentials(mnemonic, 0);
    }

    public static Credentials generateCredentials(String mnemonic, int index) {
        int[] derivationPath = {44 | Bip32ECKeyPair.HARDENED_BIT, 60 | Bip32ECKeyPair.HARDENED_BIT, 0 | Bip32ECKeyPair.HARDENED_BIT, 0, index};

        Bip32ECKeyPair masterKeypair = Bip32ECKeyPair.generateKeyPair(MnemonicUtils.generateSeed(mnemonic, null));
        Bip32ECKeyPair derivedKeyPair = Bip32ECKeyPair.deriveKeyPair(masterKeypair, derivationPath);
        return Credentials.create(derivedKeyPair);
    }
}
