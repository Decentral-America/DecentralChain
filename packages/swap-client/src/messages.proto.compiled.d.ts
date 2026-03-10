import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace proto. */
export namespace proto {

    /** Properties of a Request. */
    interface IRequest {

        /** Request exchange */
        exchange?: (proto.Request.IExchange|null);
    }

    /** Represents a Request. */
    class Request implements IRequest {

        /**
         * Constructs a new Request.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.IRequest);

        /** Request exchange. */
        public exchange?: (proto.Request.IExchange|null);

        /** Request payload. */
        public payload?: "exchange";

        /**
         * Creates a new Request instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Request instance
         */
        public static create(properties?: proto.IRequest): proto.Request;

        /**
         * Encodes the specified Request message. Does not implicitly {@link proto.Request.verify|verify} messages.
         * @param message Request message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: proto.IRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Request message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Request
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Request;

        /**
         * Gets the default type url for Request
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace Request {

        /** Properties of an Exchange. */
        interface IExchange {

            /** Exchange id */
            id?: (string|null);

            /** Exchange source */
            source?: (string|null);

            /** Exchange target */
            target?: (string|null);

            /** Exchange amount */
            amount?: (Long|null);

            /** Exchange slippageTolerance */
            slippageTolerance?: (number|null);

            /** Exchange recipient */
            recipient?: (string|null);

            /** Exchange referrer */
            referrer?: (string|null);
        }

        /** Represents an Exchange. */
        class Exchange implements IExchange {

            /**
             * Constructs a new Exchange.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.Request.IExchange);

            /** Exchange id. */
            public id: string;

            /** Exchange source. */
            public source: string;

            /** Exchange target. */
            public target: string;

            /** Exchange amount. */
            public amount: Long;

            /** Exchange slippageTolerance. */
            public slippageTolerance: number;

            /** Exchange recipient. */
            public recipient: string;

            /** Exchange referrer. */
            public referrer: string;

            /**
             * Creates a new Exchange instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Exchange instance
             */
            public static create(properties?: proto.Request.IExchange): proto.Request.Exchange;

            /**
             * Encodes the specified Exchange message. Does not implicitly {@link proto.Request.Exchange.verify|verify} messages.
             * @param message Exchange message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.Request.IExchange, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Exchange message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Exchange
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Request.Exchange;

            /**
             * Gets the default type url for Exchange
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }

    /** Properties of a Response. */
    interface IResponse {

        /** Response id */
        id?: (string|null);

        /** Response exchange */
        exchange?: (proto.Response.IExchange|null);
    }

    /** Represents a Response. */
    class Response implements IResponse {

        /**
         * Constructs a new Response.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.IResponse);

        /** Response id. */
        public id: string;

        /** Response exchange. */
        public exchange?: (proto.Response.IExchange|null);

        /** Response payload. */
        public payload?: "exchange";

        /**
         * Creates a new Response instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Response instance
         */
        public static create(properties?: proto.IResponse): proto.Response;

        /**
         * Encodes the specified Response message. Does not implicitly {@link proto.Response.verify|verify} messages.
         * @param message Response message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: proto.IResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Response message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Response
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Response;

        /**
         * Gets the default type url for Response
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace Response {

        /** Properties of an Error. */
        interface IError {

            /** Error code */
            code?: (proto.Response.Error.CODES|null);

            /** Error message */
            message?: (string|null);
        }

        /** Represents an Error. */
        class Error implements IError {

            /**
             * Constructs a new Error.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.Response.IError);

            /** Error code. */
            public code: proto.Response.Error.CODES;

            /** Error message. */
            public message: string;

            /**
             * Creates a new Error instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Error instance
             */
            public static create(properties?: proto.Response.IError): proto.Response.Error;

            /**
             * Encodes the specified Error message. Does not implicitly {@link proto.Response.Error.verify|verify} messages.
             * @param message Error message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.Response.IError, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Response.Error;

            /**
             * Gets the default type url for Error
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace Error {

            /** CODES enum. */
            enum CODES {
                UNAVAILABLE = 0,
                UNEXPECTED = 1,
                INVALID_ASSET_PAIR = 2,
                INVALID_ARGUMENTS = 3
            }
        }

        /** Properties of an Exchange. */
        interface IExchange {

            /** Exchange vendor */
            vendor?: (string|null);

            /** Exchange data */
            data?: (proto.Response.Exchange.IData|null);

            /** Exchange error */
            error?: (proto.Response.IError|null);
        }

        /** Represents an Exchange. */
        class Exchange implements IExchange {

            /**
             * Constructs a new Exchange.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.Response.IExchange);

            /** Exchange vendor. */
            public vendor: string;

            /** Exchange data. */
            public data?: (proto.Response.Exchange.IData|null);

            /** Exchange error. */
            public error?: (proto.Response.IError|null);

            /** Exchange result. */
            public result?: ("data"|"error");

            /**
             * Creates a new Exchange instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Exchange instance
             */
            public static create(properties?: proto.Response.IExchange): proto.Response.Exchange;

            /**
             * Encodes the specified Exchange message. Does not implicitly {@link proto.Response.Exchange.verify|verify} messages.
             * @param message Exchange message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.Response.IExchange, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Exchange message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Exchange
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Response.Exchange;

            /**
             * Gets the default type url for Exchange
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace Exchange {

            /** Properties of a Transaction. */
            interface ITransaction {

                /** Transaction dApp */
                dApp?: (string|null);

                /** Transaction call */
                call?: (proto.Response.Exchange.Transaction.ICall|null);
            }

            /** Represents a Transaction. */
            class Transaction implements ITransaction {

                /**
                 * Constructs a new Transaction.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: proto.Response.Exchange.ITransaction);

                /** Transaction dApp. */
                public dApp: string;

                /** Transaction call. */
                public call?: (proto.Response.Exchange.Transaction.ICall|null);

                /**
                 * Creates a new Transaction instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Transaction instance
                 */
                public static create(properties?: proto.Response.Exchange.ITransaction): proto.Response.Exchange.Transaction;

                /**
                 * Encodes the specified Transaction message. Does not implicitly {@link proto.Response.Exchange.Transaction.verify|verify} messages.
                 * @param message Transaction message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: proto.Response.Exchange.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Transaction message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Transaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Response.Exchange.Transaction;

                /**
                 * Gets the default type url for Transaction
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            namespace Transaction {

                /** Properties of an Argument. */
                interface IArgument {

                    /** Argument integerValue */
                    integerValue?: (Long|null);

                    /** Argument binaryValue */
                    binaryValue?: (Uint8Array|null);

                    /** Argument stringValue */
                    stringValue?: (string|null);

                    /** Argument booleanValue */
                    booleanValue?: (boolean|null);

                    /** Argument list */
                    list?: (proto.Response.Exchange.Transaction.Argument.IList|null);
                }

                /** Represents an Argument. */
                class Argument implements IArgument {

                    /**
                     * Constructs a new Argument.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: proto.Response.Exchange.Transaction.IArgument);

                    /** Argument integerValue. */
                    public integerValue?: (Long|null);

                    /** Argument binaryValue. */
                    public binaryValue?: (Uint8Array|null);

                    /** Argument stringValue. */
                    public stringValue?: (string|null);

                    /** Argument booleanValue. */
                    public booleanValue?: (boolean|null);

                    /** Argument list. */
                    public list?: (proto.Response.Exchange.Transaction.Argument.IList|null);

                    /** Argument value. */
                    public value?: ("integerValue"|"binaryValue"|"stringValue"|"booleanValue"|"list");

                    /**
                     * Creates a new Argument instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Argument instance
                     */
                    public static create(properties?: proto.Response.Exchange.Transaction.IArgument): proto.Response.Exchange.Transaction.Argument;

                    /**
                     * Encodes the specified Argument message. Does not implicitly {@link proto.Response.Exchange.Transaction.Argument.verify|verify} messages.
                     * @param message Argument message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: proto.Response.Exchange.Transaction.IArgument, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes an Argument message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Argument
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Response.Exchange.Transaction.Argument;

                    /**
                     * Gets the default type url for Argument
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                namespace Argument {

                    /** Properties of a List. */
                    interface IList {

                        /** List items */
                        items?: (proto.Response.Exchange.Transaction.IArgument[]|null);
                    }

                    /** Represents a List. */
                    class List implements IList {

                        /**
                         * Constructs a new List.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: proto.Response.Exchange.Transaction.Argument.IList);

                        /** List items. */
                        public items: proto.Response.Exchange.Transaction.IArgument[];

                        /**
                         * Creates a new List instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns List instance
                         */
                        public static create(properties?: proto.Response.Exchange.Transaction.Argument.IList): proto.Response.Exchange.Transaction.Argument.List;

                        /**
                         * Encodes the specified List message. Does not implicitly {@link proto.Response.Exchange.Transaction.Argument.List.verify|verify} messages.
                         * @param message List message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: proto.Response.Exchange.Transaction.Argument.IList, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a List message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns List
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Response.Exchange.Transaction.Argument.List;

                        /**
                         * Gets the default type url for List
                         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns The default type url
                         */
                        public static getTypeUrl(typeUrlPrefix?: string): string;
                    }
                }

                /** Properties of a Call. */
                interface ICall {

                    /** Call function */
                    "function"?: (string|null);

                    /** Call arguments */
                    "arguments"?: (proto.Response.Exchange.Transaction.IArgument[]|null);
                }

                /** Represents a Call. */
                class Call implements ICall {

                    /**
                     * Constructs a new Call.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: proto.Response.Exchange.Transaction.ICall);

                    /** Call function. */
                    public function: string;

                    /** Call arguments. */
                    public arguments: proto.Response.Exchange.Transaction.IArgument[];

                    /**
                     * Creates a new Call instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Call instance
                     */
                    public static create(properties?: proto.Response.Exchange.Transaction.ICall): proto.Response.Exchange.Transaction.Call;

                    /**
                     * Encodes the specified Call message. Does not implicitly {@link proto.Response.Exchange.Transaction.Call.verify|verify} messages.
                     * @param message Call message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: proto.Response.Exchange.Transaction.ICall, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Call message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Call
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Response.Exchange.Transaction.Call;

                    /**
                     * Gets the default type url for Call
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }
            }

            /** Properties of a Data. */
            interface IData {

                /** Data amount */
                amount?: (Long|null);

                /** Data priceImpact */
                priceImpact?: (number|null);

                /** Data transaction */
                transaction?: (proto.Response.Exchange.ITransaction|null);

                /** Data minReceived */
                minReceived?: (Long|null);

                /** Data originalAmount */
                originalAmount?: (Long|null);

                /** Data originalMinReceived */
                originalMinReceived?: (Long|null);
            }

            /** Represents a Data. */
            class Data implements IData {

                /**
                 * Constructs a new Data.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: proto.Response.Exchange.IData);

                /** Data amount. */
                public amount: Long;

                /** Data priceImpact. */
                public priceImpact: number;

                /** Data transaction. */
                public transaction?: (proto.Response.Exchange.ITransaction|null);

                /** Data minReceived. */
                public minReceived: Long;

                /** Data originalAmount. */
                public originalAmount: Long;

                /** Data originalMinReceived. */
                public originalMinReceived: Long;

                /**
                 * Creates a new Data instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Data instance
                 */
                public static create(properties?: proto.Response.Exchange.IData): proto.Response.Exchange.Data;

                /**
                 * Encodes the specified Data message. Does not implicitly {@link proto.Response.Exchange.Data.verify|verify} messages.
                 * @param message Data message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: proto.Response.Exchange.IData, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Data message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Data
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Response.Exchange.Data;

                /**
                 * Gets the default type url for Data
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }
    }
}
