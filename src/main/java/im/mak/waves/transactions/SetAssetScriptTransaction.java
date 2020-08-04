package im.mak.waves.transactions;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.crypto.base.Base64;
import im.mak.waves.transactions.common.Amount;
import im.mak.waves.transactions.common.AssetId;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.WavesJConfig;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

public class SetAssetScriptTransaction extends Transaction {

    public static final int TYPE = 15;
    public static final int LATEST_VERSION = 2;
    public static final long MIN_FEE = 100_000_000;

    private final AssetId assetId;
    private final byte[] compiledScript;

    public SetAssetScriptTransaction(PublicKey sender, AssetId assetId, byte[] compiledScript) {
        this(sender, assetId, compiledScript, WavesJConfig.chainId(), Amount.of(MIN_FEE),
                System.currentTimeMillis(), LATEST_VERSION, Proof.emptyList());
    }

    public SetAssetScriptTransaction(PublicKey sender, AssetId assetId, byte[] compiledScript, byte chainId, Amount fee,
                                     long timestamp, int version, List<Proof> proofs) {
        super(TYPE, version, chainId, sender, fee, timestamp, proofs);
        if (assetId.isWaves())
            throw new IllegalArgumentException("Can't be Waves");

        this.assetId = assetId;
        this.compiledScript = compiledScript == null ? Bytes.empty() : compiledScript;
    }

    public static SetAssetScriptTransaction fromBytes(byte[] bytes) throws IOException {
        return (SetAssetScriptTransaction) Transaction.fromBytes(bytes);
    }

    public static SetAssetScriptTransaction fromJson(String json) throws IOException {
        return (SetAssetScriptTransaction) Transaction.fromJson(json);
    }

    public static SetAssetScriptTransactionBuilder with(AssetId assetId, byte[] compiledScript) {
        return new SetAssetScriptTransactionBuilder(assetId, compiledScript);
    }

    public AssetId assetId() {
        return assetId;
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
        return this.assetId.equals(that.assetId)
                && Bytes.equal(this.compiledScript, that.compiledScript);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), assetId, compiledScript);
    }

    public static class SetAssetScriptTransactionBuilder
            extends TransactionBuilder<SetAssetScriptTransactionBuilder, SetAssetScriptTransaction> {
        private final AssetId assetId;
        private final byte[] compiledScript;

        protected SetAssetScriptTransactionBuilder(AssetId assetId, String compiledBase64Script) {
            this(assetId, compiledBase64Script == null ? null : Base64.decode(compiledBase64Script));
        }

        protected SetAssetScriptTransactionBuilder(AssetId assetId, byte[] compiledScript) {
            super(LATEST_VERSION, MIN_FEE);
            this.assetId = assetId;
            this.compiledScript = compiledScript == null ? Bytes.empty() : compiledScript;
        }

        protected SetAssetScriptTransaction _build() {
            return new SetAssetScriptTransaction(
                    sender, assetId, compiledScript, chainId, fee, timestamp, version, Proof.emptyList());
        }
    }
    
}
