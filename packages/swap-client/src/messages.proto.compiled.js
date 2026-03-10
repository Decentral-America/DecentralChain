/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const proto = $root.proto = (() => {

    /**
     * Namespace proto.
     * @exports proto
     * @namespace
     */
    const proto = {};

    proto.Request = (function() {

        /**
         * Properties of a Request.
         * @memberof proto
         * @interface IRequest
         * @property {proto.Request.IExchange|null} [exchange] Request exchange
         */

        /**
         * Constructs a new Request.
         * @memberof proto
         * @classdesc Represents a Request.
         * @implements IRequest
         * @constructor
         * @param {proto.IRequest=} [properties] Properties to set
         */
        function Request(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Request exchange.
         * @member {proto.Request.IExchange|null|undefined} exchange
         * @memberof proto.Request
         * @instance
         */
        Request.prototype.exchange = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * Request payload.
         * @member {"exchange"|undefined} payload
         * @memberof proto.Request
         * @instance
         */
        Object.defineProperty(Request.prototype, "payload", {
            get: $util.oneOfGetter($oneOfFields = ["exchange"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Request instance using the specified properties.
         * @function create
         * @memberof proto.Request
         * @static
         * @param {proto.IRequest=} [properties] Properties to set
         * @returns {proto.Request} Request instance
         */
        Request.create = function create(properties) {
            return new Request(properties);
        };

        /**
         * Encodes the specified Request message. Does not implicitly {@link proto.Request.verify|verify} messages.
         * @function encode
         * @memberof proto.Request
         * @static
         * @param {proto.IRequest} message Request message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Request.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.exchange != null && Object.hasOwnProperty.call(message, "exchange"))
                $root.proto.Request.Exchange.encode(message.exchange, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Decodes a Request message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Request
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.Request} Request
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Request.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Request();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.exchange = $root.proto.Request.Exchange.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Gets the default type url for Request
         * @function getTypeUrl
         * @memberof proto.Request
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Request.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Request";
        };

        Request.Exchange = (function() {

            /**
             * Properties of an Exchange.
             * @memberof proto.Request
             * @interface IExchange
             * @property {string|null} [id] Exchange id
             * @property {string|null} [source] Exchange source
             * @property {string|null} [target] Exchange target
             * @property {Long|null} [amount] Exchange amount
             * @property {number|null} [slippageTolerance] Exchange slippageTolerance
             * @property {string|null} [recipient] Exchange recipient
             * @property {string|null} [referrer] Exchange referrer
             */

            /**
             * Constructs a new Exchange.
             * @memberof proto.Request
             * @classdesc Represents an Exchange.
             * @implements IExchange
             * @constructor
             * @param {proto.Request.IExchange=} [properties] Properties to set
             */
            function Exchange(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Exchange id.
             * @member {string} id
             * @memberof proto.Request.Exchange
             * @instance
             */
            Exchange.prototype.id = "";

            /**
             * Exchange source.
             * @member {string} source
             * @memberof proto.Request.Exchange
             * @instance
             */
            Exchange.prototype.source = "";

            /**
             * Exchange target.
             * @member {string} target
             * @memberof proto.Request.Exchange
             * @instance
             */
            Exchange.prototype.target = "";

            /**
             * Exchange amount.
             * @member {Long} amount
             * @memberof proto.Request.Exchange
             * @instance
             */
            Exchange.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Exchange slippageTolerance.
             * @member {number} slippageTolerance
             * @memberof proto.Request.Exchange
             * @instance
             */
            Exchange.prototype.slippageTolerance = 0;

            /**
             * Exchange recipient.
             * @member {string} recipient
             * @memberof proto.Request.Exchange
             * @instance
             */
            Exchange.prototype.recipient = "";

            /**
             * Exchange referrer.
             * @member {string} referrer
             * @memberof proto.Request.Exchange
             * @instance
             */
            Exchange.prototype.referrer = "";

            /**
             * Creates a new Exchange instance using the specified properties.
             * @function create
             * @memberof proto.Request.Exchange
             * @static
             * @param {proto.Request.IExchange=} [properties] Properties to set
             * @returns {proto.Request.Exchange} Exchange instance
             */
            Exchange.create = function create(properties) {
                return new Exchange(properties);
            };

            /**
             * Encodes the specified Exchange message. Does not implicitly {@link proto.Request.Exchange.verify|verify} messages.
             * @function encode
             * @memberof proto.Request.Exchange
             * @static
             * @param {proto.Request.IExchange} message Exchange message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Exchange.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
                if (message.source != null && Object.hasOwnProperty.call(message, "source"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.source);
                if (message.target != null && Object.hasOwnProperty.call(message, "target"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.target);
                if (message.amount != null && Object.hasOwnProperty.call(message, "amount"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int64(message.amount);
                if (message.slippageTolerance != null && Object.hasOwnProperty.call(message, "slippageTolerance"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.slippageTolerance);
                if (message.recipient != null && Object.hasOwnProperty.call(message, "recipient"))
                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.recipient);
                if (message.referrer != null && Object.hasOwnProperty.call(message, "referrer"))
                    writer.uint32(/* id 7, wireType 2 =*/58).string(message.referrer);
                return writer;
            };

            /**
             * Decodes an Exchange message from the specified reader or buffer.
             * @function decode
             * @memberof proto.Request.Exchange
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.Request.Exchange} Exchange
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Exchange.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Request.Exchange();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.id = reader.string();
                            break;
                        }
                    case 2: {
                            message.source = reader.string();
                            break;
                        }
                    case 3: {
                            message.target = reader.string();
                            break;
                        }
                    case 4: {
                            message.amount = reader.int64();
                            break;
                        }
                    case 5: {
                            message.slippageTolerance = reader.int32();
                            break;
                        }
                    case 6: {
                            message.recipient = reader.string();
                            break;
                        }
                    case 7: {
                            message.referrer = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Gets the default type url for Exchange
             * @function getTypeUrl
             * @memberof proto.Request.Exchange
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Exchange.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/proto.Request.Exchange";
            };

            return Exchange;
        })();

        return Request;
    })();

    proto.Response = (function() {

        /**
         * Properties of a Response.
         * @memberof proto
         * @interface IResponse
         * @property {string|null} [id] Response id
         * @property {proto.Response.IExchange|null} [exchange] Response exchange
         */

        /**
         * Constructs a new Response.
         * @memberof proto
         * @classdesc Represents a Response.
         * @implements IResponse
         * @constructor
         * @param {proto.IResponse=} [properties] Properties to set
         */
        function Response(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Response id.
         * @member {string} id
         * @memberof proto.Response
         * @instance
         */
        Response.prototype.id = "";

        /**
         * Response exchange.
         * @member {proto.Response.IExchange|null|undefined} exchange
         * @memberof proto.Response
         * @instance
         */
        Response.prototype.exchange = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * Response payload.
         * @member {"exchange"|undefined} payload
         * @memberof proto.Response
         * @instance
         */
        Object.defineProperty(Response.prototype, "payload", {
            get: $util.oneOfGetter($oneOfFields = ["exchange"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Response instance using the specified properties.
         * @function create
         * @memberof proto.Response
         * @static
         * @param {proto.IResponse=} [properties] Properties to set
         * @returns {proto.Response} Response instance
         */
        Response.create = function create(properties) {
            return new Response(properties);
        };

        /**
         * Encodes the specified Response message. Does not implicitly {@link proto.Response.verify|verify} messages.
         * @function encode
         * @memberof proto.Response
         * @static
         * @param {proto.IResponse} message Response message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Response.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.exchange != null && Object.hasOwnProperty.call(message, "exchange"))
                $root.proto.Response.Exchange.encode(message.exchange, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Decodes a Response message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Response
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.Response} Response
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Response.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Response();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.id = reader.string();
                        break;
                    }
                case 2: {
                        message.exchange = $root.proto.Response.Exchange.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Gets the default type url for Response
         * @function getTypeUrl
         * @memberof proto.Response
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Response";
        };

        Response.Error = (function() {

            /**
             * Properties of an Error.
             * @memberof proto.Response
             * @interface IError
             * @property {proto.Response.Error.CODES|null} [code] Error code
             * @property {string|null} [message] Error message
             */

            /**
             * Constructs a new Error.
             * @memberof proto.Response
             * @classdesc Represents an Error.
             * @implements IError
             * @constructor
             * @param {proto.Response.IError=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error code.
             * @member {proto.Response.Error.CODES} code
             * @memberof proto.Response.Error
             * @instance
             */
            Error.prototype.code = 0;

            /**
             * Error message.
             * @member {string} message
             * @memberof proto.Response.Error
             * @instance
             */
            Error.prototype.message = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @function create
             * @memberof proto.Response.Error
             * @static
             * @param {proto.Response.IError=} [properties] Properties to set
             * @returns {proto.Response.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link proto.Response.Error.verify|verify} messages.
             * @function encode
             * @memberof proto.Response.Error
             * @static
             * @param {proto.Response.IError} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @function decode
             * @memberof proto.Response.Error
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.Response.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Response.Error();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.code = reader.int32();
                            break;
                        }
                    case 2: {
                            message.message = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Gets the default type url for Error
             * @function getTypeUrl
             * @memberof proto.Response.Error
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Error.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/proto.Response.Error";
            };

            /**
             * CODES enum.
             * @name proto.Response.Error.CODES
             * @enum {number}
             * @property {number} UNAVAILABLE=0 UNAVAILABLE value
             * @property {number} UNEXPECTED=1 UNEXPECTED value
             * @property {number} INVALID_ASSET_PAIR=2 INVALID_ASSET_PAIR value
             * @property {number} INVALID_ARGUMENTS=3 INVALID_ARGUMENTS value
             */
            Error.CODES = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "UNAVAILABLE"] = 0;
                values[valuesById[1] = "UNEXPECTED"] = 1;
                values[valuesById[2] = "INVALID_ASSET_PAIR"] = 2;
                values[valuesById[3] = "INVALID_ARGUMENTS"] = 3;
                return values;
            })();

            return Error;
        })();

        Response.Exchange = (function() {

            /**
             * Properties of an Exchange.
             * @memberof proto.Response
             * @interface IExchange
             * @property {string|null} [vendor] Exchange vendor
             * @property {proto.Response.Exchange.IData|null} [data] Exchange data
             * @property {proto.Response.IError|null} [error] Exchange error
             */

            /**
             * Constructs a new Exchange.
             * @memberof proto.Response
             * @classdesc Represents an Exchange.
             * @implements IExchange
             * @constructor
             * @param {proto.Response.IExchange=} [properties] Properties to set
             */
            function Exchange(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Exchange vendor.
             * @member {string} vendor
             * @memberof proto.Response.Exchange
             * @instance
             */
            Exchange.prototype.vendor = "";

            /**
             * Exchange data.
             * @member {proto.Response.Exchange.IData|null|undefined} data
             * @memberof proto.Response.Exchange
             * @instance
             */
            Exchange.prototype.data = null;

            /**
             * Exchange error.
             * @member {proto.Response.IError|null|undefined} error
             * @memberof proto.Response.Exchange
             * @instance
             */
            Exchange.prototype.error = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * Exchange result.
             * @member {"data"|"error"|undefined} result
             * @memberof proto.Response.Exchange
             * @instance
             */
            Object.defineProperty(Exchange.prototype, "result", {
                get: $util.oneOfGetter($oneOfFields = ["data", "error"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new Exchange instance using the specified properties.
             * @function create
             * @memberof proto.Response.Exchange
             * @static
             * @param {proto.Response.IExchange=} [properties] Properties to set
             * @returns {proto.Response.Exchange} Exchange instance
             */
            Exchange.create = function create(properties) {
                return new Exchange(properties);
            };

            /**
             * Encodes the specified Exchange message. Does not implicitly {@link proto.Response.Exchange.verify|verify} messages.
             * @function encode
             * @memberof proto.Response.Exchange
             * @static
             * @param {proto.Response.IExchange} message Exchange message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Exchange.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.vendor != null && Object.hasOwnProperty.call(message, "vendor"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.vendor);
                if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                    $root.proto.Response.Exchange.Data.encode(message.data, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.error != null && Object.hasOwnProperty.call(message, "error"))
                    $root.proto.Response.Error.encode(message.error, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Decodes an Exchange message from the specified reader or buffer.
             * @function decode
             * @memberof proto.Response.Exchange
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.Response.Exchange} Exchange
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Exchange.decode = function decode(reader, length, error) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Response.Exchange();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.vendor = reader.string();
                            break;
                        }
                    case 2: {
                            message.data = $root.proto.Response.Exchange.Data.decode(reader, reader.uint32());
                            break;
                        }
                    case 3: {
                            message.error = $root.proto.Response.Error.decode(reader, reader.uint32());
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Gets the default type url for Exchange
             * @function getTypeUrl
             * @memberof proto.Response.Exchange
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Exchange.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/proto.Response.Exchange";
            };

            Exchange.Transaction = (function() {

                /**
                 * Properties of a Transaction.
                 * @memberof proto.Response.Exchange
                 * @interface ITransaction
                 * @property {string|null} [dApp] Transaction dApp
                 * @property {proto.Response.Exchange.Transaction.ICall|null} [call] Transaction call
                 */

                /**
                 * Constructs a new Transaction.
                 * @memberof proto.Response.Exchange
                 * @classdesc Represents a Transaction.
                 * @implements ITransaction
                 * @constructor
                 * @param {proto.Response.Exchange.ITransaction=} [properties] Properties to set
                 */
                function Transaction(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Transaction dApp.
                 * @member {string} dApp
                 * @memberof proto.Response.Exchange.Transaction
                 * @instance
                 */
                Transaction.prototype.dApp = "";

                /**
                 * Transaction call.
                 * @member {proto.Response.Exchange.Transaction.ICall|null|undefined} call
                 * @memberof proto.Response.Exchange.Transaction
                 * @instance
                 */
                Transaction.prototype.call = null;

                /**
                 * Creates a new Transaction instance using the specified properties.
                 * @function create
                 * @memberof proto.Response.Exchange.Transaction
                 * @static
                 * @param {proto.Response.Exchange.ITransaction=} [properties] Properties to set
                 * @returns {proto.Response.Exchange.Transaction} Transaction instance
                 */
                Transaction.create = function create(properties) {
                    return new Transaction(properties);
                };

                /**
                 * Encodes the specified Transaction message. Does not implicitly {@link proto.Response.Exchange.Transaction.verify|verify} messages.
                 * @function encode
                 * @memberof proto.Response.Exchange.Transaction
                 * @static
                 * @param {proto.Response.Exchange.ITransaction} message Transaction message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Transaction.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.dApp != null && Object.hasOwnProperty.call(message, "dApp"))
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.dApp);
                    if (message.call != null && Object.hasOwnProperty.call(message, "call"))
                        $root.proto.Response.Exchange.Transaction.Call.encode(message.call, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                    return writer;
                };

                /**
                 * Decodes a Transaction message from the specified reader or buffer.
                 * @function decode
                 * @memberof proto.Response.Exchange.Transaction
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {proto.Response.Exchange.Transaction} Transaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Transaction.decode = function decode(reader, length, error) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Response.Exchange.Transaction();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        if (tag === error)
                            break;
                        switch (tag >>> 3) {
                        case 1: {
                                message.dApp = reader.string();
                                break;
                            }
                        case 2: {
                                message.call = $root.proto.Response.Exchange.Transaction.Call.decode(reader, reader.uint32());
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Gets the default type url for Transaction
                 * @function getTypeUrl
                 * @memberof proto.Response.Exchange.Transaction
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Transaction.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/proto.Response.Exchange.Transaction";
                };

                Transaction.Argument = (function() {

                    /**
                     * Properties of an Argument.
                     * @memberof proto.Response.Exchange.Transaction
                     * @interface IArgument
                     * @property {Long|null} [integerValue] Argument integerValue
                     * @property {Uint8Array|null} [binaryValue] Argument binaryValue
                     * @property {string|null} [stringValue] Argument stringValue
                     * @property {boolean|null} [booleanValue] Argument booleanValue
                     * @property {proto.Response.Exchange.Transaction.Argument.IList|null} [list] Argument list
                     */

                    /**
                     * Constructs a new Argument.
                     * @memberof proto.Response.Exchange.Transaction
                     * @classdesc Represents an Argument.
                     * @implements IArgument
                     * @constructor
                     * @param {proto.Response.Exchange.Transaction.IArgument=} [properties] Properties to set
                     */
                    function Argument(properties) {
                        if (properties)
                            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }

                    /**
                     * Argument integerValue.
                     * @member {Long|null|undefined} integerValue
                     * @memberof proto.Response.Exchange.Transaction.Argument
                     * @instance
                     */
                    Argument.prototype.integerValue = null;

                    /**
                     * Argument binaryValue.
                     * @member {Uint8Array|null|undefined} binaryValue
                     * @memberof proto.Response.Exchange.Transaction.Argument
                     * @instance
                     */
                    Argument.prototype.binaryValue = null;

                    /**
                     * Argument stringValue.
                     * @member {string|null|undefined} stringValue
                     * @memberof proto.Response.Exchange.Transaction.Argument
                     * @instance
                     */
                    Argument.prototype.stringValue = null;

                    /**
                     * Argument booleanValue.
                     * @member {boolean|null|undefined} booleanValue
                     * @memberof proto.Response.Exchange.Transaction.Argument
                     * @instance
                     */
                    Argument.prototype.booleanValue = null;

                    /**
                     * Argument list.
                     * @member {proto.Response.Exchange.Transaction.Argument.IList|null|undefined} list
                     * @memberof proto.Response.Exchange.Transaction.Argument
                     * @instance
                     */
                    Argument.prototype.list = null;

                    // OneOf field names bound to virtual getters and setters
                    let $oneOfFields;

                    /**
                     * Argument value.
                     * @member {"integerValue"|"binaryValue"|"stringValue"|"booleanValue"|"list"|undefined} value
                     * @memberof proto.Response.Exchange.Transaction.Argument
                     * @instance
                     */
                    Object.defineProperty(Argument.prototype, "value", {
                        get: $util.oneOfGetter($oneOfFields = ["integerValue", "binaryValue", "stringValue", "booleanValue", "list"]),
                        set: $util.oneOfSetter($oneOfFields)
                    });

                    /**
                     * Creates a new Argument instance using the specified properties.
                     * @function create
                     * @memberof proto.Response.Exchange.Transaction.Argument
                     * @static
                     * @param {proto.Response.Exchange.Transaction.IArgument=} [properties] Properties to set
                     * @returns {proto.Response.Exchange.Transaction.Argument} Argument instance
                     */
                    Argument.create = function create(properties) {
                        return new Argument(properties);
                    };

                    /**
                     * Encodes the specified Argument message. Does not implicitly {@link proto.Response.Exchange.Transaction.Argument.verify|verify} messages.
                     * @function encode
                     * @memberof proto.Response.Exchange.Transaction.Argument
                     * @static
                     * @param {proto.Response.Exchange.Transaction.IArgument} message Argument message or plain object to encode
                     * @param {$protobuf.Writer} [writer] Writer to encode to
                     * @returns {$protobuf.Writer} Writer
                     */
                    Argument.encode = function encode(message, writer) {
                        if (!writer)
                            writer = $Writer.create();
                        if (message.integerValue != null && Object.hasOwnProperty.call(message, "integerValue"))
                            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.integerValue);
                        if (message.binaryValue != null && Object.hasOwnProperty.call(message, "binaryValue"))
                            writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.binaryValue);
                        if (message.stringValue != null && Object.hasOwnProperty.call(message, "stringValue"))
                            writer.uint32(/* id 3, wireType 2 =*/26).string(message.stringValue);
                        if (message.booleanValue != null && Object.hasOwnProperty.call(message, "booleanValue"))
                            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.booleanValue);
                        if (message.list != null && Object.hasOwnProperty.call(message, "list"))
                            $root.proto.Response.Exchange.Transaction.Argument.List.encode(message.list, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
                        return writer;
                    };

                    /**
                     * Decodes an Argument message from the specified reader or buffer.
                     * @function decode
                     * @memberof proto.Response.Exchange.Transaction.Argument
                     * @static
                     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                     * @param {number} [length] Message length if known beforehand
                     * @returns {proto.Response.Exchange.Transaction.Argument} Argument
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    Argument.decode = function decode(reader, length, error) {
                        if (!(reader instanceof $Reader))
                            reader = $Reader.create(reader);
                        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Response.Exchange.Transaction.Argument();
                        while (reader.pos < end) {
                            let tag = reader.uint32();
                            if (tag === error)
                                break;
                            switch (tag >>> 3) {
                            case 1: {
                                    message.integerValue = reader.int64();
                                    break;
                                }
                            case 2: {
                                    message.binaryValue = reader.bytes();
                                    break;
                                }
                            case 3: {
                                    message.stringValue = reader.string();
                                    break;
                                }
                            case 4: {
                                    message.booleanValue = reader.bool();
                                    break;
                                }
                            case 10: {
                                    message.list = $root.proto.Response.Exchange.Transaction.Argument.List.decode(reader, reader.uint32());
                                    break;
                                }
                            default:
                                reader.skipType(tag & 7);
                                break;
                            }
                        }
                        return message;
                    };

                    /**
                     * Gets the default type url for Argument
                     * @function getTypeUrl
                     * @memberof proto.Response.Exchange.Transaction.Argument
                     * @static
                     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns {string} The default type url
                     */
                    Argument.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                        if (typeUrlPrefix === undefined) {
                            typeUrlPrefix = "type.googleapis.com";
                        }
                        return typeUrlPrefix + "/proto.Response.Exchange.Transaction.Argument";
                    };

                    Argument.List = (function() {

                        /**
                         * Properties of a List.
                         * @memberof proto.Response.Exchange.Transaction.Argument
                         * @interface IList
                         * @property {Array.<proto.Response.Exchange.Transaction.IArgument>|null} [items] List items
                         */

                        /**
                         * Constructs a new List.
                         * @memberof proto.Response.Exchange.Transaction.Argument
                         * @classdesc Represents a List.
                         * @implements IList
                         * @constructor
                         * @param {proto.Response.Exchange.Transaction.Argument.IList=} [properties] Properties to set
                         */
                        function List(properties) {
                            this.items = [];
                            if (properties)
                                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * List items.
                         * @member {Array.<proto.Response.Exchange.Transaction.IArgument>} items
                         * @memberof proto.Response.Exchange.Transaction.Argument.List
                         * @instance
                         */
                        List.prototype.items = $util.emptyArray;

                        /**
                         * Creates a new List instance using the specified properties.
                         * @function create
                         * @memberof proto.Response.Exchange.Transaction.Argument.List
                         * @static
                         * @param {proto.Response.Exchange.Transaction.Argument.IList=} [properties] Properties to set
                         * @returns {proto.Response.Exchange.Transaction.Argument.List} List instance
                         */
                        List.create = function create(properties) {
                            return new List(properties);
                        };

                        /**
                         * Encodes the specified List message. Does not implicitly {@link proto.Response.Exchange.Transaction.Argument.List.verify|verify} messages.
                         * @function encode
                         * @memberof proto.Response.Exchange.Transaction.Argument.List
                         * @static
                         * @param {proto.Response.Exchange.Transaction.Argument.IList} message List message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        List.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.items != null && message.items.length)
                                for (let i = 0; i < message.items.length; ++i)
                                    $root.proto.Response.Exchange.Transaction.Argument.encode(message.items[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Decodes a List message from the specified reader or buffer.
                         * @function decode
                         * @memberof proto.Response.Exchange.Transaction.Argument.List
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {proto.Response.Exchange.Transaction.Argument.List} List
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        List.decode = function decode(reader, length, error) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Response.Exchange.Transaction.Argument.List();
                            while (reader.pos < end) {
                                let tag = reader.uint32();
                                if (tag === error)
                                    break;
                                switch (tag >>> 3) {
                                case 1: {
                                        if (!(message.items && message.items.length))
                                            message.items = [];
                                        message.items.push($root.proto.Response.Exchange.Transaction.Argument.decode(reader, reader.uint32()));
                                        break;
                                    }
                                default:
                                    reader.skipType(tag & 7);
                                    break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Gets the default type url for List
                         * @function getTypeUrl
                         * @memberof proto.Response.Exchange.Transaction.Argument.List
                         * @static
                         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                         * @returns {string} The default type url
                         */
                        List.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                            if (typeUrlPrefix === undefined) {
                                typeUrlPrefix = "type.googleapis.com";
                            }
                            return typeUrlPrefix + "/proto.Response.Exchange.Transaction.Argument.List";
                        };

                        return List;
                    })();

                    return Argument;
                })();

                Transaction.Call = (function() {

                    /**
                     * Properties of a Call.
                     * @memberof proto.Response.Exchange.Transaction
                     * @interface ICall
                     * @property {string|null} ["function"] Call function
                     * @property {Array.<proto.Response.Exchange.Transaction.IArgument>|null} ["arguments"] Call arguments
                     */

                    /**
                     * Constructs a new Call.
                     * @memberof proto.Response.Exchange.Transaction
                     * @classdesc Represents a Call.
                     * @implements ICall
                     * @constructor
                     * @param {proto.Response.Exchange.Transaction.ICall=} [properties] Properties to set
                     */
                    function Call(properties) {
                        this["arguments"] = [];
                        if (properties)
                            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }

                    /**
                     * Call function.
                     * @member {string} function
                     * @memberof proto.Response.Exchange.Transaction.Call
                     * @instance
                     */
                    Call.prototype["function"] = "";

                    /**
                     * Call arguments.
                     * @member {Array.<proto.Response.Exchange.Transaction.IArgument>} arguments
                     * @memberof proto.Response.Exchange.Transaction.Call
                     * @instance
                     */
                    Call.prototype["arguments"] = $util.emptyArray;

                    /**
                     * Creates a new Call instance using the specified properties.
                     * @function create
                     * @memberof proto.Response.Exchange.Transaction.Call
                     * @static
                     * @param {proto.Response.Exchange.Transaction.ICall=} [properties] Properties to set
                     * @returns {proto.Response.Exchange.Transaction.Call} Call instance
                     */
                    Call.create = function create(properties) {
                        return new Call(properties);
                    };

                    /**
                     * Encodes the specified Call message. Does not implicitly {@link proto.Response.Exchange.Transaction.Call.verify|verify} messages.
                     * @function encode
                     * @memberof proto.Response.Exchange.Transaction.Call
                     * @static
                     * @param {proto.Response.Exchange.Transaction.ICall} message Call message or plain object to encode
                     * @param {$protobuf.Writer} [writer] Writer to encode to
                     * @returns {$protobuf.Writer} Writer
                     */
                    Call.encode = function encode(message, writer) {
                        if (!writer)
                            writer = $Writer.create();
                        if (message["function"] != null && Object.hasOwnProperty.call(message, "function"))
                            writer.uint32(/* id 1, wireType 2 =*/10).string(message["function"]);
                        if (message["arguments"] != null && message["arguments"].length)
                            for (let i = 0; i < message["arguments"].length; ++i)
                                $root.proto.Response.Exchange.Transaction.Argument.encode(message["arguments"][i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                        return writer;
                    };

                    /**
                     * Decodes a Call message from the specified reader or buffer.
                     * @function decode
                     * @memberof proto.Response.Exchange.Transaction.Call
                     * @static
                     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                     * @param {number} [length] Message length if known beforehand
                     * @returns {proto.Response.Exchange.Transaction.Call} Call
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    Call.decode = function decode(reader, length, error) {
                        if (!(reader instanceof $Reader))
                            reader = $Reader.create(reader);
                        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Response.Exchange.Transaction.Call();
                        while (reader.pos < end) {
                            let tag = reader.uint32();
                            if (tag === error)
                                break;
                            switch (tag >>> 3) {
                            case 1: {
                                    message["function"] = reader.string();
                                    break;
                                }
                            case 2: {
                                    if (!(message["arguments"] && message["arguments"].length))
                                        message["arguments"] = [];
                                    message["arguments"].push($root.proto.Response.Exchange.Transaction.Argument.decode(reader, reader.uint32()));
                                    break;
                                }
                            default:
                                reader.skipType(tag & 7);
                                break;
                            }
                        }
                        return message;
                    };

                    /**
                     * Gets the default type url for Call
                     * @function getTypeUrl
                     * @memberof proto.Response.Exchange.Transaction.Call
                     * @static
                     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns {string} The default type url
                     */
                    Call.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                        if (typeUrlPrefix === undefined) {
                            typeUrlPrefix = "type.googleapis.com";
                        }
                        return typeUrlPrefix + "/proto.Response.Exchange.Transaction.Call";
                    };

                    return Call;
                })();

                return Transaction;
            })();

            Exchange.Data = (function() {

                /**
                 * Properties of a Data.
                 * @memberof proto.Response.Exchange
                 * @interface IData
                 * @property {Long|null} [amount] Data amount
                 * @property {number|null} [priceImpact] Data priceImpact
                 * @property {proto.Response.Exchange.ITransaction|null} [transaction] Data transaction
                 * @property {Long|null} [minReceived] Data minReceived
                 * @property {Long|null} [originalAmount] Data originalAmount
                 * @property {Long|null} [originalMinReceived] Data originalMinReceived
                 */

                /**
                 * Constructs a new Data.
                 * @memberof proto.Response.Exchange
                 * @classdesc Represents a Data.
                 * @implements IData
                 * @constructor
                 * @param {proto.Response.Exchange.IData=} [properties] Properties to set
                 */
                function Data(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Data amount.
                 * @member {Long} amount
                 * @memberof proto.Response.Exchange.Data
                 * @instance
                 */
                Data.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * Data priceImpact.
                 * @member {number} priceImpact
                 * @memberof proto.Response.Exchange.Data
                 * @instance
                 */
                Data.prototype.priceImpact = 0;

                /**
                 * Data transaction.
                 * @member {proto.Response.Exchange.ITransaction|null|undefined} transaction
                 * @memberof proto.Response.Exchange.Data
                 * @instance
                 */
                Data.prototype.transaction = null;

                /**
                 * Data minReceived.
                 * @member {Long} minReceived
                 * @memberof proto.Response.Exchange.Data
                 * @instance
                 */
                Data.prototype.minReceived = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * Data originalAmount.
                 * @member {Long} originalAmount
                 * @memberof proto.Response.Exchange.Data
                 * @instance
                 */
                Data.prototype.originalAmount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * Data originalMinReceived.
                 * @member {Long} originalMinReceived
                 * @memberof proto.Response.Exchange.Data
                 * @instance
                 */
                Data.prototype.originalMinReceived = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * Creates a new Data instance using the specified properties.
                 * @function create
                 * @memberof proto.Response.Exchange.Data
                 * @static
                 * @param {proto.Response.Exchange.IData=} [properties] Properties to set
                 * @returns {proto.Response.Exchange.Data} Data instance
                 */
                Data.create = function create(properties) {
                    return new Data(properties);
                };

                /**
                 * Encodes the specified Data message. Does not implicitly {@link proto.Response.Exchange.Data.verify|verify} messages.
                 * @function encode
                 * @memberof proto.Response.Exchange.Data
                 * @static
                 * @param {proto.Response.Exchange.IData} message Data message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Data.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.amount != null && Object.hasOwnProperty.call(message, "amount"))
                        writer.uint32(/* id 1, wireType 0 =*/8).int64(message.amount);
                    if (message.priceImpact != null && Object.hasOwnProperty.call(message, "priceImpact"))
                        writer.uint32(/* id 3, wireType 1 =*/25).double(message.priceImpact);
                    if (message.transaction != null && Object.hasOwnProperty.call(message, "transaction"))
                        $root.proto.Response.Exchange.Transaction.encode(message.transaction, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                    if (message.minReceived != null && Object.hasOwnProperty.call(message, "minReceived"))
                        writer.uint32(/* id 6, wireType 0 =*/48).int64(message.minReceived);
                    if (message.originalAmount != null && Object.hasOwnProperty.call(message, "originalAmount"))
                        writer.uint32(/* id 7, wireType 0 =*/56).int64(message.originalAmount);
                    if (message.originalMinReceived != null && Object.hasOwnProperty.call(message, "originalMinReceived"))
                        writer.uint32(/* id 8, wireType 0 =*/64).int64(message.originalMinReceived);
                    return writer;
                };

                /**
                 * Decodes a Data message from the specified reader or buffer.
                 * @function decode
                 * @memberof proto.Response.Exchange.Data
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {proto.Response.Exchange.Data} Data
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Data.decode = function decode(reader, length, error) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Response.Exchange.Data();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        if (tag === error)
                            break;
                        switch (tag >>> 3) {
                        case 1: {
                                message.amount = reader.int64();
                                break;
                            }
                        case 3: {
                                message.priceImpact = reader.double();
                                break;
                            }
                        case 5: {
                                message.transaction = $root.proto.Response.Exchange.Transaction.decode(reader, reader.uint32());
                                break;
                            }
                        case 6: {
                                message.minReceived = reader.int64();
                                break;
                            }
                        case 7: {
                                message.originalAmount = reader.int64();
                                break;
                            }
                        case 8: {
                                message.originalMinReceived = reader.int64();
                                break;
                            }
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Gets the default type url for Data
                 * @function getTypeUrl
                 * @memberof proto.Response.Exchange.Data
                 * @static
                 * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns {string} The default type url
                 */
                Data.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                    if (typeUrlPrefix === undefined) {
                        typeUrlPrefix = "type.googleapis.com";
                    }
                    return typeUrlPrefix + "/proto.Response.Exchange.Data";
                };

                return Data;
            })();

            return Exchange;
        })();

        return Response;
    })();

    return proto;
})();

export { $root as default };
