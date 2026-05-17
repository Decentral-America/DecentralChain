package com.wavesplatform.transactions;

import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.Id;
import com.wavesplatform.transactions.common.Proof;
import com.wavesplatform.transactions.exchange.AssetPair;
import com.wavesplatform.transactions.exchange.Order;
import com.wavesplatform.transactions.exchange.OrderType;

import java.io.IOException;
import java.util.*;

@SuppressWarnings("unused")
public class ExchangeTransaction extends Transaction {

    public static final int TYPE = 7;
    public static final int LATEST_VERSION = 3;
    public static final long MIN_FEE = 300_000;

    private final List<Order> orders;
    private final long amount;
    private final long price;
    private final long buyMatcherFee;
    private final long sellMatcherFee;

    public ExchangeTransaction(PublicKey sender, Order order1, Order order2,
                               long amount, long price, long buyMatcherFee, long sellMatcherFee) {
        this(sender, order1, order2, amount, price, buyMatcherFee, sellMatcherFee, WavesConfig.chainId(),
                Amount.of(MIN_FEE), System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public ExchangeTransaction(PublicKey sender, Order order1, Order order2, long amount, long price,
                               long buyMatcherFee, long sellMatcherFee, byte chainId, Amount fee, long timestamp,
                               int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);
        if (order1 == null) throw new IllegalArgumentException("Buy order can't be null");
        if (order2 == null) throw new IllegalArgumentException("Sell order can't be null");
        if (order1.type() == order2.type()) throw new IllegalArgumentException("Order types must be different");
        if (!order1.matcher().equals(order2.matcher()))
            throw new IllegalArgumentException("Matcher's public key in orders must be equal");
        if (!sender.equals(order1.matcher()))
            throw new IllegalArgumentException("Order matcher must be equal to the transaction sender");
        if (!order1.assetPair().equals(order2.assetPair()))
            throw new IllegalArgumentException("Asset pair in orders must be equal");

        this.orders = Collections.unmodifiableList(Arrays.asList(order1, order2));
        this.amount = amount;
        this.price = price;
        this.buyMatcherFee = buyMatcherFee;
        this.sellMatcherFee = sellMatcherFee;
    }

    public ExchangeTransaction(Id id, PublicKey sender, Order order1, Order order2, long amount, long price,
                               long buyMatcherFee, long sellMatcherFee, byte chainId, Amount fee, long timestamp,
                               int version, List<Proof> proofs) {
        this(sender, order1, order2, amount, price, buyMatcherFee, sellMatcherFee, chainId,
                fee, timestamp, version, proofs);
        this.id = id;
    }

    public static ExchangeTransaction fromBytes(byte[] bytes) throws IOException {
        return (ExchangeTransaction) Transaction.fromBytes(bytes);
    }

    public static ExchangeTransaction fromJson(String json) throws IOException {
        return (ExchangeTransaction) Transaction.fromJson(json);
    }

    public static ExchangeTransactionBuilder builder(
            Order buy, Order sell, long amount, long price, long buyMatcherFee, long sellMatcherFee) {
        return new ExchangeTransactionBuilder(buy, sell, amount, price, buyMatcherFee, sellMatcherFee);
    }

    public AssetPair assetPair() {
        return this.orders.get(0).assetPair();
    }

    public List<Order> orders() {
        return orders;
    }

    public Order buyOrder() {
        return orders.stream()
                .filter(o -> o.type() == OrderType.BUY)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "ExchangeTransaction " + id().toString() + "doesn't have buy order"));
    }

    public Order sellOrder() {
        return orders.stream()
                .filter(o -> o.type() == OrderType.SELL)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "ExchangeTransaction " + id().toString() + "doesn't have sell order"));
    }

    public long amount() {
        return amount;
    }

    public long price() {
        return price;
    }

    public long buyMatcherFee() {
        return buyMatcherFee;
    }

    public long sellMatcherFee() {
        return sellMatcherFee;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        ExchangeTransaction that = (ExchangeTransaction) o;
        return amount == that.amount &&
                price == that.price &&
                buyMatcherFee == that.buyMatcherFee &&
                sellMatcherFee == that.sellMatcherFee &&
                Objects.equals(orders, that.orders);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), orders, amount, price, buyMatcherFee, sellMatcherFee);
    }

    public static class ExchangeTransactionBuilder
            extends TransactionBuilder<ExchangeTransactionBuilder, ExchangeTransaction> {
        private final Order order1;
        private final Order order2;
        private final long amount;
        private final long price;
        private final long buyMatcherFee;
        private final long sellMatcherFee;

        protected ExchangeTransactionBuilder(
                Order order1, Order order2, long amount, long price, long buyMatcherFee, long sellMatcherFee) {
            super(LATEST_VERSION, MIN_FEE);
            this.order1 = order1;
            this.order2 = order2;
            this.amount = amount;
            this.price = price;
            this.buyMatcherFee = buyMatcherFee;
            this.sellMatcherFee = sellMatcherFee;
        }

        protected ExchangeTransaction _build() {
            return new ExchangeTransaction(sender, order1, order2, amount, price, buyMatcherFee, sellMatcherFee,
                    chainId, feeWithExtra(), timestamp, version, Proof.emptyList());
        }
    }

}
