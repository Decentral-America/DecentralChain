package im.mak.waves.transactions.serializers;

import com.google.protobuf.ByteString;
import com.wavesplatform.protobuf.AmountOuterClass;
import com.wavesplatform.protobuf.transaction.RecipientOuterClass;
import com.wavesplatform.protobuf.transaction.TransactionOuterClass;
import im.mak.waves.crypto.account.Address;
import im.mak.waves.transactions.*;
import im.mak.waves.transactions.common.Alias;
import im.mak.waves.transactions.common.Recipient;

import java.util.stream.Collectors;

public abstract class ProtobufConverter {

    public static Transaction fromProtobuf(TransactionOuterClass.SignedTransaction protobufTx) {
        return null; //todo
    }

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

        if (tx instanceof IssueTransaction) {
            IssueTransaction itx = (IssueTransaction) tx;
            protoBuilder.setIssue(TransactionOuterClass.IssueTransactionData.newBuilder()
                    .setNameBytes(ByteString.copyFrom(itx.nameBytes()))
                    .setDescriptionBytes(ByteString.copyFrom(itx.descriptionBytes()))
                    .setAmount(itx.quantity())
                    .setDecimals(itx.decimals())
                    .setReissuable(itx.isReissuable())
                    .setScript(ByteString.copyFrom(itx.compiledScript()))
                    .build());
        } else if (tx instanceof TransferTransaction) {
            TransferTransaction ttx = (TransferTransaction) tx;
            protoBuilder.setTransfer(TransactionOuterClass.TransferTransactionData.newBuilder()
                    .setRecipient(recipientToProto(ttx.recipient()))
                    .setAmount(AmountOuterClass.Amount.newBuilder()
                            .setAmount(ttx.amount())
                            .setAssetId(ByteString.copyFrom(ttx.asset().bytes()))
                            .build())
                    .setAttachment(TransactionOuterClass.Attachment.newBuilder()
                            .setStringValue(ttx.attachment())
                            .build())
                    .build());
        } else if (tx instanceof ReissueTransaction) {
            ReissueTransaction rtx = (ReissueTransaction) tx;
            protoBuilder.setReissue(TransactionOuterClass.ReissueTransactionData.newBuilder()
                    .setAssetAmount(AmountOuterClass.Amount.newBuilder()
                            .setAssetId(ByteString.copyFrom(rtx.asset().bytes()))
                            .setAmount(rtx.amount())
                            .build())
                    .setReissuable(rtx.isReissuable())
                    .build());
        } else if (tx instanceof BurnTransaction) {
            BurnTransaction btx = (BurnTransaction) tx;
            protoBuilder.setBurn(TransactionOuterClass.BurnTransactionData.newBuilder()
                    .setAssetAmount(AmountOuterClass.Amount.newBuilder()
                            .setAssetId(ByteString.copyFrom(btx.asset().bytes()))
                            .setAmount(btx.amount())
                            .build())
                    .build());
        } else if (tx instanceof LeaseTransaction) {
            LeaseTransaction ltx = (LeaseTransaction) tx;
            protoBuilder.setLease(TransactionOuterClass.LeaseTransactionData.newBuilder()
                    .setRecipient(recipientToProto(ltx.recipient()))
                    .setAmount(ltx.amount())
                    .build());
        } else if (tx instanceof LeaseCancelTransaction) {
            LeaseCancelTransaction lctx = (LeaseCancelTransaction) tx;
            protoBuilder.setLeaseCancel(TransactionOuterClass.LeaseCancelTransactionData.newBuilder()
                    .setLeaseId(ByteString.copyFrom(lctx.leaseId().bytes()))
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
