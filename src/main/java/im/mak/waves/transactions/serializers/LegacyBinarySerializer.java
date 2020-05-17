package im.mak.waves.transactions.serializers;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.Bytes.ByteReader;
import im.mak.waves.crypto.account.Address;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.LeaseTransaction;
import im.mak.waves.transactions.Transaction;
import im.mak.waves.transactions.common.Alias;
import im.mak.waves.transactions.common.Proof;
import im.mak.waves.transactions.common.Recipient;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import static im.mak.waves.crypto.Bytes.concat;
import static im.mak.waves.crypto.Bytes.of;

public class LegacyBinarySerializer {

    public static byte[] bodyBytes(Transaction tx) {
        byte[] result = Bytes.empty();
        try (ByteArrayOutputStream stream = new ByteArrayOutputStream()) {

            if (tx instanceof LeaseTransaction) {
                LeaseTransaction ltx = (LeaseTransaction) tx;
                if (ltx.version() > 2)
                    throw new RuntimeException("not legacy"); //todo what an exception is better?

                boolean withProofs = ltx.version() == 2;

                stream.write(Bytes.of((byte) ltx.type()));
                if (withProofs)
                    stream.write(Bytes.of((byte) ltx.version(), (byte) 0));

                stream.write(ltx.sender().bytes());
                stream.write(recipientToBytes(ltx.recipient()));
                stream.write(Bytes.fromLong(ltx.amount()));
                stream.write(Bytes.fromLong(ltx.fee()));
                stream.write(Bytes.fromLong(ltx.timestamp()));
            } //todo other types

            result = stream.toByteArray();
        } catch (IOException e) {
            e.printStackTrace(); //todo
        }

        return result;
    }

    public static byte[] bytes(Transaction tx) {
        byte[] result = Bytes.empty();
        try (ByteArrayOutputStream stream = new ByteArrayOutputStream()) {
            if (tx instanceof LeaseTransaction) {
                LeaseTransaction ltx = (LeaseTransaction) tx;
                boolean withProofs = ltx.version() == 2;
                if (withProofs)
                    stream.write(Bytes.of((byte) 0));
                stream.write(ltx.bodyBytes());
                stream.write(proofsToBytes(ltx.proofs(), withProofs));

                result = stream.toByteArray();
            } //todo other types
        } catch (IOException e) {
            e.printStackTrace(); //todo
        }
        return result;
    }

    public static Transaction fromBytes(byte[] bytes) throws IOException {
        if (bytes.length < 4)
            throw new IOException("Byte array in too short to parse a transaction");
        boolean withProofs = bytes[0] == 0;
        int index = withProofs ? 1 : 0;

        int type = bytes[index];
        int version = withProofs ? bytes[index + 1] : 1;
        byte[] data = Bytes.chunk(bytes, withProofs ? 3 : 1)[1];

        Transaction transaction;
        ByteReader reader = new ByteReader(data);
        if (type == 1) throw new IOException("Genesis transactions are not supported"); //todo
        else if (type == 2) throw new IOException("Payment transactions are not supported"); //todo
        else if (type == LeaseTransaction.TYPE) transaction = lease(reader, version, withProofs);
        else throw new IOException("Unknown transaction type " + type);

        if (reader.hasNext())
            throw new IOException("The size of " + bytes.length
                    + " bytes is " + (bytes.length - reader.rest())
                    + " greater than expected for type " + type + " and version " + version + " of the transaction");

        return transaction;
    }

    private static LeaseTransaction lease(ByteReader data, int version, boolean withProofs) throws IOException {
        if (withProofs && data.read() != 0)
            throw new IOException("Reserved field must be 0");

        PublicKey sender = PublicKey.as(data.read(32)); //todo PublicKey.LENGTH
        Recipient recipient = readRecipient(data);
        long amount = data.readLong();
        long fee = data.readLong();
        long timestamp = data.readLong();
        List<Proof> proofs = readProofs(data, withProofs);

        LeaseTransaction tx = new LeaseTransaction(sender, recipient, amount, recipient.chainId(), fee, timestamp, version);
        proofs.forEach(p -> tx.proofs().add(p)); //todo `Proofs extends List` or move proofs to builder
        return tx;
    }

    private static Recipient readRecipient(ByteReader data) throws IOException {
        byte recipientType = data.read(); //todo Recipient.from(bytes) or Alias.from(bytes)
        if (recipientType == 1)
            return Recipient.as(Address.as(concat(of(recipientType), data.read(25)))); //todo Address.LENGTH
        else if (recipientType == 2) {
            return Recipient.as(Alias.as(data.read(), new String(data.readArray()))); //todo Alias.as(bytes)
        } else throw new IOException("Unknown recipient type");
    }

    private static byte[] recipientToBytes(Recipient recipient) {
        if (recipient.isAlias())
            return Bytes.concat(
                    Bytes.of((byte) 2, recipient.chainId()),
                    Bytes.toSizedByteArray(recipient.alias().value().getBytes()));
        else
            return recipient.address().bytes();
    }

    private static List<Proof> readProofs(ByteReader data, boolean withProofs) throws IOException {
        if (withProofs) {
            byte version = data.read(); //todo Proofs.VERSION = 1
            if (version != 1)
                throw new IOException("Wrong proofs version " + version + " but " + 1 + " expected");

            List<Proof> result = Proof.emptyList();
            short proofsCount = data.readShort();
            for (short i = 0; i < proofsCount; i++)
                result.add(Proof.as(data.readArray()));

            return result;
        } else {
            return Proof.list(Proof.as(data.read(64)));
        }
    }

    private static byte[] proofsToBytes(List<Proof> proofs, boolean withProofs) {
        if (withProofs) {
            byte[] proofsVersion = Bytes.of((byte) 1);
            byte[] proofsBytes = Bytes.fromShort((short) proofs.size());
            for (Proof proof : proofs)
                proofsBytes = Bytes.concat(proofsBytes, Bytes.toSizedByteArray(proof.bytes()));
            return Bytes.concat(proofsVersion, proofsBytes);
        } else {
            if (proofs.size() != 1)
                throw new IllegalArgumentException("Transaction of this type and version must have only 1 proof");
            return proofs.get(0).bytes();
        }
    }

}
