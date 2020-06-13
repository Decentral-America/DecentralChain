package im.mak.waves.transactions.serializers;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.exchange.OrderType;
import im.mak.waves.transactions.invocation.*;

import java.util.List;

import static java.nio.charset.StandardCharsets.UTF_8;

//todo inherit OutputStream
public class BytesWriter {

    private byte[] buf;

    public BytesWriter(int size) {
        buf = new byte[size];
    }

    public BytesWriter() {
        this(0);
    }

    public byte[] getBytes() {
        return buf;
    }

    public BytesWriter write(byte... value) {
        buf = Bytes.concat(buf, value);
        return this;
    }

    public BytesWriter writeBoolean(boolean value) {
        return write((byte) (value ? 1 : 0));
    }

    public BytesWriter writeArrayWithLength(byte[] value) {
        return write(Bytes.fromShort((short)value.length))
                .write(value);
    }

    public BytesWriter writeOptionArrayWithLength(byte[] value) {
        if (value != null && value.length > 0) {
            return writeBoolean(true).writeArrayWithLength(value);
        } else
            return writeBoolean(false);
    }

    public BytesWriter writeShort(short value) {
        return write(Bytes.fromShort(value));
    }

    public BytesWriter writeInt(int value) {
        return write(Bytes.fromInt(value));
    }

    public BytesWriter writeLong(long value) {
        return write(Bytes.fromLong(value));
    }

    public BytesWriter writeOrderType(OrderType type) {
        if (type == OrderType.BUY)
            write((byte) 0);
        else if (type == OrderType.SELL)
            write((byte) 1);
        else throw new IllegalArgumentException("Unknown order type " + type + " (not BUY or SELL)");
        return this;
    }

    public BytesWriter writePublicKey(PublicKey publicKey) {
        return write(publicKey.bytes());
    }

    public BytesWriter writeRecipient(Recipient recipient) {
        if (recipient.isAlias())
            return write((byte) 2, recipient.alias().chainId())
                    .writeArrayWithLength(recipient.alias().value().getBytes(UTF_8));
        else return write(recipient.address().bytes());
    }

    public BytesWriter writeAsset(Asset asset) {
        return write(asset.bytes());
    }

    public BytesWriter writeAssetOrWaves(Asset assetOrWaves) {
        return assetOrWaves.isWaves() ? write((byte) 0) : write((byte) 1).write(assetOrWaves.bytes());
    }

    public BytesWriter writeTxId(TxId txId) {
        return write(txId.bytes());
    }

    public BytesWriter writeFunction(Function function) {
        if (function.isDefault())
            return write((byte) 0);
        else {
            write((byte) 1, (byte) 9, (byte) 1)
                    .writeArrayWithLength(function.name().getBytes(UTF_8))
                    .writeInt(function.args().size());
            function.args().forEach(arg -> {
                if (arg instanceof IntegerArg)
                    write((byte) 0).writeLong(((IntegerArg) arg).value());
                else if (arg instanceof BinaryArg)
                    write((byte) 1).writeArrayWithLength(((BinaryArg) arg).value());
                else if (arg instanceof StringArg)
                    write((byte) 2).writeArrayWithLength(((StringArg) arg).value().getBytes(UTF_8));
                else if (arg instanceof BooleanArg)
                    write((byte)(((BooleanArg) arg).value() ? 6 : 7));
                else throw new IllegalArgumentException("Unknown arg type " + arg.type());
                //todo else if (arg instanceof ListArg)
            });
            return this;
        }
    }

    public BytesWriter writeSignature(List<Proof> proofs) {
        if (proofs.size() != 1)
            throw new IllegalArgumentException("1 signature expected but " + proofs.size() + " proofs found");
        return write(proofs.get(0).bytes());
    }

    public BytesWriter writeProofs(List<Proof> proofs) {
        write((byte) 1).writeShort((short) proofs.size()); //todo Proof.VERSION
        proofs.forEach(proof -> writeArrayWithLength(proof.bytes()));
        return this;
    }

}
