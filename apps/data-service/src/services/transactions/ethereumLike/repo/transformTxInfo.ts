import { compose, evolve } from 'ramda';
import { renameKeys } from 'ramda-adjunct';
import { transformTxInfo } from '../../_common/transformTxInfo';
import { type EthereumLikeTxPayload } from './types';

const functionNameToPayload = (functionName: string | null): EthereumLikeTxPayload =>
  functionName === null
    ? { type: 'transfer' }
    : {
        call: {
          function: functionName,
        },
        type: 'invocation',
      };

const bufferToETHHex = (b: Buffer) => '0x' + b.toString('hex');

export default compose(
  transformTxInfo,
  evolve({
    bytes: bufferToETHHex,
    payload: functionNameToPayload,
  }) as any,
  renameKeys({ function_name: 'payload' }),
);
