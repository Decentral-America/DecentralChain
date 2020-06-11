package im.mak.waves.transactions.serializers;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.crypto.account.Address;
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
            throw new IllegalArgumentException("Byte array is too short to parse");
        BytesReader reader = new BytesReader(bytes);

        int version = versioned ? reader.readByte() : 1;

        Scheme scheme = Scheme.ofOrder(version);
        if (scheme != WITH_PROOFS && scheme != WITH_SIGNATURE)
            throw new IllegalArgumentException("Input is not legacy bytes");

        PublicKey sender = reader.readPublicKey();
        PublicKey matcher = reader.readPublicKey();
        Asset amountAsset = reader.readAssetOrWaves();
        Asset priceAsset = reader.readAssetOrWaves();
        OrderType type = reader.readOrderType();
        long price = reader.readLong();
        long amount = reader.readLong();
        long timestamp = reader.readLong();
        long expiration = reader.readLong();
        long fee = reader.readLong();
        Asset feeAsset = version == 3 ? reader.readAssetOrWaves() : Asset.WAVES;
        List<Proof> proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

        return new Order(sender, type, Amount.of(amount, amountAsset), Amount.of(price, priceAsset), matcher,
                Waves.chainId, fee, feeAsset, timestamp, expiration, version, proofs);
    }

    public static Transaction transactionFromBytes(byte[] bytes) {
        if (bytes.length < 2)
            throw new IllegalArgumentException("Byte array is too short to parse");
        BytesReader reader = new BytesReader(bytes);
        byte chainId = Waves.chainId;

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
        }

        Transaction transaction;
        if (type == GenesisTransaction.TYPE) {
            long timestamp = reader.readLong();
            Address recipient = Address.as(reader.readBytes(26)); //todo Address.LENGTH
            long amount = reader.readLong();

            transaction = new GenesisTransaction(recipient, amount, timestamp);
        } else if (type == PaymentTransaction.TYPE) {
            long timestamp = reader.readLong();
            PublicKey sender = reader.readPublicKey();
            Address recipient = Address.as(reader.readBytes(26)); //todo Address.LENGTH
            long amount = reader.readLong();
            long fee = reader.readLong();
            Proof signature = reader.readSignature().get(0);

            transaction = new PaymentTransaction(sender, recipient, amount, fee, timestamp, signature);
        } else if (type == IssueTransaction.TYPE) {
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
            if (scheme == WITH_PROOFS) {
                boolean isVersionedOrder1 = !reader.readBoolean();
                order1 = orderFromBytes(reader.readBytes(order1Length), isVersionedOrder1);
                int order2Length = reader.readInt();
                boolean isVersionedOrder2 = !reader.readBoolean();
                order2 = orderFromBytes(reader.readBytes(order2Length), isVersionedOrder2);
            } else {
                int order2Length = reader.readInt();
                order1 = orderFromBytes(reader.readBytes(order1Length), false);
                order2 = orderFromBytes(reader.readBytes(order2Length), false);
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
        if (scheme != WITH_PROOFS && scheme != WITH_SIGNATURE)
            throw new IllegalArgumentException("not a legacy");

        BytesWriter bwStream = new BytesWriter();
        if (txOrOrder instanceof Order) {
            if (scheme == WITH_PROOFS)
                bwStream.write((byte) txOrOrder.version());

            Order order = (Order) txOrOrder;
            bwStream.writePublicKey(order.sender())
                    .writePublicKey(order.matcher())
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

            if (tx instanceof PaymentTransaction)
                bwStream.writeInt(tx.type());
            else
                bwStream.write((byte) tx.type());

            if (scheme == WITH_PROOFS)
                bwStream.write((byte) tx.version());

            if (tx instanceof GenesisTransaction) {
                GenesisTransaction gtx = (GenesisTransaction) tx;
                bwStream.writeLong(gtx.timestamp())
                        .write(gtx.recipient().bytes())
                        .writeLong(gtx.amount());
            } else if (tx instanceof PaymentTransaction) {
                PaymentTransaction ptx = (PaymentTransaction) tx;
                bwStream.writeLong(ptx.timestamp())
                        .writePublicKey(ptx.sender())
                        .write(ptx.recipient().bytes())
                        .writeLong(ptx.amount())
                        .writeLong(ptx.fee());
            } else if (tx instanceof IssueTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                IssueTransaction itx = (IssueTransaction) tx;
                bwStream.writePublicKey(itx.sender())
                        .writeArrayWithLength(itx.nameBytes())
                        .writeArrayWithLength(itx.descriptionBytes())
                        .writeLong(itx.quantity())
                        .write((byte) itx.decimals())
                        .writeBoolean(itx.isReissuable())
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
                        .writeRecipient(ttx.recipient())
                        .writeArrayWithLength(ttx.attachmentBytes());
            } else if (tx instanceof ReissueTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                ReissueTransaction rtx = (ReissueTransaction) tx;
                bwStream.writePublicKey(rtx.sender())
                        .writeAsset(rtx.asset())
                        .writeLong(rtx.amount())
                        .writeBoolean(rtx.isReissuable())
                        .writeLong(rtx.fee())
                        .writeLong(rtx.timestamp());
            } else if (tx instanceof BurnTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                BurnTransaction btx = (BurnTransaction) tx;
                bwStream.writePublicKey(btx.sender())
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
                if (scheme == WITH_PROOFS)
                    bwStream.writeBoolean(order1.version() == 1)
                            .write(toBytes(order1))
                            .writeInt(order2Size)
                            .writeBoolean(order2.version() == 1);
                else
                    bwStream.writeInt(order2Size)
                            .write(toBytes(order1));
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
                bwStream.writePublicKey(ltx.sender())
                        .writeRecipient(ltx.recipient())
                        .writeLong(ltx.amount())
                        .writeLong(ltx.fee())
                        .writeLong(ltx.timestamp());
            } else if (tx instanceof LeaseCancelTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                LeaseCancelTransaction lcTx = (LeaseCancelTransaction) tx;
                bwStream.writePublicKey(lcTx.sender())
                        .writeLong(lcTx.fee())
                        .writeLong(lcTx.timestamp())
                        .writeTxId(lcTx.leaseId());
            } else if (tx instanceof CreateAliasTransaction) {
                CreateAliasTransaction caTx = (CreateAliasTransaction) tx;
                bwStream.writePublicKey(caTx.sender())
                        .write(caTx.chainId())
                        .writeArrayWithLength(caTx.alias().getBytes(UTF_8))
                        .writeLong(caTx.fee())
                        .writeLong(caTx.timestamp());
            } else if (tx instanceof MassTransferTransaction) {
                MassTransferTransaction mtTx = (MassTransferTransaction) tx;
                bwStream.writePublicKey(mtTx.sender())
                        .writeAssetOrWaves(mtTx.asset())
                        .writeShort((short) mtTx.transfers().size());
                mtTx.transfers().forEach(transfer -> bwStream
                        .writeRecipient(transfer.recipient())
                        .writeLong(transfer.amount()));
                bwStream.writeLong(mtTx.timestamp())
                        .writeLong(mtTx.fee())
                        .writeArrayWithLength(mtTx.attachmentBytes());
            } else if (tx instanceof DataTransaction) {
                DataTransaction dtx = (DataTransaction) tx;
                bwStream.writePublicKey(dtx.sender())
                        .writeShort((short) dtx.data().size());
                dtx.data().forEach(entry -> {
                    bwStream.writeArrayWithLength(entry.key().getBytes(UTF_8));
                    if (entry instanceof IntegerEntry)
                        bwStream.write((byte) 0)
                                .writeLong(((IntegerEntry) entry).value());
                    else if (entry instanceof BooleanEntry)
                        bwStream.write((byte) 1)
                                .writeBoolean(((BooleanEntry) entry).value());
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
                        .writePublicKey(ssTx.sender())
                        .writeOptionArrayWithLength(ssTx.compiledScript())
                        .writeLong(ssTx.fee())
                        .writeLong(ssTx.timestamp());
            } else if (tx instanceof SponsorFeeTransaction) {
                SponsorFeeTransaction sfTx = (SponsorFeeTransaction) tx;
                bwStream.writePublicKey(sfTx.sender())
                        .writeAsset(sfTx.asset())
                        .writeLong(sfTx.minSponsoredFee())
                        .writeLong(sfTx.fee())
                        .writeLong(sfTx.timestamp());
            } else if (tx instanceof SetAssetScriptTransaction) {
                SetAssetScriptTransaction sasTx = (SetAssetScriptTransaction) tx;
                bwStream.write(sasTx.chainId())
                        .writePublicKey(sasTx.sender())
                        .writeAsset(sasTx.asset())
                        .writeLong(sasTx.fee())
                        .writeLong(sasTx.timestamp())
                        .writeOptionArrayWithLength(sasTx.compiledScript());
            } else if (tx instanceof InvokeScriptTransaction) {
                InvokeScriptTransaction isTx = (InvokeScriptTransaction) tx;
                bwStream.write(Bytes.of(isTx.chainId()))
                        .writePublicKey(isTx.sender())
                        .writeRecipient(isTx.dApp())
                        .writeFunction(isTx.function())
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
        if (scheme != WITH_PROOFS && scheme != WITH_SIGNATURE)
            throw new IllegalArgumentException("not a legacy");

        BytesWriter bwStream = new BytesWriter();
        if (txOrOrder instanceof Order) {
            bwStream.write(txOrOrder.bodyBytes());
            if (scheme == WITH_PROOFS)
                bwStream.writeSignature(txOrOrder.proofs());
            else
                bwStream.writeProofs(txOrOrder.proofs());
        } else {
            Transaction tx = (Transaction) txOrOrder;

            if (scheme == WITH_PROOFS) {
                if (!(tx instanceof MassTransferTransaction
                        || tx instanceof ExchangeTransaction))
                    bwStream.write((byte) 0);

                if (tx instanceof SponsorFeeTransaction)
                    bwStream.write((byte) tx.type(), (byte) tx.version());

                bwStream.write(tx.bodyBytes())
                        .writeProofs(tx.proofs());
            }

            if (scheme == WITH_SIGNATURE) {
                if (tx instanceof IssueTransaction
                        || tx instanceof TransferTransaction
                        || tx instanceof ReissueTransaction)
                    bwStream.write((byte) tx.type())
                            .writeSignature(tx.proofs())
                            .write(tx.bodyBytes());
                else if (tx instanceof PaymentTransaction) {
                    byte[] bodyWithoutIntType = Bytes.drop(tx.bodyBytes(), 4);
                    bwStream.write((byte) tx.type())
                            .write(bodyWithoutIntType)
                            .writeSignature(tx.proofs());
                } else
                    bwStream.write(tx.bodyBytes())
                            .writeSignature(tx.proofs());
            }
        }

        return bwStream.getBytes();
    }

}
