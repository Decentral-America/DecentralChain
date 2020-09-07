package im.mak.waves.transactions;

import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.Base64String;
import im.mak.waves.transactions.common.Proof;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class SetScriptTransaction extends Transaction {

    public static final int TYPE = 13;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 1_000_000;

    private final Base64String script;

    public SetScriptTransaction(PublicKey sender, Base64String compiledScript) {
        this(sender, compiledScript, WavesConfig.chainId(), Amount.of(MIN_FEE),
                System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public SetScriptTransaction(PublicKey sender, Base64String compiledScript, byte chainId, Amount fee,
                                long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);

        this.script = compiledScript == null ? Base64String.empty() : compiledScript;
    }

    public static SetScriptTransaction fromBytes(byte[] bytes) throws IOException {
        return (SetScriptTransaction) Transaction.fromBytes(bytes);
    }

    public static SetScriptTransaction fromJson(String json) throws IOException {
        return (SetScriptTransaction) Transaction.fromJson(json);
    }

    public static SetScriptTransactionBuilder builder(Base64String compiledScript) {
        return new SetScriptTransactionBuilder(compiledScript);
    }

    public Base64String script() {
        return script;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        SetScriptTransaction that = (SetScriptTransaction) o;
        return this.script.equals(that.script);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), script);
    }

    public static class SetScriptTransactionBuilder
            extends TransactionBuilder<SetScriptTransactionBuilder, SetScriptTransaction> {
        private final Base64String script;

        protected SetScriptTransactionBuilder(Base64String compiledScript) {
            super(LATEST_VERSION, MIN_FEE);
            this.script = compiledScript == null ? Base64String.empty() : compiledScript;
        }

        protected SetScriptTransaction _build() {
            return new SetScriptTransaction(
                    sender, script, chainId, feeWithExtra(), timestamp, version, Proof.emptyList());
        }
    }
    
}
