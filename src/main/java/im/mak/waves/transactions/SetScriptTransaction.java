package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Waves;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class SetScriptTransaction extends Transaction {

    public static final int TYPE = 13;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 1_000_000;

    private final byte[] compiledScript;

    public SetScriptTransaction(PublicKey sender, byte[] compiledScript) {
        this(sender, compiledScript, Waves.chainId, Amount.of(MIN_FEE),
                System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public SetScriptTransaction(PublicKey sender, byte[] compiledScript, byte chainId, Amount fee,
                                long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);

        this.compiledScript = compiledScript == null ? Bytes.empty() : compiledScript;
    }

    public static SetScriptTransaction fromBytes(byte[] bytes) throws IOException {
        return (SetScriptTransaction) Transaction.fromBytes(bytes);
    }

    public static SetScriptTransaction fromJson(String json) throws IOException {
        return (SetScriptTransaction) Transaction.fromJson(json);
    }

    public static SetScriptTransactionBuilder with(byte[] compiledScript) {
        return new SetScriptTransactionBuilder(compiledScript);
    }

    public String compiledBase64Script() {
        return Base64.encode(compiledScript);
    }

    public byte[] compiledScript() {
        return compiledScript;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        SetScriptTransaction that = (SetScriptTransaction) o;
        return Bytes.equal(this.compiledScript, that.compiledScript);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), compiledScript);
    }

    public static class SetScriptTransactionBuilder
            extends TransactionBuilder<SetScriptTransactionBuilder, SetScriptTransaction> {
        private final byte[] compiledScript;

        protected SetScriptTransactionBuilder(String compiledBase64Script) {
            this(compiledBase64Script == null ? null : Base64.decode(compiledBase64Script));
        }

        protected SetScriptTransactionBuilder(byte[] compiledScript) {
            super(LATEST_VERSION, MIN_FEE);
            this.compiledScript = compiledScript == null ? Bytes.empty() : compiledScript;
        }

        protected SetScriptTransaction _build() {
            return new SetScriptTransaction(
                    sender, compiledScript, chainId, fee, timestamp, version, Proof.emptyList());
        }
    }
    
}
