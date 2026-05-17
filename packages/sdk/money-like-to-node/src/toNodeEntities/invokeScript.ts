import {
  type InvokeScriptCall,
  type InvokeScriptCallArgument,
  type InvokeScriptPayment,
  type InvokeScriptTransaction,
} from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { getAssetId, getCoins, ifElse, map, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

const isNull = (data: unknown) => data == null;
const defaultNull = () => null;

const processArgument = (
  data: InvokeScriptCallArgument<TLong>,
): InvokeScriptCallArgument<string> => {
  if (data.type === 'integer') {
    return { type: data.type, value: getCoins(data.value) };
  }
  if (data.type === 'list') {
    return { type: data.type, value: data.value.map(processArgument) };
  }
  return data;
};

const processCall = factory<InvokeScriptCall<TLong>, InvokeScriptCall<string>>({
  args: pipe<
    InvokeScriptCall<TLong>,
    InvokeScriptCallArgument<TLong>[],
    InvokeScriptCallArgument<string>[]
  >(prop('args'), map(processArgument)),
  function: prop('function'),
});

const processPayment = factory<TMoney, InvokeScriptPayment<string>>({
  amount: getCoins,
  assetId: getAssetId,
});

export const invokeScript = factory<
  IClientInvokeScript,
  TWithPartialFee<InvokeScriptTransaction<string>>
>({
  ...getDefaultTransform(),
  call: pipe<
    IClientInvokeScript,
    InvokeScriptCall<TLong> | null | undefined,
    InvokeScriptCall<string> | null
  >(
    prop('call'),
    ifElse(
      isNull,
      defaultNull,
      // biome-ignore lint/style/noNonNullAssertion: asserted safe
      (call: InvokeScriptCall<TLong> | null | undefined) => processCall(call!),
    ),
  ),
  chainId: prop('chainId'),
  dApp: prop('dApp'),
  feeAssetId: pipe(prop('fee'), getAssetId),
  payment: pipe<
    IClientInvokeScript,
    TMoney[] | null | undefined,
    InvokeScriptPayment<string>[] | null
  >(
    prop('payment'),
    ifElse(
      isNull,
      defaultNull,
      // biome-ignore lint/style/noNonNullAssertion: asserted safe
      (payment: TMoney[] | null | undefined) => map(processPayment)(payment!),
    ),
  ),
});

export interface IClientInvokeScript extends IDefaultGuiTx<typeof TYPES.INVOKE_SCRIPT> {
  dApp: string;
  call?: InvokeScriptCall<TLong> | null | undefined;
  payment?: TMoney[] | null | undefined;
  feeAssetId?: string | undefined;
  chainId: number;
}
