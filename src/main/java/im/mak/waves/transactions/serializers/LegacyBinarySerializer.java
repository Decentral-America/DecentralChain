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

import static java.nio.charset.StandardCharsets.UTF_8;

public abstract class LegacyBinarySerializer {

    public static Order orderFromBytes(byte[] bytes, boolean versioned) throws IOException {
        if (bytes.length < 1) //todo or more?
            throw new IOException("Byte array in too short to parse as an order");

        BytesReader data = new BytesReader(bytes);
        int version = versioned ? data.read() : 1;
        if (versioned && version > 3)
            throw new IOException("not a legacy");

        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        PublicKey matcher = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        Asset amountAsset = data.readBoolean() ? Asset.id(data.read(Asset.BYTE_LENGTH)) : Asset.WAVES;
        Asset priceAsset = data.readBoolean() ? Asset.id(data.read(Asset.BYTE_LENGTH)) : Asset.WAVES;
        OrderType type = data.readBoolean() ? OrderType.SELL : OrderType.BUY;
        long price = data.readLong();
        long amount = data.readLong();
        long timestamp = data.readLong();
        long expiration = data.readLong();
        long fee = data.readLong();
        Asset feeAsset = version == 3 && data.readBoolean() ? Asset.id(data.read(Asset.BYTE_LENGTH)) : Asset.WAVES;
        List<Proof> proofs;
        if (version == 1)
            proofs = data.readSignature();
        else
            proofs = data.readProofs();

        return new Order(sender, type, Amount.of(amount, amountAsset), Amount.of(price, priceAsset), matcher,
                Waves.chainId, fee, feeAsset, timestamp, expiration, version, proofs);
    }

    public static Transaction fromBytes(byte[] bytes) throws IOException {
        if (bytes.length < 4) //todo or more?
            throw new IOException("Byte array in too short to parse as a transaction");
        boolean withProofs = bytes[0] == 0;
        int index = withProofs ? 1 : 0;

        int type = bytes[index];
        int version = withProofs ? bytes[index + 1] : 1; //todo what if not a legacy?
        byte[] data = Bytes.chunk(bytes, withProofs ? 3 : 1)[1];

        Transaction transaction;
        List<Proof> proofs = Proof.emptyList();
        BytesReader reader = new BytesReader(data);

        if (type == 1) throw new IOException("Genesis transactions are not supported"); //todo
        else if (type == 2) throw new IOException("Payment transactions are not supported"); //todo
        else if (type == IssueTransaction.TYPE) transaction = issue(reader, version);
        else if (type == TransferTransaction.TYPE) {
            if (version == 1) {
                proofs = reader.readSignature();
                byte typeInBody = reader.read();
                if (typeInBody != type)
                    throw new IOException("Expected transaction type " + type + " but " + typeInBody + " found");
            }
            transaction = transfer(reader, version);
            if (version == 2)
                proofs = reader.readProofs();
            transaction.proofs().addAll(proofs);
        }
        else if (type == ReissueTransaction.TYPE) transaction = reissue(reader, version, withProofs);
        else if (type == BurnTransaction.TYPE) transaction = burn(reader, version, withProofs);
        else if (type == ExchangeTransaction.TYPE) transaction = exchange(reader, version, withProofs);
        else if (type == LeaseTransaction.TYPE) transaction = lease(reader, version, withProofs);
        else if (type == LeaseCancelTransaction.TYPE) transaction = leaseCancel(reader, version, withProofs);
        else if (type == CreateAliasTransaction.TYPE) transaction = createAlias(reader, version, withProofs);
        else if (type == MassTransferTransaction.TYPE) transaction = massTransfer(reader, version, withProofs);
        else if (type == DataTransaction.TYPE) transaction = data(reader, version, withProofs);
        else if (type == SetScriptTransaction.TYPE) transaction = setScript(reader, version, withProofs);
        else if (type == SponsorFeeTransaction.TYPE) transaction = sponsorFee(reader, version, withProofs);
        else if (type == SetAssetScriptTransaction.TYPE) transaction = setAssetScript(reader, version, withProofs);
        else if (type == InvokeScriptTransaction.TYPE) transaction = invokeScript(reader, version, withProofs);
        else throw new IOException("Unknown transaction type " + type);

        if (reader.hasNext())
            throw new IOException("The size of " + bytes.length
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

                    boolean withProofs = rtx.version() == 2;

                    stream.write(Bytes.of((byte) rtx.type()));
                    if (withProofs)
                        stream.write(Bytes.of((byte) rtx.version(), (byte) 0));

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

                    boolean withProofs = btx.version() == 2;

                    stream.write(Bytes.of((byte) btx.type()));
                    if (withProofs)
                        stream.write(Bytes.of((byte) btx.version(), (byte) 0));

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
                    boolean withProofs = rtx.version() == 2;
                    if (withProofs)
                        stream.write(Bytes.of((byte) 0));
                    stream.write(rtx.bodyBytes());
                    stream.write(proofsToBytes(rtx.proofs(), withProofs));
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

    protected static IssueTransaction issue(BytesReader data, int version) throws IOException {
        List<Proof> proofs = Proof.emptyList();
        if (version == 1) {
            proofs = data.readSignature();

            byte typeInBody = data.read();
            if (typeInBody != IssueTransaction.TYPE)
                throw new IOException("Expected transaction type " + IssueTransaction.TYPE + " but " + typeInBody + " found");
        }
        byte chainId = version == 2 ? data.read() : Waves.chainId;
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        byte[] name = data.readSizedArray();
        byte[] description = data.readSizedArray();
        long quantity = data.readLong();
        int decimals = data.read();
        boolean isReissuable = data.readBoolean();
        long fee = data.readLong();
        long timestamp = data.readLong();
        byte[] script = (version == 2 && data.read() == 1) ? data.readSizedArray() : null;

        if (version == 2)
            proofs = data.readProofs();

        return new IssueTransaction(sender, name, description, quantity, decimals, isReissuable, script, chainId, Amount.of(fee),
                timestamp, version, proofs);
    }

    protected static TransferTransaction transfer(BytesReader data, int version) throws IOException {
        PublicKey sender = data.readPublicKey();
        Asset asset = data.readAssetOrWaves();
        Asset feeAsset = data.readAssetOrWaves();
        long timestamp = data.readLong();
        long amount = data.readLong();
        long fee = data.readLong();
        Recipient recipient = data.readRecipient();
        byte[] attachment = data.readSizedArray();

        return new TransferTransaction(sender, recipient, Amount.of(amount, asset), attachment, recipient.chainId(),
                fee, feeAsset, timestamp, version);
    }

    protected static ReissueTransaction reissue(BytesReader data, int version, boolean withProofs) throws IOException {
        byte chainId = version == 2 ? data.read() : Waves.chainId;
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        Asset asset = Asset.id(data.read(TxId.BYTE_LENGTH));
        long amount = data.readLong();
        boolean reissuable = data.readBoolean();
        long fee = data.readLong();
        long timestamp = data.readLong();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new ReissueTransaction(sender, asset, amount, reissuable, chainId, fee, timestamp, version, proofs);
    }

    protected static BurnTransaction burn(BytesReader data, int version, boolean withProofs) throws IOException {
        byte chainId = version == 2 ? data.read() : Waves.chainId;
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        Asset asset = Asset.id(data.read(TxId.BYTE_LENGTH));
        long amount = data.readLong();
        long fee = data.readLong();
        long timestamp = data.readLong();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new BurnTransaction(sender, asset, amount, chainId, fee, timestamp, version, proofs);
    }

    protected static ExchangeTransaction exchange(BytesReader data, int version, boolean withProofs) throws IOException {
        Order order1, order2;
        int order1Size = data.readInt();
        if (version == 1) {
            int order2Size = data.readInt();
            order1 = orderFromBytes(data.read(order1Size), false);
            order2 = orderFromBytes(data.read(order2Size), false);
        } else {
            boolean isVersionedOrder1 = !data.readBoolean();
            order1 = orderFromBytes(data.read(order1Size), isVersionedOrder1);
            int order2Size = data.readInt();
            boolean isVersionedOrder2 = !data.readBoolean();
            order2 = orderFromBytes(data.read(order2Size), isVersionedOrder2);
        }
        long price = data.readLong();
        long amount = data.readLong();
        long buyMatcherFee = data.readLong();
        long sellMatcherFee = data.readLong();
        long fee = data.readLong();
        long timestamp = data.readLong();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new ExchangeTransaction(order1.sender(), order1, order2, amount, price, buyMatcherFee, sellMatcherFee,
                Waves.chainId, fee, timestamp, version, proofs);
    }

    protected static LeaseTransaction lease(BytesReader data, int version, boolean withProofs) throws IOException {
        if (version == 2 && data.read() != 0)
            throw new IOException("Reserved field must be 0");

        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        Recipient recipient = data.readRecipient();
        long amount = data.readLong();
        long fee = data.readLong();
        long timestamp = data.readLong();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new LeaseTransaction(sender, recipient, amount, recipient.chainId(), fee, timestamp, version, proofs);
    }

    protected static LeaseCancelTransaction leaseCancel(BytesReader data, int version, boolean withProofs) throws IOException {
        byte chainId = version == 2 ? data.read() : Waves.chainId;
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        long fee = data.readLong();
        long timestamp = data.readLong();
        TxId leaseId = TxId.id(data.read(TxId.BYTE_LENGTH));

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new LeaseCancelTransaction(sender, leaseId, chainId, fee, timestamp, version, proofs);
    }

    protected static CreateAliasTransaction createAlias(BytesReader data, int version, boolean withProofs) throws IOException {
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        byte[] alias = data.readSizedArray();
        long fee = data.readLong();
        long timestamp = data.readLong();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new CreateAliasTransaction(sender, new String(alias, UTF_8), Waves.chainId, fee, timestamp, version, proofs);
    }

    protected static MassTransferTransaction massTransfer(BytesReader data, int version, boolean withProofs) throws IOException {
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        boolean isAsset = data.readBoolean();
        Asset asset = isAsset ? Asset.id(data.read(Asset.BYTE_LENGTH)) : Asset.WAVES;
        short transfersCount = data.readShort();
        long totalAmount = data.readLong();
        List<Transfer> transfers = new ArrayList<>();
        for (int i = 0; i < transfersCount; i++) {
            Recipient recipient = data.readRecipient();
            long amount = data.readLong();
            transfers.add(Transfer.to(recipient, amount));
        }
        long timestamp = data.readLong();
        long fee = data.readLong();
        byte[] attachment = data.readSizedArray();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        byte chainId = transfersCount > 0 ? transfers.get(0).recipient().chainId() : Waves.chainId;

        MassTransferTransaction tx = new MassTransferTransaction(
                sender, transfers, asset, attachment, chainId, fee, timestamp, version, proofs);
        if (totalAmount != tx.total())
            throw new IOException("Calculated total amount " + tx.total()
                    + " is not equal to " + totalAmount + " of deserialized MassTransfer transaction");

        return tx;
    }

    protected static DataTransaction data(BytesReader data, int version, boolean withProofs) throws IOException {
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        short entriesCount = data.readShort();
        List<DataEntry> entries = new ArrayList<>();
        for (int i = 0; i < entriesCount; i++) {
            String key = new String(data.read(data.readShort()), UTF_8); //ask can be non utf8 bytes?
            byte type = data.read();
            if (type == 0) entries.add(new IntegerEntry(key, data.readLong()));
            else if (type == 1) entries.add(new BooleanEntry(key, data.readBoolean()));
            else if (type == 2) entries.add(new BinaryEntry(key, data.readSizedArray()));
            else if (type == 3) entries.add(new StringEntry(key, new String(data.readSizedArray(), UTF_8)));
            else throw new IOException("Unknown type code " + type + " of data item #" + i);
        }
        long fee = data.readLong();
        long timestamp = data.readLong();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new DataTransaction(sender, entries, Waves.chainId, fee, timestamp, version, proofs);
    }

    protected static SetScriptTransaction setScript(BytesReader data, int version, boolean withProofs) throws IOException {
        byte chainId = data.read();
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        boolean hasScript = data.readBoolean();
        byte[] script = hasScript ? data.readSizedArray() : Bytes.empty();
        long fee = data.readLong();
        long timestamp = data.readLong();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new SetScriptTransaction(sender, script, chainId, fee, timestamp, version, proofs);
    }

    protected static SponsorFeeTransaction sponsorFee(BytesReader data, int version, boolean withProofs) throws IOException {
        byte chainId = data.read();
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        Asset asset = Asset.id(data.read(TxId.BYTE_LENGTH));
        long minSponsoredFee = data.readLong();
        long fee = data.readLong();
        long timestamp = data.readLong();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new SponsorFeeTransaction(sender, asset, minSponsoredFee, chainId, fee, timestamp, version, proofs);
    }

    protected static SetAssetScriptTransaction setAssetScript(BytesReader data, int version, boolean withProofs) throws IOException {
        byte chainId = data.read();
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        Asset asset = Asset.id(data.read(Asset.BYTE_LENGTH));
        boolean hasScript = data.readBoolean();
        byte[] script = hasScript ? data.readSizedArray() : Bytes.empty();
        long fee = data.readLong();
        long timestamp = data.readLong();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new SetAssetScriptTransaction(sender, asset, script, chainId, fee, timestamp, version, proofs);
    }

    protected static InvokeScriptTransaction invokeScript(BytesReader data, int version, boolean withProofs) throws IOException {
        byte chainId = data.read();
        PublicKey sender = PublicKey.as(data.read(PublicKey.BYTES_LENGTH));
        Recipient dApp = data.readRecipient();
        Function functionCall = data.readFunctionCall();
        long paymentsCount = data.readLong();
        List<Amount> payments = new ArrayList<>();
        for (int i = 0; i < paymentsCount; i++) {
            long amount = data.readLong();
            Asset asset = data.readBoolean() ? Asset.id(data.read(Asset.BYTE_LENGTH)) : Asset.WAVES;
            payments.add(Amount.of(amount, asset));
        }
        long fee = data.readLong();
        Asset feeAsset = data.readBoolean() ? Asset.id(data.read(Asset.BYTE_LENGTH)) : Asset.WAVES;
        long timestamp = data.readLong();

        List<Proof> proofs;
        if (withProofs)
            proofs = data.readProofs();
        else
            proofs = data.readSignature();

        return new InvokeScriptTransaction(sender, dApp, functionCall, payments, chainId, fee, feeAsset, timestamp, version, proofs);
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
