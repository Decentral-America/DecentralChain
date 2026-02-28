import {base16Encode, base58Decode} from '@decentralchain/ts-lib-crypto'

export default function dccAddress2eth(dccAddress: string): string {

    const rawBytes = base58Decode(dccAddress);

    const bytes = rawBytes.slice(2, rawBytes.byteLength - 4)

    return `0x${base16Encode(bytes)}`;
}
