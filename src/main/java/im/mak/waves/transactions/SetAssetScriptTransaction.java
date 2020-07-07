package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Waves;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class SetAssetScriptTransaction extends Transaction {

    public static final int TYPE = 15;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 100_000_000;

    private final Asset asset;
    private final byte[] compiledScript;

    public SetAssetScriptTransaction(PublicKey sender, Asset asset, byte[] compiledScript) {
        this(sender, asset, compiledScript, Waves.chainId, Amount.of(MIN_FEE),
                System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public SetAssetScriptTransaction(PublicKey sender, Asset asset, byte[] compiledScript, byte chainId, Amount fee,
                                     long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);
        if (asset.isWaves())
            throw new IllegalArgumentException("Can't be Waves");

        this.asset = asset;
        this.compiledScript = compiledScript == null ? Bytes.empty() : compiledScript;
    }

    public static SetAssetScriptTransaction fromBytes(byte[] bytes) throws IOException {
        return (SetAssetScriptTransaction) Transaction.fromBytes(bytes);
    }

    public static SetAssetScriptTransaction fromJson(String json) throws IOException {
        return (SetAssetScriptTransaction) Transaction.fromJson(json);
    }

    public static SetAssetScriptTransactionBuilder with(Asset asset, byte[] compiledScript) {
        return new SetAssetScriptTransactionBuilder(asset, compiledScript);
    }

    public Asset asset() {
        return asset;
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
        SetAssetScriptTransaction that = (SetAssetScriptTransaction) o;
        return this.asset.equals(that.asset)
                && Bytes.equal(this.compiledScript, that.compiledScript);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), asset, compiledScript);
    }

    public static class SetAssetScriptTransactionBuilder
            extends TransactionBuilder<SetAssetScriptTransactionBuilder, SetAssetScriptTransaction> {
        private final Asset asset;
        private final byte[] compiledScript;

        protected SetAssetScriptTransactionBuilder(Asset asset, String compiledBase64Script) {
            this(asset, compiledBase64Script == null ? null : Base64.decode(compiledBase64Script));
        }

        protected SetAssetScriptTransactionBuilder(Asset asset, byte[] compiledScript) {
            super(LATEST_VERSION, MIN_FEE);
            this.asset = asset;
            this.compiledScript = compiledScript == null ? Bytes.empty() : compiledScript;
        }

        protected SetAssetScriptTransaction _build() {
            return new SetAssetScriptTransaction(
                    sender, asset, compiledScript, chainId, fee, timestamp, version, Proof.emptyList());
        }
    }
    
}
