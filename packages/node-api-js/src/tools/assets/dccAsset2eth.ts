import {base16Encode, base58Decode} from '@decentralchain/ts-lib-crypto'

export default function dccAsset2Eth(dccAsset: string): string {

    const rawBytes = base58Decode(dccAsset);

    const bytes = rawBytes.slice(0, 20)

    return `0x${base16Encode(bytes)}`;
}
