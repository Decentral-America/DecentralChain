import {crypto} from '../src'
import {expect, test} from 'vitest'

const seed = 'vast local exotic manage click stone boil analyst various truth swift decade cherry cram innocent'

const {address} = crypto({seed, output: 'Base58'})

test('address from embeded seed', () => {
    expect(address()).toBe('3JxsUjiKZxSjDxLa9m5rQ63ehFXoZNEkCtX')
})
