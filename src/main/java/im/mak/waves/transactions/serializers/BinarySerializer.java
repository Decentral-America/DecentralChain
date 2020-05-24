package im.mak.waves.transactions.serializers;

import com.google.protobuf.InvalidProtocolBufferException;
import com.wavesplatform.protobuf.AmountOuterClass;
import com.wavesplatform.protobuf.transaction.TransactionOuterClass;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.*;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.TxId;
import im.mak.waves.transactions.components.*;

import java.io.IOException;

import static im.mak.waves.transactions.serializers.ProtobufConverter.recipientFromProto;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.stream.Collectors.toList;

public abstract class BinarySerializer {

    public static byte[] bodyBytes(Transaction tx) {
        int protobufVersion = 0;
        if (tx instanceof IssueTransaction) protobufVersion = IssueTransaction.LATEST_VERSION;
        else if (tx instanceof TransferTransaction) protobufVersion = TransferTransaction.LATEST_VERSION;
        else if (tx instanceof ReissueTransaction) protobufVersion = ReissueTransaction.LATEST_VERSION;
        else if (tx instanceof BurnTransaction) protobufVersion = BurnTransaction.LATEST_VERSION;
        else if (tx instanceof LeaseTransaction) protobufVersion = LeaseTransaction.LATEST_VERSION;
        else if (tx instanceof LeaseCancelTransaction) protobufVersion = LeaseCancelTransaction.LATEST_VERSION;
        else if (tx instanceof CreateAliasTransaction) protobufVersion = CreateAliasTransaction.LATEST_VERSION;
        else if (tx instanceof DataTransaction) protobufVersion = DataTransaction.LATEST_VERSION;
        else if (tx instanceof SetScriptTransaction) protobufVersion = SetScriptTransaction.LATEST_VERSION;
        //todo other types

        if (tx.version() == protobufVersion) {
            return ProtobufConverter.toUnsignedProtobuf(tx).toByteArray();
        } else {
            return LegacyBinarySerializer.bodyBytes(tx);
        }
    }

    public static byte[] toBytes(Transaction tx) {
        int protobufVersion = 0;
        if (tx instanceof IssueTransaction) protobufVersion = IssueTransaction.LATEST_VERSION;
        else if (tx instanceof TransferTransaction) protobufVersion = TransferTransaction.LATEST_VERSION;
        else if (tx instanceof ReissueTransaction) protobufVersion = ReissueTransaction.LATEST_VERSION;
        else if (tx instanceof BurnTransaction) protobufVersion = BurnTransaction.LATEST_VERSION;
        else if (tx instanceof LeaseTransaction) protobufVersion = LeaseTransaction.LATEST_VERSION;
        else if (tx instanceof LeaseCancelTransaction) protobufVersion = LeaseCancelTransaction.LATEST_VERSION;
        else if (tx instanceof CreateAliasTransaction) protobufVersion = CreateAliasTransaction.LATEST_VERSION;
        else if (tx instanceof DataTransaction) protobufVersion = DataTransaction.LATEST_VERSION;
        else if (tx instanceof SetScriptTransaction) protobufVersion = SetScriptTransaction.LATEST_VERSION;
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

        Transaction tx;
        TransactionOuterClass.Transaction pbTx = signed.getTransaction();
        //todo other types
        if (pbTx.hasIssue()) {
            TransactionOuterClass.IssueTransactionData issue = pbTx.getIssue();
            tx = IssueTransaction
                    .with(issue.getNameBytes().toByteArray(), issue.getAmount(), issue.getDecimals())
                    .description(issue.getDescriptionBytes().toByteArray())
                    .isReissuable(issue.getReissuable())
                    .compiledScript(issue.getScript().toByteArray())
                    .version(pbTx.getVersion())
                    .chainId((byte) pbTx.getChainId())
                    .sender(PublicKey.as(pbTx.getSenderPublicKey().toByteArray()))
                    .fee(pbTx.getFee().getAmount())
                    .feeAsset(Asset.id(pbTx.getFee().getAssetId().toByteArray()))
                    .timestamp(pbTx.getTimestamp())
                    .get();
        } else if (pbTx.hasTransfer()) {
            TransactionOuterClass.TransferTransactionData transfer = pbTx.getTransfer();
            AmountOuterClass.Amount amount = transfer.getAmount();
            tx = TransferTransaction
                    .with(recipientFromProto(transfer.getRecipient(), (byte) pbTx.getChainId()), amount.getAmount())
                    .asset(Asset.id(amount.getAssetId().toByteArray()))
                    .attachment(transfer.getAttachment().getStringValue()) //fixme not typed, NODE-2145
                    .version(pbTx.getVersion())
                    .chainId((byte) pbTx.getChainId())
                    .sender(PublicKey.as(pbTx.getSenderPublicKey().toByteArray()))
                    .fee(pbTx.getFee().getAmount())
                    .feeAsset(Asset.id(pbTx.getFee().getAssetId().toByteArray()))
                    .timestamp(pbTx.getTimestamp())
                    .get();
        } else if (pbTx.hasReissue()) {
            TransactionOuterClass.ReissueTransactionData reissue = pbTx.getReissue();
            tx = ReissueTransaction
                    .with(Asset.id(reissue.getAssetAmount().getAssetId().toByteArray()), reissue.getAssetAmount().getAmount())
                    .reissuable(reissue.getReissuable())
                    .version(pbTx.getVersion())
                    .chainId((byte) pbTx.getChainId())
                    .sender(PublicKey.as(pbTx.getSenderPublicKey().toByteArray()))
                    .fee(pbTx.getFee().getAmount())
                    .feeAsset(Asset.id(pbTx.getFee().getAssetId().toByteArray()))
                    .timestamp(pbTx.getTimestamp())
                    .get();
        } else if (pbTx.hasBurn()) {
            TransactionOuterClass.BurnTransactionData burn = pbTx.getBurn();
            tx = BurnTransaction
                    .with(Asset.id(burn.getAssetAmount().getAssetId().toByteArray()), burn.getAssetAmount().getAmount())
                    .version(pbTx.getVersion())
                    .chainId((byte) pbTx.getChainId())
                    .sender(PublicKey.as(pbTx.getSenderPublicKey().toByteArray()))
                    .fee(pbTx.getFee().getAmount())
                    .feeAsset(Asset.id(pbTx.getFee().getAssetId().toByteArray()))
                    .timestamp(pbTx.getTimestamp())
                    .get();
        } else if (pbTx.hasLease()) {
            TransactionOuterClass.LeaseTransactionData lease = pbTx.getLease();
            tx = LeaseTransaction
                    .with(recipientFromProto(lease.getRecipient(), (byte) pbTx.getChainId()), lease.getAmount())
                    .version(pbTx.getVersion())
                    .chainId((byte) pbTx.getChainId())
                    .sender(PublicKey.as(pbTx.getSenderPublicKey().toByteArray()))
                    .fee(pbTx.getFee().getAmount())
                    .feeAsset(Asset.id(pbTx.getFee().getAssetId().toByteArray()))
                    .timestamp(pbTx.getTimestamp())
                    .get();
        } else if (pbTx.hasLeaseCancel()) {
            TransactionOuterClass.LeaseCancelTransactionData leaseCancel = pbTx.getLeaseCancel();
            tx = LeaseCancelTransaction
                    .with(TxId.id(leaseCancel.getLeaseId().toByteArray()))
                    .version(pbTx.getVersion())
                    .chainId((byte) pbTx.getChainId())
                    .sender(PublicKey.as(pbTx.getSenderPublicKey().toByteArray()))
                    .fee(pbTx.getFee().getAmount())
                    .feeAsset(Asset.id(pbTx.getFee().getAssetId().toByteArray()))
                    .timestamp(pbTx.getTimestamp())
                    .get();
        } else if (pbTx.hasCreateAlias()) {
            TransactionOuterClass.CreateAliasTransactionData alias = pbTx.getCreateAlias();
            tx = CreateAliasTransaction
                    .with(new String(alias.getAliasBytes().toByteArray(), UTF_8)) //ask is there non utf8 aliases?
                    .version(pbTx.getVersion())
                    .chainId((byte) pbTx.getChainId())
                    .sender(PublicKey.as(pbTx.getSenderPublicKey().toByteArray()))
                    .fee(pbTx.getFee().getAmount())
                    .feeAsset(Asset.id(pbTx.getFee().getAssetId().toByteArray()))
                    .timestamp(pbTx.getTimestamp())
                    .get();
        } else if (pbTx.hasDataTransaction()) {
            TransactionOuterClass.DataTransactionData data = pbTx.getDataTransaction();
            tx = DataTransaction
                    .with(data.getDataList().stream().map(e -> {
                        int descriptor = e.getDescriptorForType().getIndex();
                        if (descriptor == 10) return new IntegerEntry(e.getKey(), e.getIntValue());
                        else if (descriptor == 11) return new BooleanEntry(e.getKey(), e.getBoolValue());
                        else if (descriptor == 12) return new BinaryEntry(e.getKey(), e.getBinaryValue().toByteArray());
                        else if (descriptor == 13) return new StringEntry(e.getKey(), e.getStringValue());
                        else return new DeleteEntry(e.getKey());
                    }).collect(toList()))
                    .version(pbTx.getVersion())
                    .chainId((byte) pbTx.getChainId())
                    .sender(PublicKey.as(pbTx.getSenderPublicKey().toByteArray()))
                    .fee(pbTx.getFee().getAmount())
                    .feeAsset(Asset.id(pbTx.getFee().getAssetId().toByteArray()))
                    .timestamp(pbTx.getTimestamp())
                    .get();
        } else if (pbTx.hasSetScript()) {
            TransactionOuterClass.SetScriptTransactionData setScript = pbTx.getSetScript();
            tx = SetScriptTransaction
                    .with(setScript.getScript().toByteArray())
                    .version(pbTx.getVersion())
                    .chainId((byte) pbTx.getChainId())
                    .sender(PublicKey.as(pbTx.getSenderPublicKey().toByteArray()))
                    .fee(pbTx.getFee().getAmount())
                    .feeAsset(Asset.id(pbTx.getFee().getAssetId().toByteArray()))
                    .timestamp(pbTx.getTimestamp())
                    .get();
        } else throw new InvalidProtocolBufferException("Can't recognize transaction type");

        signed.getProofsList().forEach(p -> tx.proofs().add(Proof.as(p.toByteArray())));
        return tx;
    }

}
