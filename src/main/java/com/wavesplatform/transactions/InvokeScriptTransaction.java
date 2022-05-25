package com.wavesplatform.transactions;

import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.Amount;
import com.wavesplatform.transactions.common.Proof;
import com.wavesplatform.transactions.common.Recipient;
import com.wavesplatform.transactions.invocation.Function;

import java.io.IOException;
import java.util.*;

import static java.util.Objects.requireNonNull;

public class InvokeScriptTransaction extends Transaction {

    public static final int TYPE = 16;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 500_000;

    private final Recipient dApp;
    private final Function function;
    private final List<Amount> payments;

    public InvokeScriptTransaction(PublicKey sender, Recipient dApp, Function function, List<Amount> payments) {
        this(sender, dApp, function, payments, WavesConfig.chainId(), Amount.of(MIN_FEE), System.currentTimeMillis(),
                LATEST_VERSION, Proof.emptyList());
    }

    public InvokeScriptTransaction(PublicKey sender, Recipient dApp, Function function, List<Amount> payments,
                                   byte chainId, Amount fee, long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);

        this.dApp = requireNonNull(dApp, "dApp can't be null");
        this.function = function == null ? Function.asDefault() : function;
        this.payments = payments == null ? Collections.emptyList() : payments;
    }

    public static InvokeScriptTransaction fromBytes(byte[] bytes) throws IOException {
        return (InvokeScriptTransaction) Transaction.fromBytes(bytes);
    }

    public static InvokeScriptTransaction fromJson(String json) throws IOException {
        return (InvokeScriptTransaction) Transaction.fromJson(json);
    }

    public static InvokeScriptTransactionBuilder builder(Recipient dApp, Function function) {
        return new InvokeScriptTransactionBuilder(dApp, function);
    }

    public Recipient dApp() {
        return dApp;
    }

    public Function function() {
        return function;
    }

    public List<Amount> payments() {
        return payments;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        InvokeScriptTransaction that = (InvokeScriptTransaction) o;
        return this.dApp.equals(that.dApp)
                && this.function.equals(that.function)
                && this.payments.equals(that.payments);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), dApp, function, payments);
    }

    public static class InvokeScriptTransactionBuilder
            extends TransactionBuilder<InvokeScriptTransactionBuilder, InvokeScriptTransaction> {
        private final Recipient dApp;
        private final Function function;
        private final List<Amount> payments;

        protected InvokeScriptTransactionBuilder(Recipient dApp, Function function) {
            super(LATEST_VERSION, MIN_FEE);
            this.dApp = dApp;
            this.function = function;
            this.payments = new ArrayList<>();
        }

        public InvokeScriptTransactionBuilder payments(Amount... payments) {
            payments(Arrays.asList(payments));
            return this;
        }

        public InvokeScriptTransactionBuilder payments(List<Amount> payments) {
            this.payments.addAll(payments);
            return this;
        }

        protected InvokeScriptTransaction _build() {
            return new InvokeScriptTransaction(sender, dApp, function, payments, chainId, feeWithExtra(),
                    timestamp, version, Proof.emptyList());
        }
    }

}
