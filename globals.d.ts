// Type definitions for WavesKeeper
// Project: WavesKeeper

/*~ This template shows how to write a global plugin. */

interface Window {
    WavesKeeper: WavesKeeper.TWavesKeeperApi;
}

declare var WavesKeeper: WavesKeeper.TWavesKeeperApi;

declare namespace WavesKeeper {

    type TWavesKeeperApi = {
        /**
         * This is a method for obtaining a signature of authorization data while verifying Waves' user.
         * @param data
         */
        auth(data: IAuthData): Promise<IAuthResponse>;

        /**
         * If a website is trusted, Waves Keeper public data are returned.
         */
        publicState(): Promise<IPublicStateResponse>;

        /**
         * Waves Keeper's method for cancelling an order to the matcher.
         * It works identically to signCancelOrder, but also tries to send data to the matcher.
         * @param data
         */
        signAndPublishCancelOrder(data: TSignCancelOrderData): Promise<string>;

        /**
         * Waves Keeper's method for creating an order to the matcher is identical to signOrder
         * but it also tries to send data to the matcher.
         * @param data
         */
        signAndPublishOrder(data: TSignOrderData): Promise<string>;

        /**
         * This is similar to "signTransaction", but it also broadcasts a transaction to the blockchain.
         * @param data
         */
        signAndPublishTransaction(data: TSignTransactionData): Promise<string>;

        /**
         * Waves Keeper's method for signing cancellation of an order to the matcher.
         * @param data
         */
        signCancelOrder(data: TSignCancelOrderData): Promise<string>;

        /**
         * Waves Keeper's method for signing an order to the matcher.
         * @param data
         */
        signOrder(data: TSignOrderData): Promise<string>;

        /**
         * A method for signing transactions in Waves' network.
         * @param data
         */
        signTransaction(data: TSignTransactionData): Promise<string>;

        /**
         * Waves Keeper's method for signing typified data, for signing requests on various services.
         * @param data
         */
        signRequest(data: TSignRequestData): Promise<string>;

        /**
         * A package transaction signature. Sometimes several transactions need to be simultaneously signed,
         * and for users' convenience, up to seven transactions at ones could be signed.
         * Only certain types of transactions are permitted:
         * issue, transfer, reissue, burn, create alias, mass transfer, data
         * @param tx
         * @param name
         */
        signTransactionPackage(tx: TSignTransactionPackageData, name?: string): Promise<Array<string>>;

        /**
         * Send message to keeper.
         * You can send message only 1 time in 30 sec for trusted sites with send permission
         * @param data
         */
        notification(data: INotificationData): Promise<any>;

        /**
         * You can encrypt string messages to account in Waves network.
         * You need have recipient publicKey.
         * @param stringToEncrypt
         * String to encrypt
         * @param publicKey
         * Public key in base58 string
         * @param prefix
         * Prefix is secret app string need for encoding
         */
        encryptMessage(stringToEncrypt: string, publicKey: string, prefix: string): Promise<string>;

        /**
         * You can decrypt string messages from account in Waves network to you.
         * You need have sender publicKey and encrypted message.
         * @param stringToDecrypt
         * String to decrypt
         * @param publicKey
         * Public key in base58 string
         * @param prefix
         * Prefix is secret app string need for encoding
         */
        decryptMessage(stringToDecrypt: string, publicKey: string, prefix: string): Promise<string>;

        /**
         * Allows subscribing to Waves Keeper events.
         * If a website is not trusted, events won't show.
         * @param event
         * Supports events:
         * update – subscribe to updates of the state
         * @param cb
         */
        on(event: 'update', cb: (state: IPublicStateResponse) => any): object;

        /**
         * On initialize window.WavesKeeper has not api methods.
         * You can use WavesKeeper.initialPromise for waiting end initializing api
         */
        initialPromise() : Promise<any>;

    }

    interface IAuthData {
        /**
         * a string line with any data (required field)
         */
        data: string;
        /**
         * name of the service (optional field)
         */
        name?: string;
        /**
         * a websites' full URL for redirect (optional field)
         */
        referrer?: string;
        /**
         * path to the logo relative to the referrer or origin of the website (optional field)
         */
        icon?: string;
        /**
         *  relative path to the website's Auth API (optional field)
         */
        successPath?: string;
    }

    interface IAuthResponse {
        /**
         * an address in Waves network
         */
        address: string;
        /**
         * a host that requested a signature
         */
        host: string;
        /**
         * a prefix participating in the signature
         */
        prefix: string;
        /**
         * the user's public key
         */
        publicKey: string;
        /**
         * signature
         */
        signature: string;
        /**
         * API version
         */
        version: number;
        /**
         * the name of an application that requested a signature
         */
        name: string;
    }

    interface IPublicStateResponse {
        /**
         * boolean keeper initialized
         */
        initialized: boolean;
        /**
         * boolean keeper in wait mode
         */
        locked: boolean;
        /**
         * current account, if the user allowed access to the website, or null
         */
        account: TPublicStateAccount | null;
        /**
         * current Waves network, node and matcher addresses
         */
        network: TPublicStateNetwork,
        /**
         * signature request statuses
         */
        messages: Array<TPublicStateMessage>,
        /**
         * available transaction versions for each type
         */
        txVersion: Record<number, Array<number>>;
    }

    type TPublicStateNetwork = {
        code: string;
        server: string;
        matcher: string;
    }

    type TPublicStateAccount = {
        name: string;
        publicKey: string;
        address: string;
        networkCode: string;
        network: string;
        balance: TAccountBalance;
        type: string;
    }

    type TAccountBalance = {
        available: string;
        leasedOut: string;
        network: string;
    }

    type TPublicStateMessage = {
        id: string;
        status: string;
    }

    interface ICancelOrderData {
        /**
         * order ID
         */
        id: string;
        /**
         * sender's public key in base58
         */
        senderPublicKey?: string;
    }

    type TSignCancelOrderData = ISignData<1003, ICancelOrderData>;

    interface ISignOrderDataBody {
        /**
         * MoneyLike - amount
         */
        amount: TMoney;
        /**
         * MoneyLike - price
         */
        price: TMoney;
        /**
         * 'sell'/'buy' – order type
         */
        orderType: 'sell' | 'buy';
        /**
         * MoneyLike - fee (0.003 WAVES minimum)
         */
        matcherFee: TMoney;
        /**
         * the public key of the exchange service
         */
        matcherPublicKey: string;
        /**
         * the order's expiration time
         */
        expiration: string | number;
        /**
         * current time
         */
        timestamp?: string | number;
        /**
         * public key in base58
         */
        senderPublicKey?: string;
    }

    type TSignOrderData = ISignData<1002, ISignOrderDataBody>;

    interface ISignRequestBody {
        timestamp: number | string;
        /**
         * public key in base58
         */
        senderPublicKey?: string;
    }

    type TSignRequestData = ISignData<1001 | 1004, ISignRequestBody>;

    type TSignTransactionData =
        TIssueTxData |
        TTransferTxData |
        TReissueTxData |
        TBurnTxData |
        TLeaseTxData |
        TLeaseCancelTxData |
        TCreateAliasTxData |
        TMassTransferTxData |
        TDataTxData |
        TSetScriptTxData |
        TSponsoredFeeTxData |
        TSetAssetScriptTxData |
        TScriptInvocationTxData;

    interface ISignData<TYPE extends number, BODY> {
        type: TYPE;
        data: BODY;
    }

    interface ITransactionBase {
        /**
         * MoneyLike - fee
         */
        fee: TMoney;
        /**
         * sender's public key in base58
         */
        senderPublicKey?: string;
        /**
         * time in ms
         */
        timestamp?: number | string;
    }

    interface IIssueTx extends ITransactionBase {
        /**
         * [4, 16] string – token name
         */
        name: string;
        /**
         * [0, 1000] string – token description
         */
        description: string,
        /**
         * [0 - (JLM)] number/string - quantity
         */
        quantity: number | string;
        /**
         * [0 - 8] number - precision
         */
        precision: number;
        /**
         * can reissue token
         */
        reissuable: boolean;
        /**
         * smart asset
         */
        script?: string;
    }

    type TIssueTxData = ISignData<3, IIssueTx>;

    interface ITransferTx extends ITransactionBase {
        /**
         * MoneyLike - amount
         */
        amount: TMoney;
        /**
         * recipient's address or alias
         */
        recipient: string;
        /**
         * [,140 bytes] string or byte Array – additional info in text (optional field)
         */
        attachment?: string | Uint8Array | Array<number>;
    }

    type TTransferTxData = ISignData<4, ITransferTx>;

    interface IReissueTx extends ITransactionBase {
        /**
         * asset ID
         */
        assetId: string;
        /**
         * [0 - (JLM)] number/string/MoneyLike - quantity
         */
        quantity: number | string | TMoney;
        /**
         * deny reissue
         */
        reissuable: boolean;
    }

    type TReissueTxData = ISignData<5, IReissueTx>;

    interface IBurnTx extends ITransactionBase {
        /**
         * asset ID
         */
        assetId: string;
        /**
         * [0 - (JLM)] number/string/MoneyLike - quantity,
         */
        amount: number | string | TMoney;
    }

    type TBurnTxData = ISignData<6, IBurnTx>;

    interface ILeaseTx extends ITransactionBase {
        /**
         * recipient's address or alias
         */
        recipient: string;
        /**
         * [0 - (JLM)] number/string/MoneyLike - quantity
         */
        amount: number | string | TMoney;
    }

    type TLeaseTxData = ISignData<8, ILeaseTx>;

    interface ILeaseCancelTx extends ITransactionBase {
        /**
         * leasing transaction ID
         */
        leaseId: string;
    }

    type TLeaseCancelTxData = ISignData<9, ILeaseCancelTx>;

    interface ICreateAliasTx extends ITransactionBase {
        /**
         * [4, 30] string - alias
         */
        alias: string;
    }

    type TCreateAliasTxData = ISignData<10, ICreateAliasTx>;

    interface IMassTransferTx extends ITransactionBase {
        /**
         * moneyLike – total to be sent
         * instead of calculating the amount you may insert { assetId: "ID of the asset to be sent", coins: 0},
         */
        totalAmount: TMoney;
        /**
         * a mass of objects
         */
        transfers: Array<ITransfer>;
        /**
         * [,140 bytes в base58] string – additional info (optional field)
         */
        attachment?: string;
    }

    interface ITransfer {
        /**
         * address/alias
         */
        recipient: string;
        /**
         * amount
         */
        amount: number | string | TMoney;
    }

    type TMassTransferTxData = ISignData<11, IMassTransferTx>;

    interface IDataTx extends ITransactionBase {
        /**
         * mass of objects
         */
        data: Array<TData>;
    }

    type TData = TCallArgs & {key: string};

    type TDataTxData = ISignData<12, IDataTx>;

    interface ISetScriptTx extends ITransactionBase {
        /**
         * script
         * https://docs.wavesplatform.com/en/#section-5e6520b97a7ead921d7fb6bce7292ce0
         */
        script: string;
    }

    type TSetScriptTxData = ISignData<13, ISetScriptTx>;

    interface ISponsoredFeeTx extends ITransactionBase {
        /**
         * MoneyLike – fee price in the asset
         */
        minSponsoredAssetFee: TMoney;
    }

    type TSponsoredFeeTxData = ISignData<14, ISponsoredFeeTx>;

    interface ISetAssetScriptTx extends ITransactionBase {
        /**
         * asset ID
         */
        assetId: string;
        /**
         * script
         * https://docs.wavesplatform.com/en/#section-5e6520b97a7ead921d7fb6bce7292ce0
         */
        script: string;
    }

    type TSetAssetScriptTxData = ISignData<15, ISetAssetScriptTx>;

    interface IScriptInvocationTx extends ITransactionBase {
        /**
         * address script account
         */
        dApp: string;
        /**
         * array MoneyLike (at now can use only 1 payment)
         */
        payment?: Array<TMoney>;
        call?: ICall;
    }

    interface ICall {
        /**
         * function name
         */
        function: string;
        /**
         * array
         */
        args: Array<TCallArgs>;
    }

    type TCallArgs = TCallArgsInteger | TCallArgsBoolean | TCallArgsBinary | TCallArgsString;

    type TCallArgsInteger = {
        type: 'integer';
        value: number | string;
    }

    type TCallArgsBoolean = {
        type: 'boolean';
        value: boolean;
    }

    type TCallArgsBinary = {
        type: 'binary';
        /**
         * base64
         */
        value: string;
    }

    type TCallArgsString = {
        type: 'string';
        value: string;
    }

    type TScriptInvocationTxData = ISignData<16, IScriptInvocationTx>;

    type TSignTransactionPackageData = Array<
        TIssueTxData |
        TTransferTxData |
        TReissueTxData |
        TBurnTxData |
        TCreateAliasTxData |
        TMassTransferTxData |
        TDataTxData |
        TScriptInvocationTxData>;

    interface INotificationData {
        /**
         * string (20 chars max)
         */
        title: string;
        /**
         * string (250 chars max)
         */
        message?: string;
    }

    interface IMoneyTokens {
        assetId: string;
        tokens: number | string;
    }

    interface IMoneyCoins {
        assetId: string;
        coins: number | string;
    }

    interface IMoneyAmount {
        assetId: string;
        /**
         * coins alias
         */
        amount: number | string;
    }

    type TMoney = IMoneyTokens | IMoneyCoins | IMoneyAmount;
}
