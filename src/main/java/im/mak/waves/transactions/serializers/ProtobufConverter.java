package im.mak.waves.transactions.serializers;

import com.google.protobuf.ByteString;
import com.wavesplatform.protobuf.AmountOuterClass;
import com.wavesplatform.protobuf.transaction.RecipientOuterClass;
import com.wavesplatform.protobuf.transaction.TransactionOuterClass;
import im.mak.waves.crypto.account.Address;
import im.mak.waves.transactions.LeaseTransaction;
import im.mak.waves.transactions.Transaction;
import im.mak.waves.transactions.common.Alias;
import im.mak.waves.transactions.common.Recipient;

import java.util.stream.Collectors;

public class ProtobufConverter {

    public static TransactionOuterClass.Transaction toUnsignedProtobuf(Transaction tx) {
        TransactionOuterClass.Transaction.Builder protoBuilder = TransactionOuterClass.Transaction.newBuilder()
                .setVersion(tx.version())
                .setChainId(tx.chainId())
                .setSenderPublicKey(ByteString.copyFrom(tx.sender().bytes()))
                .setFee(AmountOuterClass.Amount.newBuilder()
                        .setAmount(tx.fee())
                        .setAssetId(ByteString.copyFrom(
                                tx.feeAsset().bytes()))
                        .build())
                .setTimestamp(tx.timestamp());

        if (tx instanceof LeaseTransaction) {
            LeaseTransaction ltx = (LeaseTransaction) tx;
            RecipientOuterClass.Recipient recipient = ltx.recipient().isAlias()
                    ? RecipientOuterClass.Recipient.newBuilder().setAlias(ltx.recipient().alias().value()).build()
                    : RecipientOuterClass.Recipient.newBuilder().setPublicKeyHash(ByteString.copyFrom(
                    ltx.recipient().address().publicKeyHash())).build();
            protoBuilder.setLease(TransactionOuterClass.LeaseTransactionData.newBuilder()
                    .setRecipient(recipient)
                    .setAmount(ltx.amount())
                    .build());
        } //todo other types

        return protoBuilder.build();
    }

    public static TransactionOuterClass.SignedTransaction toProtobuf(Transaction tx) {
        return TransactionOuterClass.SignedTransaction.newBuilder()
                .setTransaction(toUnsignedProtobuf(tx))
                .addAllProofs(tx.proofs()
                        .stream()
                        .map(p -> ByteString.copyFrom(p.bytes()))
                        .collect(Collectors.toList()))
                .build();
    }

    public static Recipient recipientFromProto(RecipientOuterClass.Recipient proto, byte chainId) {
        if (proto.getRecipientCase().getNumber() == 1)
            return Recipient.as(Address.fromPart(proto.getPublicKeyHash().toByteArray(), chainId));
        else if (proto.getRecipientCase().getNumber() == 2) {
            return Recipient.as(Alias.as(chainId, proto.getAlias()));
        } else throw new IllegalArgumentException("Protobuf recipient must be specified");
    }

    public static RecipientOuterClass.Recipient recipientToProto(Recipient recipient) {
        RecipientOuterClass.Recipient.Builder proto = RecipientOuterClass.Recipient.newBuilder();
        if (recipient.isAlias())
            proto.setAlias(recipient.alias().value());
        else
            proto.setPublicKeyHash(ByteString.copyFrom(
                    recipient.address().publicKeyHash()));
        return proto.build();
    }

}
