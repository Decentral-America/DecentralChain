package com.wavesplatform.transactions.exchange;

import com.wavesplatform.crypto.Bytes;
import com.wavesplatform.protobuf.order.OrderOuterClass;
import com.wavesplatform.transactions.TransactionOrOrder;
import com.wavesplatform.transactions.WavesConfig;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.Id;
import com.wavesplatform.transactions.common.Proof;
import com.wavesplatform.transactions.serializers.ProtobufConverter;
import com.wavesplatform.transactions.serializers.binary.BinarySerializer;
import com.wavesplatform.transactions.serializers.json.JsonSerializer;

import java.io.IOException;
import java.util.Arrays;
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
    private final byte[] eip712Signature;

    public Order(PublicKey sender, OrderType type, Amount amount, Amount price, PublicKey matcher) {
        this(sender, type, amount, price, matcher, WavesConfig.chainId(), Amount.of(MIN_FEE), System.currentTimeMillis(),
                System.currentTimeMillis() + (30 * 24 * 60 * 60 * 1000L), LATEST_VERSION);
    }

    public Order(PublicKey sender, OrderType type, Amount amount, Amount price, PublicKey matcher, byte chainId,
                 Amount fee, long timestamp, long expiration, int version) {
        this(sender, type, amount, price, matcher, chainId, fee, timestamp, expiration, version, Proof.emptyList());
    }

    public Order(PublicKey sender, OrderType type, Amount amount, Amount price, PublicKey matcher, byte chainId,
                 Amount fee, long timestamp, long expiration, int version, List<Proof> proofs) {
        this(null, sender, type, amount, price, matcher, chainId, fee, timestamp, expiration,
                version, proofs, null);
    }

    public Order(Id id, PublicKey sender, OrderType type, Amount amount, Amount price, PublicKey matcher, byte chainId,
                 Amount fee, long timestamp, long expiration, int version, List<Proof> proofs, byte[] eip712Signature) {
        super(version, chainId, sender, fee, timestamp, proofs);
        this.id = id;
        this.type = Objects.requireNonNull(type, "Order type can't be null");
        this.amount = Objects.requireNonNull(amount, "Order amount pair can't be null");
        this.price = Objects.requireNonNull(price, "Order price pair can't be null");
        this.matcher = Objects.requireNonNull(matcher, "Order matcher public key can't be null");

        this.expiration = expiration;
        this.eip712Signature = eip712Signature;
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

    public static OrderBuilder builder(OrderType type, Amount amount, Amount price, PublicKey matcher) {
        return new OrderBuilder(type, amount, price, matcher);
    }

    public static OrderBuilder buy(Amount amount, Amount price, PublicKey matcher) {
        return builder(OrderType.BUY, amount, price, matcher);
    }

    public static OrderBuilder sell(Amount amount, Amount price, PublicKey matcher) {
        return builder(OrderType.SELL, amount, price, matcher);
    }

    public OrderType type() {
        return type;
    }

    public AssetPair assetPair() {
        return AssetPair.of(amount.assetId(), price.assetId());
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

    public byte[] eip712Signature() { return eip712Signature; }

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
        return Objects.hash(super.hashCode(), Arrays.hashCode(bodyBytes()));
    }

    public static class OrderBuilder extends TransactionOrOrderBuilder<OrderBuilder, Order> {
        private final OrderType type;
        private final Amount amount;
        private final Amount price;
        private final PublicKey matcher;
        private long expiration;
        private byte[] eip712Signature;

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

        public OrderBuilder eip712Signature(byte[] eip712Signature) {
            this.eip712Signature = eip712Signature;
            return this;
        }

        protected Order _build() {
            long expiration = this.expiration == 0 ? this.timestamp + (30 * 24 * 60 * 60 * 1000L) : this.expiration;
            return new Order(sender, type, amount, price, matcher, chainId, fee, timestamp, expiration, version);
        }
    }

}
