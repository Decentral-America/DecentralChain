import {base16Decode, base58Encode} from '@decentralchain/ts-lib-crypto';

export default function ethTxId2dcc(ethTxId: string): string {
    let id = ethTxId
    if (ethTxId.startsWith('0x')) id = ethTxId.slice(2)
    return base58Encode(base16Decode(id));
}
