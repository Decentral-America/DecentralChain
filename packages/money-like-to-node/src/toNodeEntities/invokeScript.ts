import type {
  IInvokeScriptCall,
  IInvokeScriptPayment,
  IInvokeScriptTransaction,
  TInvokeScriptCallArgument,
} from '@decentralchain/ts-types';
import type { TLong, TMoney, TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { defaultTo, getAssetId, getCoins, map, pipe, prop, ifElse } from '../utils/index.js';

const isNull = (data: unknown) => data == null;
const defaultNull = () => null;

const processArgument = (
  data: TInvokeScriptCallArgument<TLong>,
): TInvokeScriptCallArgument<string> => {
  if (data.type === 'integer') {
    return { type: data.type, value: getCoins(data.value) };
  } else {
    return data;
  }
};

const processCall = factory<IInvokeScriptCall<TLong>, IInvokeScriptCall<string>>({
  function: prop('function'),
  args: pipe<
    IInvokeScriptCall<TLong>,
    TInvokeScriptCallArgument<TLong>[],
    TInvokeScriptCallArgument<string>[]
  >(prop('args'), map(processArgument)),
});

const processPayment = factory<TMoney, IInvokeScriptPayment<string>>({
  amount: getCoins,
  assetId: getAssetId,
});

export const invokeScript = factory<
  IDCCGuiInvokeScript,
  TWithPartialFee<IInvokeScriptTransaction<string>>
>({
  ...getDefaultTransform(),
  chainId: prop('chainId'),
  dApp: prop('dApp'),
  feeAssetId: pipe<IDCCGuiInvokeScript, TMoney | TLong | undefined | null, string | null, string>(
    prop('fee'),
    getAssetId,
    defaultTo('DCC'),
  ),
  call: pipe<
    IDCCGuiInvokeScript,
    IInvokeScriptCall<TLong> | null | undefined,
    IInvokeScriptCall<string> | null
  >(
    prop('call'),
    ifElse(
      isNull,
      defaultNull,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by isNull check
      (call: IInvokeScriptCall<TLong> | null | undefined) => processCall(call!),
    ),
  ),
  payment: pipe<
    IDCCGuiInvokeScript,
    TMoney[] | null | undefined,
    IInvokeScriptPayment<string>[] | null
  >(
    prop('payment'),
    ifElse(
      isNull,
      defaultNull,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by isNull check
      (payment: TMoney[] | null | undefined) => map(processPayment)(payment!),
    ),
  ),
});

export interface IDCCGuiInvokeScript extends IDefaultGuiTx<typeof TYPES.INVOKE_SCRIPT> {
  dApp: string;
  call?: IInvokeScriptCall<TLong> | null | undefined;
  payment?: TMoney[] | null | undefined;
  feeAssetId?: string | undefined;
  chainId: number;
}
