import * as utilityF from '../src/nodeInteraction'
import {data} from '../src'
import {broadcast} from '../src/nodeInteraction'
import {address, randomSeed} from '@waves/ts-lib-crypto'
import {CHAIN_ID} from './integration/config'

const chainId = '!'
const apiBase = 'https://testnet-node.decentralchain.io/'

describe('Node interaction utility functions', () => {
    jest.setTimeout(60000)
    it('should send tx to node', async () => {
        const dataParams = {
            version: 1,
            data: [
                {
                    key: 'oneTwo',
                    value: false,
                },
                {
                    key: 'twoThree',
                    value: 2,
                },
                {
                    key: 'three',
                    value: Uint8Array.from([1, 2, 3, 4, 5, 6]),
                },
            ],
            timestamp: 100000,
            chainId: chainId,
        }
        const result = data(dataParams, 'seed seed')

        await expect(broadcast(result, apiBase)).rejects.toMatchObject({'error': 303})
    })

    it('Should get current height', async () => {
        return expect(utilityF.currentHeight(apiBase)).resolves.toBeGreaterThan(0)
    })

    it('Should get transaction by id', async () => {
        const id = '54xbNb5yN2WYNxi39sqESwzp8xSJijmD2Fa5hww12pH4'
        const tx = await utilityF.transactionById(id, apiBase)
        expect(tx.id).toEqual(id)
    })

    it('Should throw on not existing tx', async () => {
        const id = 'EdhLuhUMX22gKxGxKZxLcVsygMC9nBCBbSuAxFbZumQ'
        expect(utilityF.transactionById(id, apiBase)).rejects.toMatchObject({error: 311})
    })

    it('Should wait 1 Block', async () => {
        await utilityF.waitNBlocks(1, {apiBase})
    }, 120000)


    it('Should get balance', async () => {
        await expect(utilityF.balance('3XXdcpdWv3HM6bqbAAcbxSbFGmsAbd5RzE3', apiBase)).resolves.not.toBeNaN()
        await expect(utilityF.balance('bad address', apiBase)).rejects.toMatchObject({error: 199})
    }, 5000)

    it('Should get balanceDetails', async () => {
        await expect(utilityF.balanceDetails('3XXdcpdWv3HM6bqbAAcbxSbFGmsAbd5RzE3', apiBase)).resolves.not.toBeFalsy()
    }, 5000)

    it('Should get asset balance', async () => {
        await expect(utilityF.assetBalance('GZajSeUtcHMeBKc1n2roepZNkryw1rPN8R5LkmKwgR4o', '3XXdcpdWv3HM6bqbAAcbxSbFGmsAbd5RzE3', apiBase)).resolves.not.toBeFalsy()
    }, 5000)

    it('Should get NFT balance', async () => {
        await expect(utilityF.assetBalance('2HgvJjAJFug1QriGTJPLK1AM2Yv3GqYnDLpUjQprf1Ut', '3Ms5T2C6pvqiZbMASjiJvPh9u57bQpcVLLp', apiBase)).resolves.toEqual(1)
    }, 5000)

    it('Should return correct error on invalid address for asset balance', async () => {
        const resp = utilityF.assetBalance('invalidAddress', 'bad address', apiBase)
        await expect(resp).rejects.toMatchObject({error: 199})
    }, 5000)

    it('Should get accountData ', async () => {
        const addr = address(randomSeed(), chainId)
        await expect(utilityF.accountData(addr, apiBase)).resolves.not.toBeFalsy()
    }, 5000)

    it('Should get accountData and filter it by regexp', async () => {
        const data = await utilityF.accountData({
            address: '3XrUtvRZ6LLU8F2wwkuDffwTuLUNcpnjthB',
            match: 'data_provider.*',
        }, apiBase)
        expect(Object.keys(data).length).toEqual(7)
    }, 5000)

    it('Should get accountData by key ', async () => {
        const data = await utilityF.accountDataByKey('data_provider_email', '3XrUtvRZ6LLU8F2wwkuDffwTuLUNcpnjthB', apiBase)
        expect(data).not.toBeFalsy()
    }, 5000)

    it('Should get accountData by key and return null on no data', async () => {
        const data = await utilityF.accountDataByKey('test23', '3XXdcpdWv3HM6bqbAAcbxSbFGmsAbd5RzE3', apiBase)
        expect(data).toBeNull()
    }, 5000)

    it('Should give correct error on invalid address', async () => {
        const data = utilityF.accountDataByKey('test23', 'invalidAddress', apiBase)
        await expect(data).rejects.toMatchObject({error: 199})
    }, 5000)

    it('Should get account script info', async () => {
        const data = await utilityF.scriptInfo('3XVVT9TLt9cthFCxdBfgT1kp56d5E5reNak', apiBase)
        expect(data).toMatchObject({extraFee: 0})
    }, 5000)

    it('Should get account script meta', async () => {
<<<<<<< HEAD
        const data = await utilityF.scriptMeta('3N749utyWVhhnCqWh6hbqsq5zMvqVSanamR', apiBase)
        expect(data).toMatchObject({address: '3N749utyWVhhnCqWh6hbqsq5zMvqVSanamR'})
=======
        const data = await utilityF.scriptMeta('3XVVT9TLt9cthFCxdBfgT1kp56d5E5reNak', apiBase)
        console.log(data)
        expect(data).toMatchObject({address: '3XVVT9TLt9cthFCxdBfgT1kp56d5E5reNak'})
>>>>>>> 697d643a (minor fixes)
    }, 5000)


    it('Should get invokeTx state changes', async () => {
        const data = await utilityF.stateChanges('31bL25RBNJmsFdJqPKTKgXoR5eJziYS8ZkXRCahyE5A6', apiBase)
        expect(Array.isArray(data.data)).toBe(true)
    }, 5000)
})
