// @ts-nocheck
import { BigNumber } from '@decentralchain/data-entities';
import * as createParser from '@decentralchain/parse-json-bignumber';
import { LSNFormat } from '../http/types';
import { toBigNumber } from './bigNumber';

const parser = createParser<BigNumber>({
  isInstance: (bn: any): bn is BigNumber => BigNumber.isBigNumber(bn),
  parse: toBigNumber,
  strict: false,
  stringify: (bn: BigNumber) => bn.toFixed(),
});

export const parse = parser.parse;
export const stringify = (lsnFormat: LSNFormat) =>
  createParser<BigNumber>({
    isInstance: (bn: any): bn is BigNumber => BigNumber.isBigNumber(bn),
    parse: toBigNumber,
    strict: false,
    stringify: (bn: BigNumber) =>
      lsnFormat === LSNFormat.Number ? bn.toFixed() : `"${bn.toString()}"`,
  }).stringify;
