package im.mak.waves.transactions;

import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.common.*;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class SetAssetScriptTransaction extends Transaction {

    public static final int TYPE = 15;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 100_000_000;

    private final AssetId assetId;
    private final Base64String script;

    public SetAssetScriptTransaction(PublicKey sender, AssetId assetId, Base64String compiledScript) {
        this(sender, assetId, compiledScript, WavesConfig.chainId(), Amount.of(MIN_FEE),
                System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public SetAssetScriptTransaction(PublicKey sender, AssetId assetId, Base64String compiledScript, byte chainId, Amount fee,
                                     long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);
        if (assetId.isWaves())
            throw new IllegalArgumentException("Can't be Waves");

        this.assetId = assetId;
        this.script = compiledScript == null ? Base64String.empty() : compiledScript;
    }

    public static SetAssetScriptTransaction fromBytes(byte[] bytes) throws IOException {
        return (SetAssetScriptTransaction) Transaction.fromBytes(bytes);
    }

    public static SetAssetScriptTransaction fromJson(String json) throws IOException {
        return (SetAssetScriptTransaction) Transaction.fromJson(json);
    }

    public static SetAssetScriptTransactionBuilder builder(AssetId assetId, Base64String compiledScript) {
        return new SetAssetScriptTransactionBuilder(assetId, compiledScript);
    }

    public AssetId assetId() {
        return assetId;
    }

    public Base64String script() {
        return script;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        SetAssetScriptTransaction that = (SetAssetScriptTransaction) o;
        return this.assetId.equals(that.assetId)
                && this.script.equals(that.script);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), assetId, script);
    }

    public static class SetAssetScriptTransactionBuilder
            extends TransactionBuilder<SetAssetScriptTransactionBuilder, SetAssetScriptTransaction> {
        private final AssetId assetId;
        private final Base64String script;

        protected SetAssetScriptTransactionBuilder(AssetId assetId, Base64String compiledScript) {
            super(LATEST_VERSION, MIN_FEE);
            this.assetId = assetId;
            this.script = compiledScript == null ? Base64String.empty() : compiledScript;
        }

        protected SetAssetScriptTransaction _build() {
            return new SetAssetScriptTransaction(
                    sender, assetId, script, chainId, feeWithExtra(), timestamp, version, Proof.emptyList());
        }
    }
    
}
