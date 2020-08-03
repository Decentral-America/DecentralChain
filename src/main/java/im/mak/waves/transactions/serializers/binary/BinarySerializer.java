package im.mak.waves.transactions.serializers.binary;

import com.google.protobuf.InvalidProtocolBufferException;
import com.wavesplatform.protobuf.order.OrderOuterClass;
import com.wavesplatform.protobuf.transaction.TransactionOuterClass;
import im.mak.waves.transactions.*;
import im.mak.waves.transactions.exchange.Order;
import im.mak.waves.transactions.serializers.ProtobufConverter;
import im.mak.waves.transactions.serializers.Scheme;

import java.io.IOException;

import static im.mak.waves.transactions.serializers.Scheme.PROTOBUF;

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

    public static Transaction transactionFromBytes(byte[] bytes) throws IOException {
        TransactionOuterClass.SignedTransaction signed;
        try {
            signed = TransactionOuterClass.SignedTransaction.parseFrom(bytes);
            if (!signed.isInitialized())
                throw new InvalidProtocolBufferException("Parsed bytes are not a Transaction");
        } catch (InvalidProtocolBufferException e) {
            return LegacyBinarySerializer.transactionFromBytes(bytes);
        }

        return ProtobufConverter.fromProtobuf(signed);
    }

    public static byte[] bodyBytes(TransactionOrOrder txOrOrder) {
        if (Scheme.of(txOrOrder) == PROTOBUF) {
            if (txOrOrder instanceof Order)
                return ProtobufConverter.toUnsignedProtobuf((Order) txOrOrder).toByteArray();
            else
                return ProtobufConverter.toUnsignedProtobuf((Transaction) txOrOrder).toByteArray();
        } else return LegacyBinarySerializer.bodyBytes(txOrOrder);
    }

    public static byte[] toBytes(TransactionOrOrder txOrOrder) {
        if (Scheme.of(txOrOrder) == PROTOBUF) {
            if (txOrOrder instanceof Order)
                return ProtobufConverter.toProtobuf((Order) txOrOrder).toByteArray();
            else
                return ProtobufConverter.toProtobuf((Transaction) txOrOrder).toByteArray();
        } else return LegacyBinarySerializer.toBytes(txOrOrder);
    }

}
