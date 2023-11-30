//const seed1 = 'alter bar cycle pioneer library eye calm soft swing motion limit taste supreme afford caution' //complex account

<<<<<<< HEAD
import {broadcast, exchange, order} from '../../src'
import {Seed} from '../../src/seedUtils'
import {publicKey} from '@waves/ts-lib-crypto'
import {txToProtoBytes} from '../../src/proto-serialize'

var fs = require('fs')

=======
<<<<<<< HEAD
import {burn, exchange, IOrderParams, order, waitForTx} from '../../src'
import {Seed} from "../../src/seedUtils"
=======
import {burn, exchange, order} from '../../src'
>>>>>>> master
import {
    base16Decode,
    base58Decode,
    base58Encode,
    base64Decode,
    base64Encode,
    decryptSeed,
<<<<<<< HEAD
    privateKey, publicKey
=======
    privateKey
>>>>>>> master
} from '@waves/ts-lib-crypto'

var fs = require("fs")
import {protoBytesToSignedTx, protoBytesToTx, txToProtoBytes} from '../../src/proto-serialize'
<<<<<<< HEAD
import {broadcast} from '../../src'
import {API_BASE, TIMEOUT} from '../integration/config'
=======
import {broadcast} from '@waves/node-api-js/es/api-node/transactions'
>>>>>>> master
>>>>>>> f33083a0 (updated dependencies)

const seed1 = 'shoe used festival regular fancy electric powder symptom stool physical cabbage need accuse silly ring' //plain acc

const seed2 = 'next one puppy history bag vanish conduct lion royal dentist reject usual story invite leader'


// scripted asset: "DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK",

describe('exchange', () => {

    it('Should build exchange tx', () => {
        const order1 = {
            version: 4,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 4,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 'T',
            fee: 700000,
            version: 3,
            proofs: [],
        }

        // @ts-ignore
        console.log(exchange({...txOk}, seed1))
    })

    it('Should build exchange tx ver1-1-1', () => {
        const order1 = {
            version: 1,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 1,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 'T',
            fee: 700000,
<<<<<<< HEAD
            version: 1,
=======
            version: 1
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk, chainId: txOk.chainId.charCodeAt()})
    })


    it('Should build exchange tx ver2-1-1', () => {
        const order1 = {
            version: 1,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 1,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 2,
=======
            version: 2
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver2-1-2', () => {
        const order1 = {
            version: 1,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 2,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 2,
=======
            version: 2
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver2-2-2', () => {
        const order1 = {
            version: 2,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 2,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 2,
=======
            version: 2
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver2-1-3', () => {
        const order1 = {
            version: 1,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 3,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 2,
=======
            version: 2
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver2-2-3', () => {
        const order1 = {
            version: 2,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 3,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 2,
=======
            version: 2
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver3-4-4', () => {
        const order1 = {
            version: 4,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 4,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 3,
=======
            version: 3
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver3-1-1', () => {
        const order1 = {
            version: 1,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 1,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 3,
=======
            version: 3
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver3-1-2', () => {
        const order1 = {
            version: 1,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 2,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 3,
=======
            version: 3
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver3-2-2', () => {
        const order1 = {
            version: 2,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 2,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 3,
=======
            version: 3
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver3-2-3', () => {
        const order1 = {
            version: 2,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 3,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 3,
=======
            version: 3
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver3-3-3', () => {
        const order1 = {
            version: 3,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 3,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
            version: 3
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        //console.log(
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })

    it('Should build exchange tx ver3-3-4', async () => {
        const order1 = {
            version: 3,
            amount: 100,
            price: 500000000,
            matcherFee: 100,
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'buy' as 'buy',
        }

        const order2 = {
            version: 4,
            matcherFee: 100,
            matcherFeeAssetId: 'DvXjujyWbi7ARdExyayN42gcfBKGTBRgYYyPWMxy5grK',
            amount: 100,
            price: 500000000,
<<<<<<< HEAD
            amountAsset: '3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg',
=======
            amountAsset: "3JmaWyFqWo8YSA8x3DXCBUW7veesxacvKx19dMv7wTMg",
>>>>>>> f33083a0 (updated dependencies)
            priceAsset: null,
            matcherPublicKey: 'BvJEWY79uQEFetuyiZAF5U4yjPioMj9J6ZrF9uTNfe3E',
            orderType: 'sell' as 'sell',
        }


        const txOk = {
            order1: order(order1, seed1),
            order2: order(order2, seed2),
            price: 500000000,
            amount: 100,
            buyMatcherFee: 100,
            sellMatcherFee: 100,
            chainId: 84,
            fee: 700000,
<<<<<<< HEAD
            version: 3,
=======
            version: 3
>>>>>>> f33083a0 (updated dependencies)
        }

        // @ts-ignore
        const tx = exchange({...txOk}, seed1)
        expect(tx).toMatchObject({...txOk})
    })
<<<<<<< HEAD


    it('', async () => {
        const nodeUrl = 'https://nodes-testnet.wavesnodes.com/'
        const buy_seed = 'acc0'
        const sell_seed = 'acc0'
        const matcher_seed = 'acc0'

        const buy_params = {
            chainId: 'T',
            version: 4,
            amount: 123,
            price: 12_300_000,
            priceAsset: '2jwWMYV12tVeAhMyKy8HphyaMAgQHJL2fWzZgYNCHkNk',
            amountAsset: null,
            matcherPublicKey: publicKey(matcher_seed),
            orderType: 'buy' as 'buy',
            matcherFee: 300000,
            matcherFeeAssetId: null,
            priceMode: 'fixedDecimals' as 'fixedDecimals',
            attachment: 'base64:dGVzdA==',
        }

        const sell_params = {
            chainId: 'T',
            version: 3,
            amount: 123,
            price: 123,
            priceAsset: '2jwWMYV12tVeAhMyKy8HphyaMAgQHJL2fWzZgYNCHkNk',
            amountAsset: null,
            matcherPublicKey: publicKey(matcher_seed),
            orderType: 'sell' as 'sell',
            matcherFee: 300000,
            matcherFeeAssetId: null,
          //  priceMode: 'fixedDecimals',
=======
<<<<<<< HEAD

    it('', async () => {
        const nodeUrl = 'https://nodes-testnet.wavesnodes.com/'
        const buy_seed = 'reject cheese exist bracket kitten body dress piece meadow tuition involve slight estate front fog'
        const sell_seed = 'reject cheese exist bracket kitten body dress piece meadow tuition involve slight estate front fog'
        const matcher_seed = 'reject cheese exist bracket kitten body dress piece meadow tuition involve slight estate front fog'

        const buy_params = {
            chainId: 84,
            version: 4,
            amount: 123,
            price: 123,
            priceAsset: '25FEqEjRkqK6yCkiT7Lz6SAYz7gUFCtxfCChnrVFD5AT',
            amountAsset: null,
            matcherPublicKey: publicKey(matcher_seed),
            orderType: 'buy',
            matcherFee: 300000,
            matcherFeeAssetId: null,
            priceMode: 'fixedDecimals'
        }

        const sell_params = {
            chainId: 84,
            version: 4,
            amount: 123,
            price: 123,
            priceAsset: '25FEqEjRkqK6yCkiT7Lz6SAYz7gUFCtxfCChnrVFD5AT',
            amountAsset: null,
            matcherPublicKey: publicKey(matcher_seed),
            orderType: 'sell',
            matcherFee: 300000,
            matcherFeeAssetId: null,
            priceMode: 'fixedDecimals'
>>>>>>> f33083a0 (updated dependencies)
        }

        const buyOrder = order(buy_params, buy_seed)
        const sellOrder = order(sell_params, sell_seed)

        const exchange_params = {
<<<<<<< HEAD
            chainId: 'T',
=======
            chainId: 84,
>>>>>>> f33083a0 (updated dependencies)
            type: 7,
            version: 3,
            order1: buyOrder,
            order2: sellOrder,
<<<<<<< HEAD
            amount: 100,
            price: 12_300_000,
            buyMatcherFee: 300000,
            sellMatcherFee: 300000,
            fee: 300000,
            feeAssetId: null,
=======
            amount: 10000000,
            price: 7000,
            buyMatcherFee: 300000,
            sellMatcherFee: 300000,
            fee: 300000,
            feeAssetId: null
>>>>>>> f33083a0 (updated dependencies)
        }

        const exchangeTx = exchange(exchange_params, matcher_seed)
        console.log('exchangeTx', JSON.stringify(exchangeTx, undefined, ' '))
        const tx = await broadcast(exchangeTx, nodeUrl).then(resp => console.log(resp)).catch(rej => console.log(rej))
        console.log('tx', JSON.stringify(tx, undefined, ' '))
<<<<<<< HEAD

    })

=======
        // await waitForTx(mtt.id, {apiBase: API_BASE, timeout: TIMEOUT})
    })
>>>>>>> f33083a0 (updated dependencies)
    it('ex', async () => {
            const fs = require('fs')

            const nodeUrl = 'https://nodes-testnet.wavesnodes.com'
            const buy_seed = 'reject cheese exist bracket kitten body dress piece meadow tuition involve slight estate front fog'
            const sell_seed = 'reject cheese exist bracket kitten body dress piece meadow tuition involve slight estate front fog'
            const matcher_seed = 'reject cheese exist bracket kitten body dress piece meadow tuition involve slight estate front fog'

            const mSeed = new Seed(matcher_seed, 'T')
            console.log(mSeed)
            const mPub = mSeed.keyPair.publicKey

            const t = Date.now()
            const buy_params = {
                chainId: 84,
                version: 4,
                amount: 123,
                price: 123,
                priceAsset: '25FEqEjRkqK6yCkiT7Lz6SAYz7gUFCtxfCChnrVFD5AT',
                amountAsset: null,
                matcherPublicKey: publicKey(matcher_seed),
<<<<<<< HEAD
                orderType: 'buy' as 'buy',
                matcherFee: 300000,
                matcherFeeAssetId: null,
                priceMode: 'fixedDecimals' as 'fixedDecimals',
=======
                orderType: 'buy',
                matcherFee: 300000,
                matcherFeeAssetId: null,
                priceMode: 'fixedDecimals'
>>>>>>> f33083a0 (updated dependencies)
            }

            const sell_params = {
                chainId: 'T',
                version: 4,
                amount: 123,
                price: 123,
                priceAsset: '25FEqEjRkqK6yCkiT7Lz6SAYz7gUFCtxfCChnrVFD5AT',
                amountAsset: null,
                matcherPublicKey: publicKey(matcher_seed),
<<<<<<< HEAD
                orderType: 'sell' as 'sell',
                matcherFee: 300000,
                timestamp: t,
                expiration: t + 29 * 24 * 60 * 60 * 1000,
                priceMode: 'fixedDecimals' as 'fixedDecimals',
=======
                orderType: 'sell',
                matcherFee: 300000,
                timestamp: t,
                expiration: t + 29 * 24 * 60 * 60 * 1000,
                priceMode: 'fixedDecimals'
>>>>>>> f33083a0 (updated dependencies)
            }


            const sellOrder = order(sell_params, sell_seed)
<<<<<<< HEAD
            const buyOrder = order(buy_params, buy_seed)
=======
            // console.log('sellOrder', sellOrder)
            const buyOrder = order(buy_params, buy_seed)
            // console.log('buyOrder', buyOrder)
>>>>>>> f33083a0 (updated dependencies)

            const exchange_params = {
                chainId: 84,
                type: 7,
                version: 3,
                order1: buyOrder,
                order2: sellOrder,
                price: 123,
                amount: 123,
                buyMatcherFee: 300000,
                sellMatcherFee: 300000,
<<<<<<< HEAD
                fee: 300000,
=======
                fee: 300000
>>>>>>> f33083a0 (updated dependencies)
            }

            const exchangeTx = exchange(exchange_params, matcher_seed)
        console.log(exchangeTx)
            await broadcast(exchangeTx, nodeUrl)//.then(resp => console.log(resp)).catch(rej => console.log(rej))

<<<<<<< HEAD
//      const txbytes = txToProtoBytes(exchangeTx)
//      fs.writeFile('bytes.txt', txbytes, function(err, result){
// 	    if(err) console.log('error', err);
// });
        }, 60000
    )

=======
            const txbytes = txToProtoBytes(exchangeTx)
// fs.writeFile('bytes.txt', txbytes, function(err, result){
// 	if(err) console.log('error', err);
// });
        }, 60000
    )
=======
>>>>>>> master
>>>>>>> f33083a0 (updated dependencies)
})
