import { renameKeys } from 'ramda';
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

const bufferToETHHex = (b: Buffer) => `0x${b.toString('hex')}`;

type TxRow = Record<string, unknown>;

const _transform = (obj: TxRow): TxRow => {
  const step1 = renameKeys({ function_name: 'payload' }, obj) as TxRow;
  const step2: TxRow = {
    ...step1,
    bytes: bufferToETHHex(step1['bytes'] as Buffer),
    payload: functionNameToPayload(step1['payload'] as string | null),
  };
  return transformTxInfo(step2);
};

export default _transform as (obj: TxRow) => any;
