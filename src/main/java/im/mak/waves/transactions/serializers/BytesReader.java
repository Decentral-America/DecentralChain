package im.mak.waves.transactions.serializers;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.Address;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.exchange.OrderType;
import im.mak.waves.transactions.invocation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static im.mak.waves.crypto.Bytes.concat;
import static im.mak.waves.crypto.Bytes.of;
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
        byte recipientType = readByte(); //todo Recipient.from(bytes) or Alias.from(bytes)
        if (recipientType == 1)
            return Recipient.as(Address.as(concat(of(recipientType), readBytes(25)))); //todo Address.LENGTH
        else if (recipientType == 2) {
            return Recipient.as(Alias.as(readByte(), new String(readArrayWithLength()))); //todo Alias.as(bytes)
        } else throw new IllegalArgumentException("Unknown recipient type");
    }

    public Asset readAsset() {
        return Asset.id(readBytes(Asset.BYTE_LENGTH));
    }

    public Asset readAssetOrWaves() {
        boolean isAsset = readBoolean();
        return isAsset ? readAsset() : Asset.WAVES;
    }

    public TxId readTxId() {
        return TxId.id(readBytes(TxId.BYTE_LENGTH));
    }

    public Function readFunctionCall() {
        if (readBoolean()) {
            if (readByte() != 9) throw new IllegalArgumentException("FunctionCall Id must be equal 9");
            if (readByte() != 1) throw new IllegalArgumentException("Function type Id must be equal 1");
            String name = new String(readBytes(readInt()), UTF_8);
            int argsCount = readInt();
            List<Arg> args = new ArrayList<>();
            for (int i = 0; i < argsCount; i++) {
                byte argType = readByte();
                if (argType == 0) args.add(IntegerArg.as(readLong()));
                else if (argType == 1) args.add(BinaryArg.as(readArrayWithLength()));
                else if (argType == 2) args.add(StringArg.as(new String(readArrayWithLength(), UTF_8)));
                else if (argType == 6) args.add(BooleanArg.as(true));
                else if (argType == 7) args.add(BooleanArg.as(false));
                    //todo else if (argType == 11) args.add(ListArg.as(...));
                else throw new IllegalArgumentException("Unknown arg type " + argType);
            }
            return Function.as(name, args);
        } else return Function.asDefault();
    }

    public List<Proof> readSignature() {
        return Proof.list(Proof.as(readBytes(Proof.BYTE_LENGTH)));
    }

    public List<Proof> readProofs() {
        byte version = readByte();
        if (version != 1) //todo Proofs.VERSION = 1
            throw new IllegalArgumentException("Wrong proofs version " + version + " but " + 1 + " expected");

        List<Proof> result = Proof.emptyList();
        short proofsCount = readShort();
        for (short i = 0; i < proofsCount; i++)
            result.add(Proof.as(readArrayWithLength()));

        return result;
    }

}
