import dccAddress2eth from "./tools/adresses/dccAddress2eth";
import ethAddress2dcc from "./tools/adresses/ethAddress2dcc";
import dccAsset2Eth from "./tools/assets/dccAsset2eth";
import ethTxId2dcc from "./tools/transactions/ethTxId2dcc";

import { create as createFn } from './create';

export {
    dccAddress2eth,
    ethAddress2dcc,
    dccAsset2Eth,
    ethTxId2dcc
};

export const create = createFn;

export default createFn;

export {
    ICallableFuncArgumentType,
    TCallableFuncArgumentsArray,
    TCallableFuncArgumentsRecord,
    TCallableFuncArguments,
} from './api-node/addresses';
