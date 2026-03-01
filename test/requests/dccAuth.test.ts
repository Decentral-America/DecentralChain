import { dccAuth, serializeDccAuthData } from '../../src/requests/dccAuth'
import { verifyDccAuthData } from '../../src/general'
import { base58Encode, blake2b } from '@decentralchain/ts-lib-crypto'
import { address } from '@decentralchain/ts-lib-crypto'

describe('dccAuth', () => {
  const stringSeed = 'df3dd6d884714288a39af0bd973a1771c9f00f168cf040d6abb6a50dd5e055d8'

  it('dccAuth v0', () => {
    const p = { timestamp: Date.now(), publicKey: '' }
    const d = dccAuth(p, stringSeed)
    p.publicKey = d.publicKey
    expect(d).toMatchObject(p)
    expect(d.hash).toEqual(base58Encode(blake2b(serializeDccAuthData(d))))
    expect(verifyDccAuthData(d, p)).toBe(true)
  })

  it('Wrong auth v1', () => {
    const p = { timestamp: Date.now(), publicKey: 'Aa4Kz9N6njigV3T1WC6Buh841x4QTcpcPghrvaQK5zFJ' }
    const d = dccAuth(p, stringSeed)
    expect(d).toMatchObject(p)
    expect(d.hash).toEqual(base58Encode(blake2b(serializeDccAuthData(d))))
    const wrongData = { ...d, address: address('123') }
    expect(verifyDccAuthData(wrongData, p)).toBe(false)
  })
})
