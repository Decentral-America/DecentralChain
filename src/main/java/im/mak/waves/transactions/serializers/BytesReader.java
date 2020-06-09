package im.mak.waves.transactions.serializers;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.Address;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.components.invoke.*;

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

    public byte nextByte() {
        return bytes[index++];
    }

    public byte[] nextBytes(int count) {
        byte[] result = Arrays.copyOfRange(bytes, index, index + count);
        index = index + count;
        return result;
    }

    public boolean nextBoolean() {
        byte byt = nextByte();
        if (byt == 0)
            return false;
        else if (byt == 1)
            return true;
        else throw new IllegalArgumentException("Can't read byte " + byt + " as boolean. Expected 1 or 0");
    }

    public short nextShort() {
        return Bytes.toShort(nextBytes(2));
    }

    public int nextInt() {
        return Bytes.toInt(nextBytes(4));
    }

    public long nextLong() {
        return Bytes.toLong(nextBytes(8));
    }

    public byte[] nextSizedArray() {
        short arrayLength = nextShort();
        return nextBytes(arrayLength);
    }

    public PublicKey nextPublicKey() {
        return PublicKey.as(nextBytes(PublicKey.BYTES_LENGTH));
    }

    public Recipient nextRecipient() {
        byte recipientType = nextByte(); //todo Recipient.from(bytes) or Alias.from(bytes)
        if (recipientType == 1)
            return Recipient.as(Address.as(concat(of(recipientType), nextBytes(25)))); //todo Address.LENGTH
        else if (recipientType == 2) {
            return Recipient.as(Alias.as(nextByte(), new String(nextSizedArray()))); //todo Alias.as(bytes)
        } else throw new IllegalArgumentException("Unknown recipient type");
    }

    public Asset nextAsset() {
        return Asset.id(nextBytes(Asset.BYTE_LENGTH));
    }

    public Asset nextAssetOrWaves() {
        boolean isAsset = nextBoolean();
        return isAsset ? nextAsset() : Asset.WAVES;
    }

    public TxId nextTxId() {
        return TxId.id(nextBytes(TxId.BYTE_LENGTH));
    }

    public Function nextFunctionCall() {
        if (nextBoolean()) {
            if (nextByte() != 9) throw new IllegalArgumentException("FunctionCall Id must be equal 9");
            if (nextByte() != 1) throw new IllegalArgumentException("Function type Id must be equal 1");
            String name = new String(nextSizedArray(), UTF_8);
            int argsCount = nextInt();
            List<Arg> args = new ArrayList<>();
            for (int i = 0; i < argsCount; i++) {
                byte argType = nextByte();
                if (argType == 0) args.add(IntegerArg.as(nextLong()));
                else if (argType == 1) args.add(BinaryArg.as(nextSizedArray()));
                else if (argType == 2) args.add(StringArg.as(new String(nextSizedArray(), UTF_8)));
                else if (argType == 6) args.add(BooleanArg.as(true));
                else if (argType == 7) args.add(BooleanArg.as(false));
                    //todo else if (argType == 11) args.add(ListArg.as(...));
                else throw new IllegalArgumentException("Unknown arg type " + argType);
            }
            return Function.as(name, args);
        } else return Function.asDefault();
    }

    public List<Proof> nextSignature() {
        return Proof.list(Proof.as(nextBytes(Proof.BYTE_LENGTH)));
    }

    public List<Proof> nextProofs() {
        byte version = nextByte(); //todo Proofs.VERSION = 1
        if (version != 1)
            throw new IllegalArgumentException("Wrong proofs version " + version + " but " + 1 + " expected");

        List<Proof> result = Proof.emptyList();
        short proofsCount = nextShort();
        for (short i = 0; i < proofsCount; i++)
            result.add(Proof.as(nextSizedArray()));

        return result;
    }

}
