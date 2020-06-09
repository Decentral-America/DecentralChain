package im.mak.waves.transactions.serializers;

import com.google.protobuf.InvalidProtocolBufferException;
import com.wavesplatform.protobuf.order.OrderOuterClass;
import com.wavesplatform.protobuf.transaction.TransactionOuterClass;
import im.mak.waves.transactions.*;
import im.mak.waves.transactions.components.Order;

import java.io.IOException;

public abstract class BinarySerializer {

    public static Order orderFromBytes(byte[] bytes) throws IOException {
        OrderOuterClass.Order pbOrder;
        try {
            pbOrder = OrderOuterClass.Order.parseFrom(bytes);
            if (!pbOrder.isInitialized())
                throw new InvalidProtocolBufferException("Parsed bytes are not an Order");
        } catch (InvalidProtocolBufferException e) {
            try {
                return LegacyBinarySerializer.orderFromBytes(bytes, true);
            } catch (IllegalArgumentException ioe) {
                return LegacyBinarySerializer.orderFromBytes(bytes, false);
            }
        }

        return ProtobufConverter.fromProtobuf(pbOrder);
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

        return ProtobufConverter.fromProtobuf(signed);
    }

    public static byte[] bodyBytes(TransactionOrOrder txOrOrder) {
        if (txOrOrder instanceof Order) {
            if (txOrOrder.version() == Order.LATEST_VERSION)
                return ProtobufConverter.toUnsignedProtobuf((Order) txOrOrder).toByteArray();
            else return LegacyBinarySerializer.bodyBytes(txOrOrder);
        } else {
            Transaction tx = (Transaction) txOrOrder;
            int protobufVersion = 0;
            if (tx instanceof IssueTransaction) protobufVersion = IssueTransaction.LATEST_VERSION;
            else if (tx instanceof TransferTransaction) protobufVersion = TransferTransaction.LATEST_VERSION;
            else if (tx instanceof ReissueTransaction) protobufVersion = ReissueTransaction.LATEST_VERSION;
            else if (tx instanceof BurnTransaction) protobufVersion = BurnTransaction.LATEST_VERSION;
            else if (tx instanceof ExchangeTransaction) protobufVersion = ExchangeTransaction.LATEST_VERSION;
            else if (tx instanceof LeaseTransaction) protobufVersion = LeaseTransaction.LATEST_VERSION;
            else if (tx instanceof LeaseCancelTransaction) protobufVersion = LeaseCancelTransaction.LATEST_VERSION;
            else if (tx instanceof CreateAliasTransaction) protobufVersion = CreateAliasTransaction.LATEST_VERSION;
            else if (tx instanceof MassTransferTransaction) protobufVersion = MassTransferTransaction.LATEST_VERSION;
            else if (tx instanceof DataTransaction) protobufVersion = DataTransaction.LATEST_VERSION;
            else if (tx instanceof SetScriptTransaction) protobufVersion = SetScriptTransaction.LATEST_VERSION;
            else if (tx instanceof SponsorFeeTransaction) protobufVersion = SponsorFeeTransaction.LATEST_VERSION;
            else if (tx instanceof SetAssetScriptTransaction) protobufVersion = SetAssetScriptTransaction.LATEST_VERSION;
            else if (tx instanceof InvokeScriptTransaction) protobufVersion = InvokeScriptTransaction.LATEST_VERSION;
            else if (tx instanceof UpdateAssetInfoTransaction) protobufVersion = UpdateAssetInfoTransaction.LATEST_VERSION;

            if (tx.version() == protobufVersion) {
                return ProtobufConverter.toUnsignedProtobuf(tx).toByteArray();
            } else {
                return LegacyBinarySerializer.bodyBytes(tx);
            }
        }
    }

    public static byte[] toBytes(TransactionOrOrder txOrOrder) {
        if (txOrOrder instanceof Order) {
            if (txOrOrder.version() == Order.LATEST_VERSION)
                return ((Order)txOrOrder).toProtobuf().toByteArray();
            else return LegacyBinarySerializer.bytes(txOrOrder);
        } else {
            Transaction tx = (Transaction) txOrOrder;
            int protobufVersion = 0;
            if (tx instanceof IssueTransaction) protobufVersion = IssueTransaction.LATEST_VERSION;
            else if (tx instanceof TransferTransaction) protobufVersion = TransferTransaction.LATEST_VERSION;
            else if (tx instanceof ReissueTransaction) protobufVersion = ReissueTransaction.LATEST_VERSION;
            else if (tx instanceof BurnTransaction) protobufVersion = BurnTransaction.LATEST_VERSION;
            else if (tx instanceof ExchangeTransaction) protobufVersion = ExchangeTransaction.LATEST_VERSION;
            else if (tx instanceof LeaseTransaction) protobufVersion = LeaseTransaction.LATEST_VERSION;
            else if (tx instanceof LeaseCancelTransaction) protobufVersion = LeaseCancelTransaction.LATEST_VERSION;
            else if (tx instanceof CreateAliasTransaction) protobufVersion = CreateAliasTransaction.LATEST_VERSION;
            else if (tx instanceof MassTransferTransaction) protobufVersion = MassTransferTransaction.LATEST_VERSION;
            else if (tx instanceof DataTransaction) protobufVersion = DataTransaction.LATEST_VERSION;
            else if (tx instanceof SetScriptTransaction) protobufVersion = SetScriptTransaction.LATEST_VERSION;
            else if (tx instanceof SponsorFeeTransaction) protobufVersion = SponsorFeeTransaction.LATEST_VERSION;
            else if (tx instanceof SetAssetScriptTransaction) protobufVersion = SetAssetScriptTransaction.LATEST_VERSION;
            else if (tx instanceof InvokeScriptTransaction) protobufVersion = InvokeScriptTransaction.LATEST_VERSION;
            else if (tx instanceof UpdateAssetInfoTransaction) protobufVersion = UpdateAssetInfoTransaction.LATEST_VERSION;

            if (tx.version() == protobufVersion) {
                return tx.toProtobuf().toByteArray();
            } else {
                return LegacyBinarySerializer.bytes(tx);
            }
        }
    }

}
