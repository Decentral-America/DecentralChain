package im.mak.waves.transactions.serializers;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.Address;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.common.Alias;
import im.mak.waves.transactions.common.Asset;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Recipient;
import im.mak.waves.transactions.components.invoke.*;

import java.io.IOException;
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

    public byte read() {
        return bytes[index++];
    }

    public byte[] read(int count) {
        byte[] result = Arrays.copyOfRange(bytes, index, index + count);
        index = index + count;
        return result;
    }

    public boolean readBoolean() throws IOException {
        byte byt = read();
        if (byt == 0)
            return false;
        else if (byt == 1)
            return true;
        else throw new IOException("Can't read byte " + byt + " as boolean. Expected 1 or 0");
    }

    public short readShort() {
        return Bytes.toShort(read(2));
    }

    public int readInt() {
        return Bytes.toInt(read(4));
    }

    public long readLong() {
        return Bytes.toLong(read(8));
    }

    public byte[] readSizedArray() {
        short arrayLength = readShort();
        return read(arrayLength);
    }

    public PublicKey readPublicKey() {
        return PublicKey.as(read(PublicKey.BYTES_LENGTH));
    }

    public Recipient readRecipient() throws IOException {
        byte recipientType = read(); //todo Recipient.from(bytes) or Alias.from(bytes)
        if (recipientType == 1)
            return Recipient.as(Address.as(concat(of(recipientType), read(25)))); //todo Address.LENGTH
        else if (recipientType == 2) {
            return Recipient.as(Alias.as(read(), new String(readSizedArray()))); //todo Alias.as(bytes)
        } else throw new IOException("Unknown recipient type");
    }

    public Asset readAsset() {
        return Asset.id(read(Asset.BYTE_LENGTH));
    }

    public Asset readAssetOrWaves() throws IOException {
        boolean isAsset = readBoolean();
        return isAsset ? readAsset() : Asset.WAVES;
    }

    public Function readFunctionCall() throws IOException {
        if (readBoolean()) {
            if (read() != 9) throw new IOException("FunctionCall Id must be equal 9");
            if (read() != 1) throw new IOException("Function type Id must be equal 1");
            String name = new String(readSizedArray(), UTF_8);
            int argsCount = readInt();
            List<Arg> args = new ArrayList<>();
            for (int i = 0; i < argsCount; i++) {
                byte argType = read();
                if (argType == 0) args.add(IntegerArg.as(readLong()));
                else if (argType == 1) args.add(BinaryArg.as(readSizedArray()));
                else if (argType == 2) args.add(StringArg.as(new String(readSizedArray(), UTF_8)));
                else if (argType == 6) args.add(BooleanArg.as(true));
                else if (argType == 7) args.add(BooleanArg.as(false));
                    //todo else if (argType == 11) args.add(ListArg.as(...));
                else throw new IOException("Unknown arg type " + argType);
            }
            return Function.as(name, args);
        } else return Function.asDefault();
    }

    public List<Proof> readSignature() {
        return Proof.list(Proof.as(read(Proof.BYTE_LENGTH)));
    }

    public List<Proof> readProofs() throws IOException {
        byte version = read(); //todo Proofs.VERSION = 1
        if (version != 1)
            throw new IOException("Wrong proofs version " + version + " but " + 1 + " expected");

        List<Proof> result = Proof.emptyList();
        short proofsCount = readShort();
        for (short i = 0; i < proofsCount; i++)
            result.add(Proof.as(readSizedArray()));

        return result;
    }

}
