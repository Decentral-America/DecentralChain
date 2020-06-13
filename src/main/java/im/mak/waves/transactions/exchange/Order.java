package im.mak.waves.transactions.exchange;

import com.wavesplatform.protobuf.order.OrderOuterClass;
import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.TransactionOrOrder;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.serializers.BinarySerializer;
import im.mak.waves.transactions.serializers.JsonSerializer;
import im.mak.waves.transactions.serializers.ProtobufConverter;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class Order extends TransactionOrOrder {

    public static final int LATEST_VERSION = 4;
    public static final long MIN_FEE = 300_000;

    private final OrderType type;
    private final Amount amount;
    private final Amount price;
    private final PublicKey matcher;
    private final long expiration;

    public Order(PublicKey sender, OrderType type, Amount amount, Amount price, PublicKey matcher, byte chainId,
                 long fee, Asset feeAsset, long timestamp, long expiration, int version) {
        this(sender, type, amount, price, matcher, chainId, fee, feeAsset, timestamp, expiration, version, Proof.emptyList());
    }

    //ask maybe better use AssetPair instead of two Amounts?
    public Order(PublicKey sender, OrderType type, Amount amount, Amount price, PublicKey matcher, byte chainId,
                 long fee, Asset feeAsset, long timestamp, long expiration, int version, List<Proof> proofs) {
        super(version, chainId, sender, fee, feeAsset, timestamp, proofs);
        if (type == null) throw new IllegalArgumentException("Order type can't be null");
        if (amount == null) throw new IllegalArgumentException("Order amount pair can't be null");
        if (price == null) throw new IllegalArgumentException("Order price pair can't be null");
        if (matcher == null) throw new IllegalArgumentException("Order matcher public key can't be null");

        this.type = type;
        this.amount = amount;
        this.price = price;
        this.matcher = matcher;
        this.expiration = expiration;
    }

    public static Order fromBytes(byte[] bytes) throws IOException {
        return BinarySerializer.orderFromBytes(bytes);
    }

    public static Order fromJson(String json) throws IOException {
        return JsonSerializer.orderFromJson(json);
    }

    public static Order fromProtobuf(OrderOuterClass.Order protobufOrder) throws IOException {
        return ProtobufConverter.fromProtobuf(protobufOrder);
    }

    public static OrderBuilder with(OrderType type, Amount amount, Amount price, PublicKey matcher) {
        return new OrderBuilder(type, amount, price, matcher);
    }

    public static OrderBuilder buy(Amount amount, Amount price, PublicKey matcher) {
        return with(OrderType.BUY, amount, price, matcher);
    }

    public static OrderBuilder sell(Amount amount, Amount price, PublicKey matcher) {
        return with(OrderType.SELL, amount, price, matcher);
    }

    public OrderType type() {
        return type;
    }

    public AssetPair pair() {
        return AssetPair.of(amount.asset(), price.asset());
    }

    public Amount amount() {
        return amount;
    }

    public Amount price() {
        return price;
    }

    public PublicKey matcher() {
        return matcher;
    }

    public long expiration() {
        return expiration;
    }

    public OrderOuterClass.Order toProtobuf() {
        return ProtobufConverter.toProtobuf(this);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        Order that = (Order) o;
        return Bytes.equal(this.bodyBytes(), that.bodyBytes());
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), bodyBytes());
    }

    public static class OrderBuilder extends TransactionOrOrderBuilder<OrderBuilder, Order> {
        private final OrderType type;
        private final Amount amount;
        private final Amount price;
        private final PublicKey matcher;
        private long expiration;

        protected OrderBuilder(OrderType type, Amount amount, Amount price, PublicKey matcher) {
            super(LATEST_VERSION, MIN_FEE);
            this.type = type;
            this.amount = amount;
            this.price = price;
            this.matcher = matcher;
            this.expiration = 0;
        }

        public OrderBuilder expiration(long expiration) {
            this.expiration = expiration;
            return this;
        }

        protected Order _build() {
            long expiration = this.expiration == 0 ? this.timestamp + (30 * 24 * 60 * 60 * 1000L) : this.expiration;
            return new Order(sender, type, amount, price, matcher, chainId, fee, feeAsset, timestamp, expiration, version);
        }
    }

}
