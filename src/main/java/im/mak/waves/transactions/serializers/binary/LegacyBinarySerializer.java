package im.mak.waves.transactions.serializers.binary;

import im.mak.waves.crypto.Bytes;
import im.mak.waves.transactions.account.Address;
import im.mak.waves.transactions.account.PublicKey;
import im.mak.waves.transactions.*;
import im.mak.waves.transactions.common.*;
import im.mak.waves.transactions.data.*;
import im.mak.waves.transactions.exchange.Order;
import im.mak.waves.transactions.exchange.OrderType;
import im.mak.waves.transactions.invocation.Function;
import im.mak.waves.transactions.mass.Transfer;
import im.mak.waves.transactions.serializers.Scheme;

import java.util.ArrayList;
import java.util.List;

import static im.mak.waves.crypto.Bytes.concat;
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
        AssetId amountAssetId = reader.readAssetIdOrWaves();
        AssetId priceAssetId = reader.readAssetIdOrWaves();
        OrderType type = reader.readOrderType();
        long price = reader.readLong();
        long amount = reader.readLong();
        long timestamp = reader.readLong();
        long expiration = reader.readLong();
        long fee = reader.readLong();
        AssetId feeAssetId = version == 3 ? reader.readAssetIdOrWaves() : AssetId.WAVES;
        List<Proof> proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

        return new Order(sender, type, Amount.of(amount, amountAssetId), Amount.of(price, priceAssetId), matcher,
                WavesJConfig.chainId(), Amount.of(fee, feeAssetId), timestamp, expiration, version, proofs);
    }

    public static Transaction transactionFromBytes(byte[] bytes) {
        if (bytes.length < 2)
            throw new IllegalArgumentException("Byte array is too short to parse");
        byte chainId = WavesJConfig.chainId();
        BytesReader reader = new BytesReader(bytes);

        byte maybeVersionFlag = reader.readByte();
        byte type = maybeVersionFlag == 0 ? reader.readByte() : maybeVersionFlag;
        if (type == MassTransferTransaction.TYPE && maybeVersionFlag == 0)
            throw new IllegalArgumentException("MassTransferTransaction must not have a version flag in the start byte");
        byte version = maybeVersionFlag == 0 || type == MassTransferTransaction.TYPE ? reader.readByte() : 1;

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
            Address recipient = Address.as(reader.readBytes(Address.BYTES_LENGTH));
            long amount = reader.readLong();

            transaction = new GenesisTransaction(recipient, amount, timestamp);
        } else if (type == PaymentTransaction.TYPE) {
            long timestamp = reader.readLong();
            PublicKey sender = reader.readPublicKey();
            Address recipient = Address.as(reader.readBytes(Address.BYTES_LENGTH));
            long amount = reader.readLong();
            long fee = reader.readLong();
            Proof signature = reader.readSignature().get(0);

            transaction = new PaymentTransaction(sender, recipient, amount, Amount.of(fee), timestamp, signature);
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
            byte[] script = scheme == WITH_PROOFS ? reader.readOptionArrayWithLength() : null;

            if (scheme == WITH_PROOFS)
                proofs = reader.readProofs();

            transaction = new IssueTransaction(sender, name, description, quantity, decimals, isReissuable, script,
                    chainId, Amount.of(fee), timestamp, version, proofs);
        } else if (type == TransferTransaction.TYPE) {
            PublicKey sender = reader.readPublicKey();
            AssetId assetId = reader.readAssetIdOrWaves();
            AssetId feeAssetId = reader.readAssetIdOrWaves();
            long timestamp = reader.readLong();
            long amount = reader.readLong();
            long fee = reader.readLong();
            Recipient recipient = reader.readRecipient();
            byte[] attachment = reader.readArrayWithLength();

            if (scheme == WITH_PROOFS)
                proofs = reader.readProofs();

            transaction = new TransferTransaction(sender, recipient, Amount.of(amount, assetId), attachment,
                    recipient.chainId(), Amount.of(fee, feeAssetId), timestamp, version, proofs);
        } else if (type == ReissueTransaction.TYPE) {
            if (scheme == WITH_PROOFS)
                chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            AssetId assetId = reader.readAssetId();
            long amount = reader.readLong();
            boolean reissuable = reader.readBoolean();
            long fee = reader.readLong();
            long timestamp = reader.readLong();

            if (scheme == WITH_PROOFS)
                proofs = reader.readProofs();

            transaction = new ReissueTransaction(
                    sender, Amount.of(amount, assetId), reissuable, chainId, Amount.of(fee), timestamp, version, proofs);
        } else if (type == BurnTransaction.TYPE) {
            if (scheme == WITH_PROOFS)
                chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            AssetId assetId = reader.readAssetId();
            long amount = reader.readLong();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

            transaction = new BurnTransaction(
                    sender, Amount.of(amount, assetId), chainId, Amount.of(fee), timestamp, version, proofs);
        } else if (type == ExchangeTransaction.TYPE) {
            Order order1, order2;
            int order1Length = reader.readInt();
            if (scheme == WITH_PROOFS) {
                byte order1Version = reader.readByte();
                if (order1Version > 1) {
                    byte[] order1Bytes = concat(Bytes.of(order1Version), reader.readBytes(order1Length - 1));
                    order1 = orderFromBytes(order1Bytes, true);
                } else {
                    byte[] order1Bytes = reader.readBytes(order1Length);
                    order1 = orderFromBytes(order1Bytes, false);
                }

                int order2Length = reader.readInt();
                byte order2Version = reader.readByte();
                if (order2Version > 1) {
                    byte[] order2Bytes = concat(Bytes.of(order2Version), reader.readBytes(order2Length - 1));
                    order2 = orderFromBytes(order2Bytes, true);
                } else {
                    byte[] order2Bytes = reader.readBytes(order2Length);
                    order2 = orderFromBytes(order2Bytes, false);
                }
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
                    buyMatcherFee, sellMatcherFee, chainId, Amount.of(fee), timestamp, version, proofs);
        } else if (type == LeaseTransaction.TYPE) {
            if (scheme == WITH_PROOFS && !reader.readAssetIdOrWaves().isWaves())
                throw new IllegalArgumentException("Only Waves allowed to lease");

            PublicKey sender = reader.readPublicKey();
            Recipient recipient = reader.readRecipient();
            long amount = reader.readLong();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

            transaction = new LeaseTransaction(
                    sender, recipient, amount, recipient.chainId(), Amount.of(fee), timestamp, version, proofs);
        } else if (type == LeaseCancelTransaction.TYPE) {
            if (scheme == WITH_PROOFS)
                chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            Id leaseId = reader.readTxId();
            proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

            transaction = new LeaseCancelTransaction(
                    sender, leaseId, chainId, Amount.of(fee), timestamp, version, proofs);
        } else if (type == CreateAliasTransaction.TYPE) {
            PublicKey sender = reader.readPublicKey();
            byte[] aliasBytes = reader.readArrayWithLength();
            Alias alias = (Alias) new BytesReader(aliasBytes).readRecipient();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = scheme == WITH_PROOFS ? reader.readProofs() : reader.readSignature();

            transaction = new CreateAliasTransaction(
                    sender, alias.name(), alias.chainId(), Amount.of(fee), timestamp, version, proofs);
        } else if (type == MassTransferTransaction.TYPE) {
            PublicKey sender = reader.readPublicKey();
            AssetId assetId = reader.readAssetIdOrWaves();
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
                    sender, assetId, transfers, attachment, chainId, Amount.of(fee), timestamp, version, proofs);
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

            transaction = new DataTransaction(sender, entries, chainId, Amount.of(fee), timestamp, version, proofs);
        } else if (type == SetScriptTransaction.TYPE) {
            chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            byte[] script = reader.readOptionArrayWithLength();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = reader.readProofs();

            transaction = new SetScriptTransaction(sender, script, chainId, Amount.of(fee), timestamp, version, proofs);
        } else if (type == SponsorFeeTransaction.TYPE) {
            int typeInBody = reader.readByte();
            if (typeInBody != type)
                throw new IllegalArgumentException(
                        "Expected transaction type " + type + " but " + typeInBody + " found");
            int versionInBody = reader.readByte();
            if (versionInBody != version)
                throw new IllegalArgumentException(
                        "Expected transaction type " + type + " but " + typeInBody + " found");
            PublicKey sender = reader.readPublicKey();
            AssetId assetId = reader.readAssetId();
            long minSponsoredFee = reader.readLong();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            proofs = reader.readProofs();

            transaction = new SponsorFeeTransaction(
                    sender, assetId, minSponsoredFee, chainId, Amount.of(fee), timestamp, version, proofs);
        } else if (type == SetAssetScriptTransaction.TYPE) {
            chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            AssetId assetId = reader.readAssetId();
            long fee = reader.readLong();
            long timestamp = reader.readLong();
            byte[] script = reader.readOptionArrayWithLength();
            proofs = reader.readProofs();

            transaction = new SetAssetScriptTransaction(
                    sender, assetId, script, chainId, Amount.of(fee), timestamp, version, proofs);
        } else if (type == InvokeScriptTransaction.TYPE) {
            chainId = reader.readByte();
            PublicKey sender = reader.readPublicKey();
            Recipient dApp = reader.readRecipient();
            Function functionCall = reader.readFunctionCall();
            short paymentsCount = reader.readShort();
            List<Amount> payments = new ArrayList<>();
            for (int i = 0; i < paymentsCount; i++) {
                byte[] paymentBytes = reader.readArrayWithLength();
                BytesReader paymentReader = new BytesReader(paymentBytes);
                payments.add(Amount.of(paymentReader.readLong(), paymentReader.readAssetIdOrWaves()));
                if (paymentReader.hasNext())
                    throw new IllegalArgumentException("The size of " + paymentBytes.length
                            + " bytes is " + (paymentBytes.length - paymentReader.rest())
                            + " greater than expected for the payment with index " + i + " of the parsed InvokeScriptTransaction");
            }
            long fee = reader.readLong();
            AssetId feeAssetId = reader.readAssetIdOrWaves();
            long timestamp = reader.readLong();
            proofs = reader.readProofs();

            transaction = new InvokeScriptTransaction(
                    sender, dApp, functionCall, payments, chainId, Amount.of(fee, feeAssetId), timestamp, version, proofs);
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
                    .writeAssetIdOrWaves(order.amount().assetId())
                    .writeAssetIdOrWaves(order.price().assetId())
                    .writeOrderType(order.type())
                    .writeLong(order.price().value())
                    .writeLong(order.amount().value())
                    .writeLong(order.timestamp())
                    .writeLong(order.expiration())
                    .writeLong(order.fee().value());

            if (order.version() == 3)
                bwStream.writeAssetIdOrWaves(order.fee().assetId());
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
                        .writeLong(ptx.fee().value());
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
                        .writeLong(itx.fee().value())
                        .writeLong(itx.timestamp());
                if (scheme == WITH_PROOFS)
                    bwStream.writeOptionArrayWithLength(itx.compiledScript());
            } else if (tx instanceof TransferTransaction) {
                TransferTransaction ttx = (TransferTransaction) tx;
                bwStream.write(ttx.sender().bytes())
                        .writeAssetIdOrWaves(ttx.amount().assetId())
                        .writeAssetIdOrWaves(ttx.fee().assetId())
                        .writeLong(ttx.timestamp())
                        .writeLong(ttx.amount().value())
                        .writeLong(ttx.fee().value())
                        .writeRecipient(ttx.recipient())
                        .writeArrayWithLength(ttx.attachmentBytes());
            } else if (tx instanceof ReissueTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                ReissueTransaction rtx = (ReissueTransaction) tx;
                bwStream.writePublicKey(rtx.sender())
                        .writeAssetId(rtx.amount().assetId())
                        .writeLong(rtx.amount().value())
                        .writeBoolean(rtx.isReissuable())
                        .writeLong(rtx.fee().value())
                        .writeLong(rtx.timestamp());
            } else if (tx instanceof BurnTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                BurnTransaction btx = (BurnTransaction) tx;
                bwStream.writePublicKey(btx.sender())
                        .writeAssetId(btx.amount().assetId())
                        .writeLong(btx.amount().value())
                        .writeLong(btx.fee().value())
                        .writeLong(btx.timestamp());
            } else if (tx instanceof ExchangeTransaction) {
                ExchangeTransaction etx = (ExchangeTransaction) tx;
                //todo etx.orders.get(0)
                Order order1 = etx.isDirectionBuySell() ? etx.buyOrder() : etx.sellOrder();
                Order order2 = etx.isDirectionBuySell() ? etx.sellOrder() : etx.buyOrder();
                int order1Size = order1.toBytes().length;
                int order2Size = order2.toBytes().length;
                bwStream.writeInt(order1Size);
                if (scheme == WITH_PROOFS) {
                    if (order1.version() == 1)
                        bwStream.write((byte) order1.version());
                    bwStream.write(toBytes(order1))
                            .writeInt(order2Size);
                    if (order2.version() == 1)
                        bwStream.write((byte) order2.version());
                } else
                    bwStream.writeInt(order2Size)
                            .write(toBytes(order1));
                bwStream.write(toBytes(order2))
                        .writeLong(etx.price())
                        .writeLong(etx.amount())
                        .writeLong(etx.buyMatcherFee())
                        .writeLong(etx.sellMatcherFee())
                        .writeLong(etx.fee().value())
                        .writeLong(etx.timestamp());
            } else if (tx instanceof LeaseTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.writeAssetIdOrWaves(AssetId.WAVES);
                LeaseTransaction ltx = (LeaseTransaction) tx;
                bwStream.writePublicKey(ltx.sender())
                        .writeRecipient(ltx.recipient())
                        .writeLong(ltx.amount())
                        .writeLong(ltx.fee().value())
                        .writeLong(ltx.timestamp());
            } else if (tx instanceof LeaseCancelTransaction) {
                if (scheme == WITH_PROOFS)
                    bwStream.write(tx.chainId());
                LeaseCancelTransaction lcTx = (LeaseCancelTransaction) tx;
                bwStream.writePublicKey(lcTx.sender())
                        .writeLong(lcTx.fee().value())
                        .writeLong(lcTx.timestamp())
                        .writeTxId(lcTx.leaseId());
            } else if (tx instanceof CreateAliasTransaction) {
                CreateAliasTransaction caTx = (CreateAliasTransaction) tx;
                bwStream.writePublicKey(caTx.sender())
                        .writeArrayWithLength(new BytesWriter()
                                .writeRecipient(caTx.alias())
                                .getBytes())
                        .writeLong(caTx.fee().value())
                        .writeLong(caTx.timestamp());
            } else if (tx instanceof MassTransferTransaction) {
                MassTransferTransaction mtTx = (MassTransferTransaction) tx;
                bwStream.writePublicKey(mtTx.sender())
                        .writeAssetIdOrWaves(mtTx.assetId())
                        .writeShort((short) mtTx.transfers().size());
                mtTx.transfers().forEach(transfer -> bwStream
                        .writeRecipient(transfer.recipient())
                        .writeLong(transfer.amount()));
                bwStream.writeLong(mtTx.timestamp())
                        .writeLong(mtTx.fee().value())
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
                        .writeLong(dtx.fee().value());
            } else if (tx instanceof SetScriptTransaction) {
                SetScriptTransaction ssTx = (SetScriptTransaction) tx;
                bwStream.write(ssTx.chainId())
                        .writePublicKey(ssTx.sender())
                        .writeOptionArrayWithLength(ssTx.compiledScript())
                        .writeLong(ssTx.fee().value())
                        .writeLong(ssTx.timestamp());
            } else if (tx instanceof SponsorFeeTransaction) {
                SponsorFeeTransaction sfTx = (SponsorFeeTransaction) tx;
                bwStream.writePublicKey(sfTx.sender())
                        .writeAssetId(sfTx.assetId())
                        .writeLong(sfTx.minSponsoredFee())
                        .writeLong(sfTx.fee().value())
                        .writeLong(sfTx.timestamp());
            } else if (tx instanceof SetAssetScriptTransaction) {
                SetAssetScriptTransaction sasTx = (SetAssetScriptTransaction) tx;
                bwStream.write(sasTx.chainId())
                        .writePublicKey(sasTx.sender())
                        .writeAssetId(sasTx.assetId())
                        .writeLong(sasTx.fee().value())
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
                        .writeArrayWithLength(new BytesWriter()
                                .writeLong(payment.value())
                                .writeAssetIdOrWaves(payment.assetId())
                                .getBytes()));
                bwStream.writeLong(isTx.fee().value())
                        .writeAssetIdOrWaves(isTx.fee().assetId())
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
                bwStream.writeProofs(txOrOrder.proofs());
            else
                bwStream.writeSignature(txOrOrder.proofs());
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
                if (tx instanceof GenesisTransaction)
                    bwStream.write(tx.bodyBytes());
                else if (tx instanceof PaymentTransaction) {
                    byte[] bodyWithoutIntType = Bytes.drop(tx.bodyBytes(), 4);
                    bwStream.write((byte) tx.type())
                            .write(bodyWithoutIntType)
                            .writeSignature(tx.proofs());
                } else if (tx instanceof IssueTransaction
                        || tx instanceof TransferTransaction
                        || tx instanceof ReissueTransaction) {
                    bwStream.write((byte) tx.type())
                            .writeSignature(tx.proofs())
                            .write(tx.bodyBytes());
                } else
                    bwStream.write(tx.bodyBytes())
                            .writeSignature(tx.proofs());
            }
        }

        return bwStream.getBytes();
    }

}
