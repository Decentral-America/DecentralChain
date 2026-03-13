import {
  type InvokeScriptCall,
  type InvokeScriptCallArgument,
  type InvokeScriptPayment,
  type InvokeScriptTransaction,
} from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { defaultTo, getAssetId, getCoins, ifElse, map, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

const isNull = (data: unknown) => data == null;
const defaultNull = () => null;

const processArgument = (
  data: InvokeScriptCallArgument<TLong>,
): InvokeScriptCallArgument<string> => {
  if (data.type === 'integer') {
    return { type: data.type, value: getCoins(data.value) };
  }
  // Non-integer args (string, binary, boolean, list) don't contain LONG values
  // at runtime. The Phantom<'LONG', TLong> on list args is purely structural.
  return data as unknown as InvokeScriptCallArgument<string>;
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
  IDCCGuiInvokeScript,
  TWithPartialFee<InvokeScriptTransaction<string>>
>({
  ...getDefaultTransform(),
  call: pipe<
    IDCCGuiInvokeScript,
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
  feeAssetId: pipe<IDCCGuiInvokeScript, TMoney | TLong | undefined | null, string | null, string>(
    prop('fee'),
    getAssetId,
    defaultTo('DCC'),
  ),
  payment: pipe<
    IDCCGuiInvokeScript,
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

export interface IDCCGuiInvokeScript extends IDefaultGuiTx<typeof TYPES.INVOKE_SCRIPT> {
  dApp: string;
  call?: InvokeScriptCall<TLong> | null | undefined;
  payment?: TMoney[] | null | undefined;
  feeAssetId?: string | undefined;
  chainId: number;
}
