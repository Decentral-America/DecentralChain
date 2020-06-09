package im.mak.waves.transactions.serializers;

import im.mak.waves.transactions.*;
import im.mak.waves.transactions.components.Order;

public enum Scheme {

    WITH_SIGNATURE, WITH_PROOFS, PROTOBUF;

    public static Scheme ofOrder(int version) {
        if (version == 1) return Scheme.WITH_SIGNATURE;
        if (version == 2 || version == 3) return Scheme.WITH_PROOFS;
        if (version == 4) return Scheme.PROTOBUF;
        throw new IllegalArgumentException("Unsupported order version " + version);
    }

    public static Scheme ofOrder(Order order) {
        return ofOrder(order.version());
    }

    public static Scheme of(int txType, int txVersion) {
        //todo genesis, payment
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

    public static Scheme of(Transaction tx) {
        return of(tx.type(), tx.version());
    }

}
