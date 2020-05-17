package im.mak.waves.transactions.serializers;

import com.google.protobuf.ByteString;
import com.google.protobuf.InvalidProtocolBufferException;
import com.wavesplatform.protobuf.transaction.TransactionOuterClass;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.LeaseCancelTransaction;
import im.mak.waves.transactions.LeaseTransaction;
import im.mak.waves.transactions.Transaction;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;

import java.io.IOException;
import java.util.stream.Collectors;

import static im.mak.waves.transactions.serializers.ProtobufConverter.recipientFromProto;

public class BinarySerializer {

    public static byte[] bodyBytes(Transaction tx) {
        int protobufVersion = 0;
        if (tx instanceof LeaseTransaction) protobufVersion = LeaseTransaction.LATEST_VERSION;
        else if (tx instanceof LeaseCancelTransaction) protobufVersion = LeaseCancelTransaction.LATEST_VERSION;
        //todo other types

        if (tx.version() == protobufVersion) {
            return ProtobufConverter.toUnsignedProtobuf(tx).toByteArray();
        } else {
            return LegacyBinarySerializer.bodyBytes(tx);
        }
    }

    public static byte[] toBytes(Transaction tx) {
        int protobufVersion = 0;
        if (tx instanceof LeaseTransaction) protobufVersion = LeaseTransaction.LATEST_VERSION;
        else if (tx instanceof LeaseCancelTransaction) protobufVersion = LeaseCancelTransaction.LATEST_VERSION;
        //todo other types

        if (tx.version() == protobufVersion) {
            return tx.toProtobuf().toByteArray();
        } else {
            return LegacyBinarySerializer.bytes(tx);
        }
    }

    public static Transaction fromBytes(byte[] bytes) throws IOException {
        TransactionOuterClass.SignedTransaction signed;
        try {
            signed = TransactionOuterClass.SignedTransaction.parseFrom(bytes);
            if (!signed.isInitialized())
                throw new InvalidProtocolBufferException("Parsed bytes are not a Transaction");
        } catch (InvalidProtocolBufferException e) {
            return LegacyBinarySerializer.fromBytes(bytes);
        }

        TransactionOuterClass.Transaction tx = signed.getTransaction();

        //todo other types
        if (tx.hasLease()) {
            TransactionOuterClass.LeaseTransactionData lease = tx.getLease();
            LeaseTransaction ltx = LeaseTransaction
                    .with(recipientFromProto(lease.getRecipient(), (byte) tx.getChainId()), lease.getAmount())
                    .version(tx.getVersion())
                    .chainId((byte) tx.getChainId())
                    .sender(PublicKey.as(tx.getSenderPublicKey().toByteArray()))
                    .fee(tx.getFee().getAmount())
                    .feeAsset(Asset.id(tx.getFee().getAssetId().toByteArray()))
                    .timestamp(tx.getTimestamp())
                    .get();
            signed.getProofsList().forEach(p -> ltx.proofs().add(Proof.as(p.toByteArray())));
            return ltx;
        } else throw new InvalidProtocolBufferException("Can't recognize transaction type"); //todo
    }

}
