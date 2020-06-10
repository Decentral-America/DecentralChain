package im.mak.waves.transactions.serializers;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.PublicKey;
import im.mak.waves.transactions.*;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.components.Order;
import im.mak.waves.transactions.components.OrderType;
import im.mak.waves.transactions.components.Transfer;
import im.mak.waves.transactions.components.data.*;
import im.mak.waves.transactions.components.invoke.*;

import java.util.ArrayList;
import java.util.List;

import static im.mak.waves.transactions.serializers.Scheme.*;
import static java.nio.charset.StandardCharsets.UTF_8;

public abstract class LegacyBinarySerializer {

    public static Order orderFromBytes(byte[] bytes, boolean versioned) {
        if (bytes.length < 1)
            throw new IllegalArgumentException("Byte array in too short to parse");
        BytesReader reader = new BytesReader(bytes);

        int version = versioned ? reader.readByte() : 1;

        Scheme scheme = Scheme.ofOrder(version);
        if (scheme != WITH_PROOFS && scheme != WITH_SIGNATURE)
            throw new IllegalArgumentException("Input is not legacy bytes");

        PublicKey sender = reader.readPublicKey();
        PublicKey matcher = reader.readPublicKey();
        Asset amountAsset = reader.readAssetOrWaves();
        Asset priceAsset = reader.readAssetOrWaves();
        OrderType type = reader.readBoolean() ? OrderType.SELL : OrderType.BUY;
        long price = reader.readLong();
        long amount = reader.readLong();
        long timestamp = reader.readLong();
        long expiration = reader.readLong();
        long fee = reader.readLong();
        Asset feeAsset = version == 3 ? reader.readAssetOrWaves() : Asset.WAVES;
        List<Proof> proofs = scheme == WITH_SIGNATURE ? reader.readSignature() : reader.readProofs();

        return new Order(sender, type, Amount.of(amount, amountAsset), Amount.of(price, priceAsset), matcher,
                Waves.chainId, fee, feeAsset, timestamp, expiration, version, proofs);
    }

    public static Transaction transactionFromBytes(byte[] bytes) {
        if (bytes.length < 2)
            throw new IllegalArgumentException("Byte array in too short to parse");
        BytesReader reader = new BytesReader(bytes);

        byte maybeVersionFlag = reader.readByte();
        byte type = maybeVersionFlag == 0 ? reader.readByte() : maybeVersionFlag;
        if (type == MassTransferTransaction.TYPE && maybeVersionFlag == 0)
            throw new IllegalArgumentException("MassTransferTransaction must not have a version flag in the start byte");
        byte version = maybeVersionFlag == 0 ? reader.readByte() : 1;

        Scheme scheme = Scheme.of(type, version);
        if (scheme != WITH_PROOFS && scheme != WITH_SIGNATURE)
            throw new IllegalArgumentException("Input is not legacy bytes");

        List<Proof> proofs = Proof.emptyList();
        if (scheme == WITH_SIGNATURE && (type == IssueTransaction.TYPE
                || type == TransferTransaction.TYPE || type == ReissueTransaction.TYPE)) {
            proofs = reader.readSignature();

            byte typeInBody = reader.readByte();
            if (typeInBody != type)
                throw new IllegalArgumentException(
                        "Expected transaction type " + type + " but " + typeInBody + " found");
        } else if (type == SponsorFeeTransaction.TYPE) {
            byte typeInBody = reader.readByte();
            if (typeInBody != type)
                throw new IllegalArgumentException(
                        "Expected transaction type " + type + " but " + typeInBody + " found");
            byte versionInBody = reader.readByte();
            if (versionInBody != version)
                throw new IllegalArgumentException(
                        "Expected transaction version " + version + " but " + versionInBody + " found");
        }

        byte chainId = Waves.chainId;

        Transaction transaction;
        if (type == 1) throw new IllegalArgumentException("Genesis transactions are not supported"); //todo
        else if (type == 2) throw new IllegalArgumentException("Payment transactions are not supported"); //todo
        else if (type == IssueTransaction.TYPE) {
            if (scheme == WITH_PROOFS)
                chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            byte[] name = reader.readArrayWithLength();
            byte[] description = reader.readArrayWithLength();
            long quantity = reader.readLong();
            int decimals = reader.readByte();
            boolean isReissuable = reader.readBoolean();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            byte[] script = (scheme == WITH_PROOFS && reader.readBoolean()) ? reader.readArrayWithLength() : null;

            if (scheme == WITH_PROOFS)
                proofs = reader.readProofs();

            transaction = new IssueTransaction(sender, name, description, quantity, decimals, isReissuable, script,
                    chainId, Amount.of(fee), timestamp, version, proofs);
        } else if (type == TransferTransaction.TYPE) {
            PublicKey sender = reader.readPublicKey();
            Asset asset = reader.readAssetOrWaves();
            Asset feeAsset = reader.readAssetOrWaves();
            long timestamp = reader.readLong();
            long amount = reader.readLong();
            long fee = reader.readLong();
            Recipient recipient = reader.readRecipient();
            byte[] attachment = reader.readArrayWithLength();

            if (scheme == WITH_PROOFS)
                proofs = reader.readProofs();

            transaction = new TransferTransaction(sender, recipient, Amount.of(amount, asset), attachment,
                    recipient.chainId(), fee, feeAsset, timestamp, version, proofs);
        } else if (type == ReissueTransaction.TYPE) {
            if (scheme == WITH_PROOFS)
                chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            Asset asset = reader.readAsset();
            long amount = reader.readLong();
            boolean reissuable = reader.readBoolean();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

            transaction = new ReissueTransaction(
                    sender, asset, amount, reissuable, chainId, fee, timestamp, version, proofs);
        } else if (type == BurnTransaction.TYPE) {
            if (scheme == WITH_PROOFS)
                chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            Asset asset = reader.readAsset();
            long amount = reader.readLong();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

            transaction = new BurnTransaction(sender, asset, amount, chainId, fee, timestamp, version, proofs);
        } else if (type == ExchangeTransaction.TYPE) {
            Order order1, order2;
            int order1Length = reader.readInt();
            if (scheme == WITH_SIGNATURE) {
                int order2Length = reader.readInt();
                order1 = orderFromBytes(reader.readBytes(order1Length), false);
                order2 = orderFromBytes(reader.readBytes(order2Length), false);
            } else {
                boolean isVersionedOrder1 = !reader.readBoolean();
                order1 = orderFromBytes(reader.readBytes(order1Length), isVersionedOrder1);
                int order2Length = reader.readInt();
                boolean isVersionedOrder2 = !reader.readBoolean();
                order2 = orderFromBytes(reader.readBytes(order2Length), isVersionedOrder2);
            }
            long price = reader.readLong();
            long amount = reader.readLong();
            long buyMatcherFee = reader.readLong();
            long sellMatcherFee = reader.readLong();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

            transaction = new ExchangeTransaction(order1.matcher(), order1, order2, amount, price,
                    buyMatcherFee, sellMatcherFee, chainId, fee, timestamp, version, proofs);
        } else if (type == LeaseTransaction.TYPE) {
            if (scheme == WITH_PROOFS && !reader.readAssetOrWaves().isWaves())
                throw new IllegalArgumentException("Only Waves allowed to lease");

            PublicKey sender = reader.readPublicKey();
            Recipient recipient = reader.readRecipient();
            long amount = reader.readLong();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

            transaction = new LeaseTransaction(
                    sender, recipient, amount, recipient.chainId(), fee, timestamp, version, proofs);
        } else if (type == LeaseCancelTransaction.TYPE) {
            if (scheme == WITH_PROOFS)
                chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            TxId leaseId = reader.readTxId();
            proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

            transaction = new LeaseCancelTransaction(sender, leaseId, chainId, fee, timestamp, version, proofs);
        } else if (type == CreateAliasTransaction.TYPE) {
            PublicKey sender = reader.readPublicKey();
            chainId = reader.readByte();
            String alias = new String(reader.readArrayWithLength(), UTF_8);
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

            transaction = new CreateAliasTransaction(sender, alias, chainId, fee, timestamp, version, proofs);
        } else if (type == MassTransferTransaction.TYPE) {
            PublicKey sender = reader.readPublicKey();
            Asset asset = reader.readAssetOrWaves();
            short transfersCount = reader.readShort();
            List<Transfer> transfers = new ArrayList<>();
            for (int i = 0; i < transfersCount; i++)
                transfers.add(Transfer.to(reader.readRecipient(), reader.readLong()));
            long timestamp = reader.readLong();
            long fee = reader.readLong();
            byte[] attachment = reader.readArrayWithLength();
            proofs = reader.readProofs();

            if (transfersCount > 0)
                chainId = transfers.get(0).recipient().chainId();

            transaction = new MassTransferTransaction(
                    sender, transfers, asset, attachment, chainId, fee, timestamp, version, proofs);
        } else if (type == DataTransaction.TYPE) {
            PublicKey sender = reader.readPublicKey();
            short entriesCount = reader.readShort();
            List<DataEntry> entries = new ArrayList<>();
            for (int i = 0; i < entriesCount; i++) {
                String key = new String(reader.readArrayWithLength(), UTF_8); //todo can be non utf8 bytes?
                byte entryType = reader.readByte();
                if (entryType == 0) entries.add(new IntegerEntry(key, reader.readLong()));
                else if (entryType == 1) entries.add(new BooleanEntry(key, reader.readBoolean()));
                else if (entryType == 2) entries.add(new BinaryEntry(key, reader.readArrayWithLength()));
                else if (entryType == 3)
                    entries.add(new StringEntry(key, new String(reader.readArrayWithLength(), UTF_8)));
                else
                    throw new IllegalArgumentException("Unknown type code " + entryType + " of the item with index " + i);
            }
            long timestamp = reader.readLong();
            long fee = reader.readLong();
            proofs = reader.readProofs();

            transaction = new DataTransaction(sender, entries, chainId, fee, timestamp, version, proofs);
        } else if (type == SetScriptTransaction.TYPE) {
            chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            byte[] script = reader.readOptionArrayWithLength();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = reader.readProofs();

            transaction = new SetScriptTransaction(sender, script, chainId, fee, timestamp, version, proofs);
        } else if (type == SponsorFeeTransaction.TYPE) {
            PublicKey sender = reader.readPublicKey();
            Asset asset = reader.readAsset();
            long minSponsoredFee = reader.readLong();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = reader.readProofs();

            transaction = new SponsorFeeTransaction(
                    sender, asset, minSponsoredFee, chainId, fee, timestamp, version, proofs);
        } else if (type == SetAssetScriptTransaction.TYPE) {
            chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            Asset asset = reader.readAsset();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            byte[] script = reader.readOptionArrayWithLength();
            proofs = reader.readProofs();

            transaction = new SetAssetScriptTransaction(
                    sender, asset, script, chainId, fee, timestamp, version, proofs);
        } else if (type == InvokeScriptTransaction.TYPE) {
            chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            Recipient dApp = reader.readRecipient();
            Function functionCall = reader.readFunctionCall();
            short paymentsCount = reader.readShort();
            List<Amount> payments = new ArrayList<>();
            for (int i = 0; i < paymentsCount; i++)
                payments.add(Amount.of(reader.readLong(), reader.readAssetOrWaves()));
            long fee = reader.readLong();
            Asset feeAsset = reader.readAssetOrWaves();
            long timestamp = reader.readLong();
            proofs = reader.readProofs();

            transaction = new InvokeScriptTransaction(
                    sender, dApp, functionCall, payments, chainId, fee, feeAsset, timestamp, version, proofs);
        } else throw new IllegalArgumentException("Unsupported transaction type " + type);

        if (reader.hasNext())
            throw new IllegalArgumentException("The size of " + bytes.length
                    + " bytes is " + (bytes.length - reader.rest())
                    + " greater than expected for type " + type + " and version " + version + " of the transaction");

        return transaction;
    }

    public static byte[] bodyBytes(TransactionOrOrder txOrOrder) {
        Scheme scheme = Scheme.of(txOrOrder);
        if (scheme != WITH_SIGNATURE && scheme != WITH_PROOFS)
            throw new IllegalArgumentException("not a legacy");

        BytesWriter bwStream = new BytesWriter();
        if (txOrOrder instanceof Order) {
            Order order = (Order) txOrOrder;
            if (order.version() > 1)
                bwStream.write((byte) order.version());

            bwStream.write(order.sender())
                    .write(order.matcher())
                    .writeAssetOrWaves(order.amount().asset())
                    .writeAssetOrWaves(order.price().asset())
                    .writeOrderType(order.type())
                    .writeLong(order.price().value())
                    .writeLong(order.amount().value())
                    .writeLong(order.timestamp())
                    .writeLong(order.expiration())
                    .writeLong(order.fee());

            if (order.version() == 3)
                bwStream.writeAssetOrWaves(order.feeAsset());
        } else {
            Transaction tx = (Transaction) txOrOrder;

            if (scheme == WITH_PROOFS && (tx instanceof ExchangeTransaction))
                bwStream.write((byte) 0);
            bwStream.write((byte) tx.type());
            if (scheme == WITH_PROOFS)
                bwStream.write((byte) tx.version());

            if (tx instanceof IssueTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                IssueTransaction itx = (IssueTransaction) tx;
                bwStream.write(itx.sender())
                        .writeArrayWithLength(itx.nameBytes())
                        .writeArrayWithLength(itx.descriptionBytes())
                        .writeLong(itx.quantity())
                        .write((byte) itx.decimals())
                        .write(itx.isReissuable())
                        .writeLong(itx.fee())
                        .writeLong(itx.timestamp());
                if (scheme == WITH_PROOFS)
                    bwStream.writeOptionArrayWithLength(itx.compiledScript());
            } else if (tx instanceof TransferTransaction) {
                TransferTransaction ttx = (TransferTransaction) tx;
                bwStream.write(ttx.sender().bytes())
                        .writeAssetOrWaves(ttx.amount().asset())
                        .writeAssetOrWaves(ttx.feeAsset())
                        .writeLong(ttx.timestamp())
                        .writeLong(ttx.amount().value())
                        .writeLong(ttx.fee())
                        .write(ttx.recipient())
                        .writeArrayWithLength(ttx.attachmentBytes());
            } else if (tx instanceof ReissueTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                ReissueTransaction rtx = (ReissueTransaction) tx;
                bwStream.write(rtx.sender())
                        .writeAsset(rtx.asset())
                        .writeLong(rtx.amount())
                        .write(rtx.isReissuable())
                        .writeLong(rtx.fee())
                        .writeLong(rtx.timestamp());
            } else if (tx instanceof BurnTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                BurnTransaction btx = (BurnTransaction) tx;
                bwStream.write(btx.sender())
                        .writeAsset(btx.asset())
                        .writeLong(btx.amount())
                        .writeLong(btx.fee())
                        .writeLong(btx.timestamp());
            } else if (tx instanceof ExchangeTransaction) {
                ExchangeTransaction etx = (ExchangeTransaction) tx;
                //todo etx.orders.get(0)
                Order order1 = etx.isDirectionBuySell() ? etx.buyOrder() : etx.sellOrder();
                Order order2 = etx.isDirectionBuySell() ? etx.sellOrder() : etx.buyOrder();
                int order1Size = order1.toBytes().length;
                int order2Size = order2.toBytes().length;
                bwStream.writeInt(order1Size);
                if (scheme == WITH_SIGNATURE) {
                    bwStream.writeInt(order2Size)
                            .write(toBytes(order1));
                } else {
                    bwStream.write(order1.version() == 1)
                            .write(toBytes(order1))
                            .writeInt(order2Size)
                            .write(order2.version() == 1);
                }
                bwStream.write(toBytes(order2))
                        .writeLong(etx.price())
                        .writeLong(etx.amount())
                        .writeLong(etx.buyMatcherFee())
                        .writeLong(etx.sellMatcherFee())
                        .writeLong(etx.fee())
                        .writeLong(etx.timestamp());
            } else if (tx instanceof LeaseTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.writeAssetOrWaves(Asset.WAVES);
                LeaseTransaction ltx = (LeaseTransaction) tx;
                bwStream.write(ltx.sender())
                        .write(ltx.recipient())
                        .writeLong(ltx.amount())
                        .writeLong(ltx.fee())
                        .writeLong(ltx.timestamp());
            } else if (tx instanceof LeaseCancelTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                LeaseCancelTransaction lcTx = (LeaseCancelTransaction) tx;
                bwStream.write(lcTx.sender())
                        .writeLong(lcTx.fee())
                        .writeLong(lcTx.timestamp())
                        .writeTxId(lcTx.leaseId());
            } else if (tx instanceof CreateAliasTransaction) {
                CreateAliasTransaction caTx = (CreateAliasTransaction) tx;
                bwStream.write(caTx.sender())
                        .write(caTx.chainId())
                        .writeArrayWithLength(caTx.alias().getBytes(UTF_8))
                        .writeLong(caTx.fee())
                        .writeLong(caTx.timestamp());
            } else if (tx instanceof MassTransferTransaction) {
                MassTransferTransaction mtTx = (MassTransferTransaction) tx;
                bwStream.write(mtTx.sender())
                        .writeAssetOrWaves(mtTx.asset())
                        .writeShort((short) mtTx.transfers().size());
                mtTx.transfers().forEach(transfer -> bwStream
                        .write(transfer.recipient())
                        .writeLong(transfer.amount()));
                bwStream.writeLong(mtTx.timestamp())
                        .writeLong(mtTx.fee())
                        .writeArrayWithLength(mtTx.attachmentBytes());
            } else if (tx instanceof DataTransaction) {
                DataTransaction dtx = (DataTransaction) tx;
                bwStream.write(dtx.sender())
                        .writeShort((short) dtx.data().size());
                dtx.data().forEach(entry -> {
                    bwStream.writeArrayWithLength(entry.key().getBytes(UTF_8));
                    if (entry instanceof IntegerEntry)
                        bwStream.write((byte) 0)
                                .writeLong(((IntegerEntry) entry).value());
                    else if (entry instanceof BooleanEntry)
                        bwStream.write((byte) 1)
                                .write(((BooleanEntry) entry).value());
                    else if (entry instanceof BinaryEntry)
                        bwStream.write((byte) 2)
                                .writeArrayWithLength(((BinaryEntry) entry).value());
                    else if (entry instanceof StringEntry)
                        bwStream.write((byte) 3)
                                .writeArrayWithLength(((StringEntry) entry).value().getBytes(UTF_8));
                    else
                        throw new IllegalArgumentException("Unknown entry type " + entry.getClass().getCanonicalName()); //todo
                });
                bwStream.writeLong(dtx.timestamp())
                        .writeLong(dtx.fee());
            } else if (tx instanceof SetScriptTransaction) {
                SetScriptTransaction ssTx = (SetScriptTransaction) tx;
                bwStream.write(ssTx.chainId())
                        .write(ssTx.sender())
                        .writeOptionArrayWithLength(ssTx.compiledScript())
                        .writeLong(ssTx.fee())
                        .writeLong(ssTx.timestamp());
            } else if (tx instanceof SponsorFeeTransaction) {
                SponsorFeeTransaction sfTx = (SponsorFeeTransaction) tx;
                bwStream.write(sfTx.sender())
                        .writeAsset(sfTx.asset())
                        .writeLong(sfTx.minSponsoredFee())
                        .writeLong(sfTx.fee())
                        .writeLong(sfTx.timestamp());
            } else if (tx instanceof SetAssetScriptTransaction) {
                SetAssetScriptTransaction sasTx = (SetAssetScriptTransaction) tx;
                bwStream.write(sasTx.chainId())
                        .write(sasTx.sender())
                        .writeAsset(sasTx.asset())
                        .writeLong(sasTx.fee())
                        .writeLong(sasTx.timestamp())
                        .writeOptionArrayWithLength(sasTx.compiledScript());
            } else if (tx instanceof InvokeScriptTransaction) {
                InvokeScriptTransaction isTx = (InvokeScriptTransaction) tx;
                bwStream.write(Bytes.of(isTx.chainId()))
                        .write(isTx.sender())
                        .write(isTx.dApp())
                        .write(isTx.function())
                        .writeShort((short) isTx.payments().size());
                isTx.payments().forEach(payment -> bwStream
                        .writeLong(payment.value())
                        .writeAssetOrWaves(payment.asset()));
                bwStream.writeLong(isTx.fee())
                        .writeAssetOrWaves(isTx.feeAsset())
                        .writeLong(isTx.timestamp());
            }
        }

        return bwStream.getBytes();
    }

    public static byte[] toBytes(TransactionOrOrder txOrOrder) {
        Scheme scheme = Scheme.of(txOrOrder);
        if (scheme != WITH_SIGNATURE && scheme != WITH_PROOFS)
            throw new IllegalArgumentException("not a legacy");

        BytesWriter bwStream = new BytesWriter();
        if (txOrOrder instanceof Order) {
            Order order = (Order) txOrOrder;
            bwStream.write(order.bodyBytes())
                    .write(proofsToBytes(order.proofs(), order.version() > 1));
        } else {
            Transaction tx = (Transaction) txOrOrder;

            if (scheme == WITH_SIGNATURE) {
                if (tx instanceof IssueTransaction
                        || tx instanceof TransferTransaction
                        || tx instanceof ReissueTransaction)
                    bwStream.write((byte) tx.type())
                            .writeSignature(tx.proofs())
                            .write(tx.bodyBytes());
                else
                    bwStream.write(tx.bodyBytes())
                            .writeSignature(tx.proofs());
            }

            if (scheme == WITH_PROOFS) {
                if (!(tx instanceof MassTransferTransaction
                        || tx instanceof ExchangeTransaction))
                    bwStream.write((byte) 0);

                if (tx instanceof SponsorFeeTransaction)
                    bwStream.write((byte) tx.type(), (byte) tx.version());

                bwStream.write(tx.bodyBytes())
                        .writeProofs(tx.proofs());
            }
        }

        return bwStream.getBytes();
    }

    protected static byte[] proofsToBytes(List<Proof> proofs, boolean withProofs) {
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
