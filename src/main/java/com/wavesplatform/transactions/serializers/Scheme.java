package com.wavesplatform.transactions.serializers;

import im.mak.waves.transactions.*;
import com.wavesplatform.transactions.exchange.Order;

public enum Scheme {

    WITH_SIGNATURE, WITH_PROOFS, PROTOBUF;

    public static Scheme ofOrder(int version) {
        if (version == 1) return Scheme.WITH_SIGNATURE;
        if (version == 2 || version == 3) return Scheme.WITH_PROOFS;
        if (version == 4) return Scheme.PROTOBUF;
        throw new IllegalArgumentException("Unsupported order version " + version);
    }

    public static Scheme of(int txType, int txVersion) {
        if (txType == GenesisTransaction.TYPE || txType == PaymentTransaction.TYPE) {
            if (txVersion == 1) return Scheme.WITH_SIGNATURE;
        }
        if (txType >= IssueTransaction.TYPE && txType <= CreateAliasTransaction.TYPE) {
            if (txVersion == 1) return Scheme.WITH_SIGNATURE;
            if (txVersion == 2) return Scheme.WITH_PROOFS;
            if (txVersion == 3) return Scheme.PROTOBUF;
        }
        if (txType >= MassTransferTransaction.TYPE && txType <= InvokeScriptTransaction.TYPE) {
            if (txVersion == 1) return Scheme.WITH_PROOFS;
            if (txVersion == 2) return Scheme.PROTOBUF;
        }
        if (txType == UpdateAssetInfoTransaction.TYPE) {
            if (txVersion == 1) return Scheme.PROTOBUF;
        }
        throw new IllegalArgumentException("Unsupported transaction type " + txType + " with version " + txVersion);
    }

    public static Scheme of(TransactionOrOrder txOrOrder) {
        if (txOrOrder instanceof Order)
            return ofOrder(txOrOrder.version());
        else if (txOrOrder instanceof Transaction)
            return of(((Transaction) txOrOrder).type(), txOrOrder.version());
        else throw new IllegalArgumentException("Can't recognize transaction or order of " + txOrOrder.getClass().getCanonicalName());
    }

}
