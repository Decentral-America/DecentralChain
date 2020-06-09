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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static im.mak.waves.transactions.serializers.Scheme.*;
import static java.nio.charset.StandardCharsets.UTF_8;

public abstract class LegacyBinarySerializer {

    public static Order orderFromBytes(byte[] bytes, boolean versioned) {
        if (bytes.length < 1)
            throw new IllegalArgumentException("Byte array in too short to parse");
        BytesReader reader = new BytesReader(bytes);

        int version = versioned ? reader.nextByte() : 1;

        Scheme scheme = Scheme.ofOrder(version);
        if (scheme != WITH_PROOFS && scheme != WITH_SIGNATURE)
            throw new IllegalArgumentException("Input is not legacy bytes");

        PublicKey sender = reader.nextPublicKey();
        PublicKey matcher = reader.nextPublicKey();
        Asset amountAsset = reader.nextAssetOrWaves();
        Asset priceAsset = reader.nextAssetOrWaves();
        OrderType type = reader.nextBoolean() ? OrderType.SELL : OrderType.BUY;
        long price = reader.nextLong();
        long amount = reader.nextLong();
        long timestamp = reader.nextLong();
        long expiration = reader.nextLong();
        long fee = reader.nextLong();
        Asset feeAsset = version == 3 ? reader.nextAssetOrWaves() : Asset.WAVES;
        List<Proof> proofs = scheme == WITH_SIGNATURE ? reader.nextSignature() : reader.nextProofs();

        return new Order(sender, type, Amount.of(amount, amountAsset), Amount.of(price, priceAsset), matcher,
                Waves.chainId, fee, feeAsset, timestamp, expiration, version, proofs);
    }

    public static Transaction fromBytes(byte[] bytes) {
        if (bytes.length < 2)
            throw new IllegalArgumentException("Byte array in too short to parse");
        BytesReader reader = new BytesReader(bytes);

        byte maybeVersionFlag = reader.nextByte();
        byte type = maybeVersionFlag == 0 ? reader.nextByte() : maybeVersionFlag;
        if (type == MassTransferTransaction.TYPE && maybeVersionFlag == 0)
            throw new IllegalArgumentException("MassTransferTransaction must not have a version flag in the start byte");
        byte version = maybeVersionFlag == 0 ? reader.nextByte() : 1;

        Scheme scheme = Scheme.of(type, version);
        if (scheme != WITH_PROOFS && scheme != WITH_SIGNATURE)
            throw new IllegalArgumentException("Input is not legacy bytes");

        List<Proof> proofs = Proof.emptyList();
        if (scheme == WITH_SIGNATURE && type >= IssueTransaction.TYPE && type <= ReissueTransaction.TYPE) {
            proofs = reader.nextSignature();

            byte typeInBody = reader.nextByte();
            if (typeInBody != type)
                throw new IllegalArgumentException("Expected transaction type " + type + " but " + typeInBody + " found");
        }

        Transaction transaction;
        if (type == 1) throw new IllegalArgumentException("Genesis transactions are not supported"); //todo
        else if (type == 2) throw new IllegalArgumentException("Payment transactions are not supported"); //todo
        else if (type == IssueTransaction.TYPE) {
            byte chainId = scheme == WITH_PROOFS ? reader.nextByte() : Waves.chainId;
            PublicKey sender = reader.nextPublicKey();
            byte[] name = reader.nextSizedArray();
            byte[] description = reader.nextSizedArray();
            long quantity = reader.nextLong();
            int decimals = reader.nextByte();
            boolean isReissuable = reader.nextBoolean();
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            byte[] script = (scheme == WITH_PROOFS && reader.nextBoolean()) ? reader.nextSizedArray() : null;

            if (scheme == WITH_PROOFS)
                proofs = reader.nextProofs();

            transaction = new IssueTransaction(sender, name, description, quantity, decimals, isReissuable, script,
                    chainId, Amount.of(fee), timestamp, version, proofs);
        }
        else if (type == TransferTransaction.TYPE) {
            PublicKey sender = reader.nextPublicKey();
            Asset asset = reader.nextAssetOrWaves();
            Asset feeAsset = reader.nextAssetOrWaves();
            long timestamp = reader.nextLong();
            long amount = reader.nextLong();
            long fee = reader.nextLong();
            Recipient recipient = reader.nextRecipient();
            byte[] attachment = reader.nextSizedArray();

            if (scheme == WITH_PROOFS)
                proofs = reader.nextProofs();

            transaction = new TransferTransaction(sender, recipient, Amount.of(amount, asset), attachment,
                    recipient.chainId(), fee, feeAsset, timestamp, version, proofs);
        }
        else if (type == ReissueTransaction.TYPE) {
            byte chainId = scheme == WITH_PROOFS ? reader.nextByte() : Waves.chainId;
            PublicKey sender = reader.nextPublicKey();
            Asset asset = reader.nextAsset();
            long amount = reader.nextLong();
            boolean reissuable = reader.nextBoolean();
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            proofs = scheme == WITH_PROOFS ? reader.nextProofs() : reader.nextSignature();

            transaction = new ReissueTransaction(
                    sender, asset, amount, reissuable, chainId, fee, timestamp, version, proofs);
        }
        else if (type == BurnTransaction.TYPE) {
            byte chainId = scheme == WITH_PROOFS ? reader.nextByte() : Waves.chainId;
            PublicKey sender = reader.nextPublicKey();
            Asset asset = reader.nextAsset();
            long amount = reader.nextLong();
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            proofs = scheme == WITH_PROOFS ? reader.nextProofs() : reader.nextSignature();

            transaction = new BurnTransaction(sender, asset, amount, chainId, fee, timestamp, version, proofs);
        }
        else if (type == ExchangeTransaction.TYPE) {
            Order order1, order2;
            int order1Length = reader.nextInt();
            if (scheme == WITH_SIGNATURE) {
                int order2Length = reader.nextInt();
                order1 = orderFromBytes(reader.nextBytes(order1Length), false);
                order2 = orderFromBytes(reader.nextBytes(order2Length), false);
            } else {
                boolean isVersionedOrder1 = !reader.nextBoolean();
                order1 = orderFromBytes(reader.nextBytes(order1Length), isVersionedOrder1);
                int order2Length = reader.nextInt();
                boolean isVersionedOrder2 = !reader.nextBoolean();
                order2 = orderFromBytes(reader.nextBytes(order2Length), isVersionedOrder2);
            }
            long price = reader.nextLong();
            long amount = reader.nextLong();
            long buyMatcherFee = reader.nextLong();
            long sellMatcherFee = reader.nextLong();
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            proofs = scheme == WITH_PROOFS ? reader.nextProofs() : reader.nextSignature();

            transaction = new ExchangeTransaction(order1.sender(), order1, order2, amount, price,
                    buyMatcherFee, sellMatcherFee, Waves.chainId, fee, timestamp, version, proofs);
        }
        else if (type == LeaseTransaction.TYPE) {
            if (scheme == WITH_PROOFS && !reader.nextAssetOrWaves().isWaves())
                throw new IllegalArgumentException("Only Waves allowed to lease");

            PublicKey sender = reader.nextPublicKey();
            Recipient recipient = reader.nextRecipient();
            long amount = reader.nextLong();
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            proofs = scheme == WITH_PROOFS ? reader.nextProofs() : reader.nextSignature();

            transaction = new LeaseTransaction(
                    sender, recipient, amount, recipient.chainId(), fee, timestamp, version, proofs);
        }
        else if (type == LeaseCancelTransaction.TYPE) {
            byte chainId = scheme == WITH_PROOFS ? reader.nextByte() : Waves.chainId;
            PublicKey sender = reader.nextPublicKey();
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            TxId leaseId = reader.nextTxId();
            proofs = scheme == WITH_PROOFS ? reader.nextProofs() : reader.nextSignature();

            transaction = new LeaseCancelTransaction(sender, leaseId, chainId, fee, timestamp, version, proofs);
        }
        else if (type == CreateAliasTransaction.TYPE) {
            PublicKey sender = reader.nextPublicKey();
            String alias = new String(reader.nextSizedArray(), UTF_8);
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            proofs = scheme == WITH_PROOFS ? reader.nextProofs() : reader.nextSignature();

            transaction = new CreateAliasTransaction(sender, alias, Waves.chainId, fee, timestamp, version, proofs);
        }
        else if (type == MassTransferTransaction.TYPE) {
            PublicKey sender = reader.nextPublicKey();
            Asset asset = reader.nextAssetOrWaves();
            short transfersCount = reader.nextShort();
            List<Transfer> transfers = new ArrayList<>();
            for (int i = 0; i < transfersCount; i++)
                transfers.add(Transfer.to(reader.nextRecipient(), reader.nextLong()));
            long timestamp = reader.nextLong();
            long fee = reader.nextLong();
            byte[] attachment = reader.nextSizedArray();
            proofs = reader.nextProofs();

            byte chainId = transfersCount > 0 ? transfers.get(0).recipient().chainId() : Waves.chainId;

            transaction = new MassTransferTransaction(
                    sender, transfers, asset, attachment, chainId, fee, timestamp, version, proofs);
        }
        else if (type == DataTransaction.TYPE) {
            PublicKey sender = reader.nextPublicKey();
            short entriesCount = reader.nextShort();
            List<DataEntry> entries = new ArrayList<>();
            for (int i = 0; i < entriesCount; i++) {
                String key = new String(reader.nextBytes(reader.nextShort()), UTF_8); //todo can be non utf8 bytes?
                byte entryType = reader.nextByte();
                if (entryType == 0) entries.add(new IntegerEntry(key, reader.nextLong()));
                else if (entryType == 1) entries.add(new BooleanEntry(key, reader.nextBoolean()));
                else if (entryType == 2) entries.add(new BinaryEntry(key, reader.nextSizedArray()));
                else if (entryType == 3) entries.add(new StringEntry(key, new String(reader.nextSizedArray(), UTF_8)));
                else throw new IllegalArgumentException("Unknown type code " + entryType + " of the item with index " + i);
            }
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            proofs = reader.nextProofs();

            transaction = new DataTransaction(sender, entries, Waves.chainId, fee, timestamp, version, proofs);
        }
        else if (type == SetScriptTransaction.TYPE) {
            byte chainId = reader.nextByte();
            PublicKey sender = reader.nextPublicKey();
            byte[] script = reader.nextBoolean() ? reader.nextSizedArray() : null;
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            proofs = reader.nextProofs();

            transaction = new SetScriptTransaction(sender, script, chainId, fee, timestamp, version, proofs);
        }
        else if (type == SponsorFeeTransaction.TYPE) {
            byte chainId = reader.nextByte();
            PublicKey sender = reader.nextPublicKey();
            Asset asset = reader.nextAsset();
            long minSponsoredFee = reader.nextLong();
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            proofs = reader.nextProofs();

            transaction = new SponsorFeeTransaction(
                    sender, asset, minSponsoredFee, chainId, fee, timestamp, version, proofs);
        }
        else if (type == SetAssetScriptTransaction.TYPE) {
            byte chainId = reader.nextByte();
            PublicKey sender = reader.nextPublicKey();
            Asset asset = reader.nextAsset();
            byte[] script = reader.nextBoolean() ? reader.nextSizedArray() : null;
            long fee = reader.nextLong();
            long timestamp = reader.nextLong();
            proofs = reader.nextProofs();

            transaction = new SetAssetScriptTransaction(
                    sender, asset, script, chainId, fee, timestamp, version, proofs);
        }
        else if (type == InvokeScriptTransaction.TYPE) {
            byte chainId = reader.nextByte();
            PublicKey sender = reader.nextPublicKey();
            Recipient dApp = reader.nextRecipient();
            Function functionCall = reader.nextFunctionCall();
            short paymentsCount = reader.nextShort();
            List<Amount> payments = new ArrayList<>();
            for (int i = 0; i < paymentsCount; i++)
                payments.add(Amount.of(reader.nextLong(), reader.nextAssetOrWaves()));
            long fee = reader.nextLong();
            Asset feeAsset = reader.nextAssetOrWaves();
            long timestamp = reader.nextLong();
            proofs = reader.nextProofs();

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
        byte[] result = Bytes.empty();
        try (ByteArrayOutputStream stream = new ByteArrayOutputStream()) {
            if (txOrOrder instanceof Order) {
                Order order = (Order) txOrOrder;
                if (order.version() > 3)
                    throw new IllegalArgumentException("not a legacy");

                if (order.version() > 1)
                    stream.write(Bytes.of((byte) order.version()));
                stream.write(order.sender().bytes());
                stream.write(order.matcher().bytes());
                stream.write(Bytes.fromBoolean(!order.amount().asset().isWaves()));
                if (!order.amount().asset().isWaves())
                    stream.write(order.amount().asset().bytes());
                stream.write(Bytes.fromBoolean(!order.price().asset().isWaves()));
                if (!order.price().asset().isWaves())
                    stream.write(order.price().asset().bytes());
                if (order.type() == OrderType.BUY)
                    stream.write(Bytes.of((byte) 0));
                else if (order.type() == OrderType.SELL)
                    stream.write(Bytes.of((byte) 1));
                else throw new IOException("Unknown order type (not BUY or SELL)");
                stream.write(Bytes.fromLong(order.price().value()));
                stream.write(Bytes.fromLong(order.amount().value()));
                stream.write(Bytes.fromLong(order.timestamp()));
                stream.write(Bytes.fromLong(order.expiration()));
                stream.write(Bytes.fromLong(order.fee()));
                if (order.version() == 3) {
                    stream.write(Bytes.fromBoolean(!order.feeAsset().isWaves()));
                    if (!order.feeAsset().isWaves())
                        stream.write(order.feeAsset().bytes());
                }
            } else {
                Transaction tx = (Transaction) txOrOrder;
                if (tx instanceof IssueTransaction) {
                    IssueTransaction itx = (IssueTransaction) tx;
                    if (itx.version() > 2)
                        throw new IllegalArgumentException("not a legacy");

                    stream.write(Bytes.of((byte) itx.type()));
                    if (itx.version() == 2)
                        stream.write(Bytes.of((byte) itx.version(), itx.chainId()));
                    stream.write(itx.sender().bytes());
                    stream.write(Bytes.toSizedByteArray(itx.nameBytes()));
                    stream.write(Bytes.toSizedByteArray(itx.descriptionBytes()));
                    stream.write(Bytes.fromLong(itx.quantity()));
                    stream.write(Bytes.of((byte) itx.decimals()));
                    stream.write(Bytes.fromBoolean(itx.isReissuable()));
                    stream.write(Bytes.fromLong(itx.fee()));
                    stream.write(Bytes.fromLong(itx.timestamp()));
                    if (itx.version() == 2) {
                        //todo new BytesWriter().writeOptionalSizedArray(itx.compiledScript())
                        if (itx.compiledScript().length > 0) {
                            stream.write(Bytes.of(Bytes.fromBoolean(true)));
                            stream.write(Bytes.toSizedByteArray(itx.compiledScript()));
                        } else
                            stream.write(Bytes.of(Bytes.fromBoolean(false)));
                    }
                } else if (tx instanceof TransferTransaction) {
                    TransferTransaction ttx = (TransferTransaction) tx;
                    if (ttx.version() > 2)
                        throw new IllegalArgumentException("not a legacy");

                    stream.write(Bytes.of((byte) ttx.type()));
                    if (ttx.version() == 2)
                        stream.write(Bytes.of((byte) ttx.version()));

                    stream.write(ttx.sender().bytes());
                    //fixme new BytesWriter().writeAssetOrWaves(ttx.amount().asset())
                    if (ttx.amount().asset().isWaves()) {
                        stream.write(Bytes.of((byte) 0));
                    } else {
                        stream.write(Bytes.of((byte) 1));
                        stream.write(ttx.amount().asset().bytes());
                    }
                    if (ttx.feeAsset().isWaves()) {
                        stream.write(Bytes.of((byte) 0));
                    } else {
                        stream.write(Bytes.of((byte) 1));
                        stream.write(ttx.feeAsset().bytes());
                    }
                    stream.write(Bytes.fromLong(ttx.timestamp()));
                    stream.write(Bytes.fromLong(ttx.amount().value()));
                    stream.write(Bytes.fromLong(ttx.fee()));
                    stream.write(recipientToBytes(ttx.recipient()));
                    stream.write(Bytes.toSizedByteArray(ttx.attachmentBytes()));
                } else if (tx instanceof ReissueTransaction) {
                    ReissueTransaction rtx = (ReissueTransaction) tx;
                    if (rtx.version() > 2)
                        throw new IllegalArgumentException("not a legacy");

                    stream.write(Bytes.of((byte) rtx.type()));
                    if (rtx.version() == 2)
                        stream.write(Bytes.of((byte) rtx.version(), rtx.chainId()));

                    stream.write(rtx.sender().bytes());
                    stream.write(rtx.asset().bytes());
                    stream.write(Bytes.fromLong(rtx.amount()));
                    stream.write(Bytes.fromBoolean(rtx.isReissuable()));
                    stream.write(Bytes.fromLong(rtx.fee()));
                    stream.write(Bytes.fromLong(rtx.timestamp()));
                } else if (tx instanceof BurnTransaction) {
                    BurnTransaction btx = (BurnTransaction) tx;
                    if (btx.version() > 2)
                        throw new IllegalArgumentException("not a legacy");

                    stream.write(Bytes.of((byte) btx.type()));
                    if (btx.version() == 2)
                        stream.write(Bytes.of((byte) btx.version(), btx.chainId()));

                    stream.write(btx.sender().bytes());
                    stream.write(btx.asset().bytes());
                    stream.write(Bytes.fromLong(btx.amount()));
                    stream.write(Bytes.fromLong(btx.fee()));
                    stream.write(Bytes.fromLong(btx.timestamp()));
                } else if (tx instanceof ExchangeTransaction) {
                    ExchangeTransaction etx = (ExchangeTransaction) tx;
                    if (etx.version() > 2)
                        throw new IllegalArgumentException("not a legacy");

                    boolean withProofs = etx.version() == 2;

                    stream.write(Bytes.of((byte) etx.type()));
                    if (withProofs)
                        stream.write(Bytes.of((byte) etx.version()));

                    Order order1 = etx.isDirectionBuySell() ? etx.buyOrder() : etx.sellOrder();
                    Order order2 = etx.isDirectionBuySell() ? etx.sellOrder() : etx.buyOrder();
                    int order1Size = order1.toBytes().length;
                    int order2Size = order2.toBytes().length;
                    stream.write(Bytes.fromInt(order1Size));
                    if (etx.version() == 1) {
                        stream.write(Bytes.fromInt(order2Size));
                        stream.write(bytes(order1));
                    } else {
                        stream.write(Bytes.of(Bytes.fromBoolean(order1.version() == 1)));
                        stream.write(bytes(order1));
                        stream.write(Bytes.fromInt(order2Size));
                        stream.write(Bytes.of(Bytes.fromBoolean(order2.version() == 1)));
                    }
                    stream.write(bytes(order2));
                    stream.write(Bytes.fromLong(etx.price()));
                    stream.write(Bytes.fromLong(etx.amount()));
                    stream.write(Bytes.fromLong(etx.buyMatcherFee()));
                    stream.write(Bytes.fromLong(etx.sellMatcherFee()));
                    stream.write(Bytes.fromLong(etx.fee()));
                    stream.write(Bytes.fromLong(etx.timestamp()));
                } else if (tx instanceof LeaseTransaction) {
                    LeaseTransaction ltx = (LeaseTransaction) tx;
                    if (ltx.version() > 2)
                        throw new IllegalArgumentException("not a legacy");

                    boolean withProofs = ltx.version() == 2;

                    stream.write(Bytes.of((byte) ltx.type()));
                    if (withProofs)
                        stream.write(Bytes.of((byte) ltx.version(), (byte) 0));

                    stream.write(ltx.sender().bytes());
                    stream.write(recipientToBytes(ltx.recipient()));
                    stream.write(Bytes.fromLong(ltx.amount()));
                    stream.write(Bytes.fromLong(ltx.fee()));
                    stream.write(Bytes.fromLong(ltx.timestamp()));
                } else if (tx instanceof LeaseCancelTransaction) {
                    LeaseCancelTransaction lcTx = (LeaseCancelTransaction) tx;
                    if (lcTx.version() > 2)
                        throw new IllegalArgumentException("not a legacy");

                    boolean withProofs = lcTx.version() == 2;

                    stream.write(Bytes.of((byte) lcTx.type()));
                    if (withProofs)
                        stream.write(Bytes.of((byte) lcTx.version(), lcTx.chainId()));

                    stream.write(lcTx.sender().bytes());
                    stream.write(Bytes.fromLong(lcTx.fee()));
                    stream.write(Bytes.fromLong(lcTx.timestamp()));
                    stream.write(lcTx.leaseId().bytes());
                } else if (tx instanceof CreateAliasTransaction) {
                    CreateAliasTransaction caTx = (CreateAliasTransaction) tx;
                    if (caTx.version() > 2)
                        throw new IllegalArgumentException("not a legacy");

                    boolean withProofs = caTx.version() == 2;

                    stream.write(Bytes.of((byte) caTx.type()));
                    if (withProofs)
                        stream.write(Bytes.of((byte) caTx.version()));

                    stream.write(caTx.sender().bytes());
                    stream.write(Bytes.toSizedByteArray(caTx.alias().getBytes(UTF_8)));
                    stream.write(Bytes.fromLong(caTx.fee()));
                    stream.write(Bytes.fromLong(caTx.timestamp()));
                } else if (tx instanceof MassTransferTransaction) {
                    MassTransferTransaction mtTx = (MassTransferTransaction) tx;
                    if (mtTx.version() > 1)
                        throw new IllegalArgumentException("not a legacy");

                    stream.write(Bytes.of((byte) mtTx.type()));
                    stream.write(Bytes.of((byte) mtTx.version()));

                    stream.write(mtTx.sender().bytes());
                    if (mtTx.asset().isWaves()) {
                        stream.write(Bytes.of((byte) 0));
                    } else {
                        stream.write(Bytes.of((byte) 1));
                        stream.write(mtTx.asset().bytes());
                    }
                    stream.write(Bytes.fromShort((short) mtTx.transfers().size()));
                    stream.write(Bytes.fromLong(mtTx.total()));
                    for (Transfer transfer : mtTx.transfers()) {
                        stream.write(recipientToBytes(transfer.recipient()));
                        stream.write(Bytes.fromLong(transfer.amount()));
                    }
                    stream.write(Bytes.fromLong(mtTx.timestamp()));
                    stream.write(Bytes.fromLong(mtTx.fee()));
                    stream.write(Bytes.toSizedByteArray(mtTx.attachment().getBytes(UTF_8)));
                } else if (tx instanceof DataTransaction) {
                    DataTransaction dtx = (DataTransaction) tx;
                    if (dtx.version() > 1)
                        throw new IllegalArgumentException("not a legacy");

                    stream.write(Bytes.of((byte) dtx.type()));
                    stream.write(Bytes.of((byte) dtx.version()));

                    stream.write(dtx.sender().bytes());
                    stream.write(Bytes.fromShort((short) dtx.data().size()));
                    for (DataEntry e : dtx.data()) {
                        stream.write(Bytes.toSizedByteArray(e.key().getBytes(UTF_8)));
                        if (e.type() == EntryType.INTEGER) {
                            stream.write(Bytes.of((byte) 0));
                            stream.write(Bytes.fromLong(((IntegerEntry) e).value()));
                        } else if (e.type() == EntryType.BOOLEAN) {
                            stream.write(Bytes.of((byte) 1));
                            stream.write(Bytes.fromBoolean(((BooleanEntry) e).value()));
                        } else if (e.type() == EntryType.BINARY) {
                            stream.write(Bytes.of((byte) 2));
                            stream.write(Bytes.toSizedByteArray(((BinaryEntry) e).value()));
                        } else if (e.type() == EntryType.STRING) {
                            stream.write(Bytes.of((byte) 3));
                            stream.write(Bytes.toSizedByteArray(((StringEntry) e).value().getBytes(UTF_8)));
                        }
                    }
                    stream.write(Bytes.fromLong(dtx.fee()));
                    stream.write(Bytes.fromLong(dtx.timestamp()));
                } else if (tx instanceof SetScriptTransaction) {
                    SetScriptTransaction ssTx = (SetScriptTransaction) tx;
                    if (ssTx.version() > 1)
                        throw new IllegalArgumentException("not a legacy");

                    stream.write(Bytes.of((byte) ssTx.type()));
                    stream.write(Bytes.of((byte) ssTx.version()));
                    stream.write(Bytes.of(ssTx.chainId()));

                    stream.write(ssTx.sender().bytes());
                    //todo new BytesWriter().writeOptionalSizedArray(itx.compiledScript())
                    if (ssTx.compiledScript().length > 0) {
                        stream.write(Bytes.of(Bytes.fromBoolean(true)));
                        stream.write(Bytes.toSizedByteArray(ssTx.compiledScript()));
                    } else stream.write(Bytes.of(Bytes.fromBoolean(false)));
                    stream.write(Bytes.fromLong(ssTx.fee()));
                    stream.write(Bytes.fromLong(ssTx.timestamp()));
                } else if (tx instanceof SponsorFeeTransaction) {
                    SponsorFeeTransaction sfTx = (SponsorFeeTransaction) tx;
                    if (sfTx.version() > 1)
                        throw new IllegalArgumentException("not a legacy");

                    stream.write(Bytes.of((byte) sfTx.type()));
                    stream.write(Bytes.of((byte) sfTx.version()));
                    stream.write(Bytes.of(sfTx.chainId()));

                    stream.write(sfTx.sender().bytes());
                    stream.write(sfTx.asset().bytes());
                    stream.write(Bytes.fromLong(sfTx.minSponsoredFee()));
                    stream.write(Bytes.fromLong(sfTx.fee()));
                    stream.write(Bytes.fromLong(sfTx.timestamp()));
                } else if (tx instanceof SetAssetScriptTransaction) {
                    SetAssetScriptTransaction sasTx = (SetAssetScriptTransaction) tx;
                    if (sasTx.version() > 1)
                        throw new IllegalArgumentException("not a legacy");

                    stream.write(Bytes.of((byte) sasTx.type()));
                    stream.write(Bytes.of((byte) sasTx.version()));
                    stream.write(Bytes.of(sasTx.chainId()));

                    stream.write(sasTx.sender().bytes());
                    stream.write(sasTx.asset().bytes());
                    if (sasTx.compiledScript().length > 0) {
                        stream.write(Bytes.of((byte) 1));
                        stream.write(Bytes.toSizedByteArray(sasTx.compiledScript()));
                    } else stream.write(Bytes.of((byte) 0));
                    stream.write(Bytes.fromLong(sasTx.fee()));
                    stream.write(Bytes.fromLong(sasTx.timestamp()));
                } else if (tx instanceof InvokeScriptTransaction) {
                    InvokeScriptTransaction isTx = (InvokeScriptTransaction) tx;
                    if (isTx.version() > 1)
                        throw new IllegalArgumentException("not a legacy");

                    stream.write(Bytes.of((byte) isTx.type()));
                    stream.write(Bytes.of((byte) isTx.version()));
                    stream.write(Bytes.of(isTx.chainId()));

                    stream.write(isTx.sender().bytes());
                    stream.write(recipientToBytes(isTx.dApp()));
                    stream.write(functionCallToBytes(isTx.function()));

                    stream.write(Bytes.fromLong(isTx.payments().size()));
                    for (Amount payment : isTx.payments()) {
                        stream.write(Bytes.fromLong(payment.value()));
                        stream.write(Bytes.fromBoolean(!payment.asset().isWaves()));
                        if (!payment.asset().isWaves())
                            stream.write(payment.asset().bytes());
                    }

                    stream.write(Bytes.fromLong(isTx.fee()));
                    stream.write(Bytes.fromBoolean(!isTx.feeAsset().isWaves()));
                    if (!isTx.feeAsset().isWaves())
                        stream.write(isTx.feeAsset().bytes());
                    stream.write(Bytes.fromLong(isTx.timestamp()));
                }
            }

            result = stream.toByteArray();
        } catch (IOException e) {
            e.printStackTrace(); //todo
        }

        return result;
    }

    public static byte[] bytes(TransactionOrOrder txOrOrder) {
        try (ByteArrayOutputStream stream = new ByteArrayOutputStream()) {
            if (txOrOrder instanceof Order) {
                Order order = (Order) txOrOrder;
                stream.write(order.bodyBytes());
                stream.write(proofsToBytes(order.proofs(), order.version() > 1));
            } else {
                Transaction tx = (Transaction) txOrOrder;
                if (tx instanceof IssueTransaction) {
                    IssueTransaction itx = (IssueTransaction) tx;
                    if (itx.version() == 1) {
                        stream.write(Bytes.of((byte) itx.type()));
                        stream.write(proofsToBytes(itx.proofs(), false));
                        stream.write(itx.bodyBytes());
                    } else {
                        stream.write(Bytes.of((byte) 0));
                        stream.write(itx.bodyBytes());
                        stream.write(proofsToBytes(itx.proofs(), true));
                    }
                } else if (tx instanceof TransferTransaction) {
                    TransferTransaction ttx = (TransferTransaction) tx;
                    if (ttx.version() == 1) {
                        stream.write(Bytes.of((byte) ttx.type()));
                        stream.write(proofsToBytes(ttx.proofs(), false));
                        stream.write(ttx.bodyBytes());
                    } else {
                        stream.write(Bytes.of((byte) 0));
                        stream.write(ttx.bodyBytes());
                        stream.write(proofsToBytes(ttx.proofs(), true));
                    }
                } else if (tx instanceof ReissueTransaction) {
                    ReissueTransaction rtx = (ReissueTransaction) tx;
                    if (rtx.version() == 1) {
                        stream.write(Bytes.of((byte) rtx.type()));
                        stream.write(proofsToBytes(rtx.proofs(), false));
                        stream.write(rtx.bodyBytes());
                    } else {
                        stream.write(Bytes.of((byte) 0));
                        stream.write(rtx.bodyBytes());
                        stream.write(proofsToBytes(rtx.proofs(), true));
                    }
                } else if (tx instanceof BurnTransaction) {
                    BurnTransaction btx = (BurnTransaction) tx;
                    boolean withProofs = btx.version() == 2;
                    if (withProofs)
                        stream.write(Bytes.of((byte) 0));
                    stream.write(btx.bodyBytes());
                    stream.write(proofsToBytes(btx.proofs(), withProofs));
                } else if (tx instanceof ExchangeTransaction) {
                    ExchangeTransaction ex = (ExchangeTransaction) tx;
                    boolean withProofs = ex.version() == 2;
                    if (withProofs)
                        stream.write(Bytes.of((byte) 0));
                    stream.write(ex.bodyBytes());
                    stream.write(proofsToBytes(ex.proofs(), withProofs));
                } else if (tx instanceof LeaseTransaction) {
                    LeaseTransaction ltx = (LeaseTransaction) tx;
                    boolean withProofs = ltx.version() == 2;
                    if (withProofs)
                        stream.write(Bytes.of((byte) 0));
                    stream.write(ltx.bodyBytes());
                    stream.write(proofsToBytes(ltx.proofs(), withProofs));
                } else if (tx instanceof LeaseCancelTransaction) {
                    LeaseCancelTransaction lcTx = (LeaseCancelTransaction) tx;
                    boolean withProofs = lcTx.version() == 2;
                    if (withProofs)
                        stream.write(Bytes.of((byte) 0));
                    stream.write(lcTx.bodyBytes());
                    stream.write(proofsToBytes(lcTx.proofs(), withProofs));
                } else if (tx instanceof CreateAliasTransaction) {
                    CreateAliasTransaction caTx = (CreateAliasTransaction) tx;
                    boolean withProofs = caTx.version() == 2;
                    if (withProofs)
                        stream.write(Bytes.of((byte) 0));
                    stream.write(caTx.bodyBytes());
                    stream.write(proofsToBytes(caTx.proofs(), withProofs));
                } else if (tx instanceof MassTransferTransaction) {
                    MassTransferTransaction mtTx = (MassTransferTransaction) tx;
                    stream.write(Bytes.of((byte) 0));
                    stream.write(mtTx.bodyBytes());
                    stream.write(proofsToBytes(mtTx.proofs(), true));
                } else if (tx instanceof DataTransaction) {
                    DataTransaction dtx = (DataTransaction) tx;
                    stream.write(Bytes.of((byte) 0));
                    stream.write(dtx.bodyBytes());
                    stream.write(proofsToBytes(dtx.proofs(), true));
                } else if (tx instanceof SetScriptTransaction) {
                    SetScriptTransaction caTx = (SetScriptTransaction) tx;
                    stream.write(Bytes.of((byte) 0));
                    stream.write(caTx.bodyBytes());
                    stream.write(proofsToBytes(caTx.proofs(), true));
                } else if (tx instanceof SponsorFeeTransaction) {
                    SponsorFeeTransaction sfTx = (SponsorFeeTransaction) tx;
                    stream.write(Bytes.of((byte) 0));
                    stream.write(sfTx.bodyBytes());
                    stream.write(proofsToBytes(sfTx.proofs(), true));
                } else if (tx instanceof SetAssetScriptTransaction) {
                    SetAssetScriptTransaction sasTx = (SetAssetScriptTransaction) tx;
                    stream.write(Bytes.of((byte) 0));
                    stream.write(sasTx.bodyBytes());
                    stream.write(proofsToBytes(sasTx.proofs(), true));
                } else if (tx instanceof InvokeScriptTransaction) {
                    InvokeScriptTransaction isTx = (InvokeScriptTransaction) tx;
                    stream.write(Bytes.of((byte) 0));
                    stream.write(isTx.bodyBytes());
                    stream.write(proofsToBytes(isTx.proofs(), true));
                }
            }

            return stream.toByteArray();
        } catch (IOException e) {
            e.printStackTrace(); //todo
        }
        return null; //todo exception
    }

    protected static byte[] recipientToBytes(Recipient recipient) {
        if (recipient.isAlias())
            return Bytes.concat(
                    Bytes.of((byte) 2, recipient.chainId()),
                    Bytes.toSizedByteArray(recipient.alias().value().getBytes()));
        else
            return recipient.address().bytes();
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

    protected static byte[] functionCallToBytes(Function functionCall) {
        try (ByteArrayOutputStream stream = new ByteArrayOutputStream()) {
            stream.write(Bytes.of((byte)(functionCall.isDefault() ? 0 : 1)));
            stream.write(Bytes.of((byte) 9, (byte) 1));
            stream.write(Bytes.toSizedByteArray(functionCall.name().getBytes(UTF_8)));
            stream.write(Bytes.fromInt(functionCall.args().size()));
            for (Arg arg : functionCall.args()) {
                if (arg.type() == ArgType.INTEGER) {
                    stream.write(Bytes.of((byte) 0));
                    stream.write(Bytes.fromLong(((IntegerArg)arg).value()));
                } else if (arg.type() == ArgType.BINARY) {
                    stream.write(Bytes.of((byte) 1));
                    stream.write(Bytes.toSizedByteArray(((BinaryArg)arg).value()));
                } else if (arg.type() == ArgType.STRING) {
                    stream.write(Bytes.of((byte) 2));
                    stream.write(Bytes.toSizedByteArray(((StringArg)arg).value().getBytes(UTF_8)));
                } else if (arg.type() == ArgType.BOOLEAN) {
                    if (((BooleanArg)arg).value())
                        stream.write(Bytes.of((byte) 6));
                    else stream.write(Bytes.of((byte) 7));
                } /*else if (arg.type() == ArgType.LIST) {} //todo*/
            }
            return stream.toByteArray();
        } catch (IOException ioe) {
            ioe.printStackTrace(); //todo
        }
        return null; //todo throw ne IOException
    }

}
