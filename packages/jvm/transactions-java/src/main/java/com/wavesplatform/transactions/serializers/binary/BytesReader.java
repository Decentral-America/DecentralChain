package com.wavesplatform.transactions.serializers.binary;

import com.wavesplatform.crypto.Bytes;
import com.wavesplatform.transactions.account.Address;
import com.wavesplatform.transactions.account.PublicKey;
import com.wavesplatform.transactions.common.*;
import com.wavesplatform.transactions.exchange.OrderType;
import com.wavesplatform.transactions.invocation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static com.wavesplatform.crypto.Bytes.concat;
import static com.wavesplatform.crypto.Bytes.of;
import static java.nio.charset.StandardCharsets.UTF_8;

public class BytesReader {
    private final byte[] bytes;
    private final int length;
    private int index;

    public BytesReader(byte[] bytes) {
        this.bytes = bytes;
        this.length = this.bytes.length;
        this.index = 0;
    }

    public boolean hasNext() {
        return index < length;
    }

    public boolean skip(int count) {
        index += count;
        return hasNext();
    }

    public int rest() {
        return bytes.length - index;
    }

    public byte readByte() {
        return bytes[index++];
    }

    public byte[] readBytes(int count) {
        byte[] result = Arrays.copyOfRange(bytes, index, index + count);
        index = index + count;
        return result;
    }

    public boolean readBoolean() {
        byte byt = readByte();
        if (byt == 0)
            return false;
        else if (byt == 1)
            return true;
        else throw new IllegalArgumentException("Can't read byte " + byt + " as boolean. Expected 1 or 0");
    }

    public short readShort() {
        return Bytes.toShort(readBytes(2));
    }

    public int readInt() {
        return Bytes.toInt(readBytes(4));
    }

    public long readLong() {
        return Bytes.toLong(readBytes(8));
    }

    public OrderType readOrderType() {
        return readBoolean() ? OrderType.SELL : OrderType.BUY;
    }

    public byte[] readArrayWithLength() {
        short arrayLength = readShort();
        return readBytes(arrayLength);
    }

    public byte[] readOptionArrayWithLength() {
        return readBoolean() ? readArrayWithLength() : Bytes.empty();
    }

    public PublicKey readPublicKey() {
        return PublicKey.as(readBytes(PublicKey.BYTES_LENGTH));
    }

    public Recipient readRecipient() {
        byte recipientType = readByte();
        if (recipientType == Address.TYPE)
            return Address.as(concat(of(recipientType), readBytes(Address.BYTES_LENGTH - 1)));
        else if (recipientType == Alias.TYPE) {
            return Alias.as(readByte(), new String(readArrayWithLength()));
        } else throw new IllegalArgumentException("Unknown recipient type");
    }

    public AssetId readAssetId() {
        return AssetId.as(readBytes(AssetId.BYTE_LENGTH));
    }

    public AssetId readAssetIdOrWaves() {
        boolean isAsset = readBoolean();
        return isAsset ? readAssetId() : AssetId.WAVES;
    }

    public Id readTxId() {
        return Id.as(readBytes(Id.BYTE_LENGTH));
    }

    public Function readFunctionCall() {
        if (readBoolean()) {
            if (readByte() != 9) throw new IllegalArgumentException("FunctionCall Id must be equal 9");
            if (readByte() != 1) throw new IllegalArgumentException("Function type Id must be equal 1");
            String name = new String(readBytes(readInt()), UTF_8);
            List<Arg> args = readArguments();
            return Function.as(name, args);
        } else return Function.asDefault();
    }

    public List<Arg> readArguments() {
        int argsCount = readInt();
        List<Arg> args = new ArrayList<>();
        for (int i = 0; i < argsCount; i++) {
            byte argType = readByte();
            if (argType == 0) args.add(IntegerArg.as(readLong()));
            else if (argType == 1) args.add(BinaryArg.as(readBytes(readInt())));
            else if (argType == 2) args.add(StringArg.as(new String(readBytes(readInt()), UTF_8)));
            else if (argType == 6) args.add(BooleanArg.as(true));
            else if (argType == 7) args.add(BooleanArg.as(false));
            else if (argType == 11) args.add(ListArg.as(readArguments()));
            else throw new IllegalArgumentException("Unknown arg type " + argType);
        }
        return args;
    }

    public List<Proof> readSignature() {
        return Proof.list(Proof.as(readBytes(Proof.BYTE_LENGTH)));
    }

    public List<Proof> readProofs() {
        byte version = readByte();
        if (version != Proof.LATEST_VERSION)
            throw new IllegalArgumentException("Wrong proofs version " + version + " but " + 1 + " expected");

        List<Proof> result = Proof.emptyList();
        short proofsCount = readShort();
        for (short i = 0; i < proofsCount; i++)
            result.add(Proof.as(readArrayWithLength()));

        return result;
    }

}
