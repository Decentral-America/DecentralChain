import { type IssueTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TWithPartialFee } from '../types/index.js';
import { getCoins, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const issue = factory<IDCCGuiIssue, TWithPartialFee<IssueTransaction<string>>>({
  ...getDefaultTransform(),
  name: prop('name'),
  description: prop('description'),
  decimals: (data) => prop('decimals', data) ?? prop('precision', data) ?? 0,
  quantity: pipe<IDCCGuiIssue, TLong, string>(prop('quantity'), getCoins),
  reissuable: prop('reissuable'),
  chainId: prop('chainId'),
  script: prop('script'),
});

interface IIssue extends IDefaultGuiTx<typeof TYPES.ISSUE> {
  name: string;
  description: string;
  quantity: TLong;
  precision?: number | undefined;
  decimals?: number | undefined;
  reissuable: boolean;
  chainId: number;
  script?: string | null | undefined;
}

export type IDCCGuiIssue = (IIssue & { decimals: number }) | (IIssue & { precision: number });
