import { type TLong } from '../../interface';
import request from '../../tools/request';
import { type IBlockHeader } from '../blocks';

/**
 * GET /blocks/headers/finalized
 * Last finalized block header
 * @param base
 * @param options
 */
export function fetchFinalized(base: string, options: RequestInit = {}): Promise<IBlockHeader> {
  return request({
    base,
    options,
    url: '/blocks/headers/finalized',
  });
}

/**
 * GET last finalized block height
 * @param base
 * @param options
 */
export function fetchFinalizedHeight(
  base: string,
  options: RequestInit = {},
): Promise<{ height: number }> {
  return request({
    base,
    options,
    url: '/blocks/height/finalized',
  });
}

/**
 * GET finalized block height at
 * @param base
 * @param height
 * @param options
 */
export function fetchFinalizedHeightAt(
  base: string,
  height: number,
  options: RequestInit = {},
): Promise<{ height: number }> {
  return request({
    base,
    options,
    url: `/blocks/finalized/at/${height}`,
  });
}

/**
 * GET /generators/at/{height}
 * Committed generators list at height
 * @param base
 * @param height
 * @param options
 */
export function fetchCommittedGeneratorsAt(
  base: string,
  height: number,
  options: RequestInit = {},
): Promise<Array<ICommittedGenerator>> {
  return request({
    base,
    options,
    url: `/generators/at/${height}`,
  });
}

/**
 * Get committed generator index for provided address.
 * Returns index from 0, or -1 when address is missing in the list.
 * @param base
 * @param height
 * @param address
 * @param options
 */
export function fetchCommittedGeneratorIndex(
  base: string,
  height: number,
  address: string,
  options: RequestInit = {},
): Promise<number> {
  return fetchCommittedGeneratorsAt(base, height, options).then((list) => {
    const index = list.findIndex((item) => item.address === address);
    return index >= 0 ? index : -1;
  });
}

/**
 * GET /blockchain/finality
 * Current finality state including generation periods and committed generators.
 * @param base
 * @param options
 */
export function fetchFinalityInfo(base: string, options: RequestInit = {}): Promise<IFinalityInfo> {
  return request({
    base,
    options,
    url: '/blockchain/finality',
  });
}

export interface IGenerationPeriod {
  start: number;
  end: number;
}

export interface IFinalityInfo {
  height: number;
  finalizedHeight: number;
  currentGenerationPeriod?: IGenerationPeriod;
  currentGenerators: ICommittedGenerator[];
  nextGenerationPeriod?: IGenerationPeriod;
  nextGenerators: INextCommittedGenerator[];
}

export interface ICommittedGenerator {
  address: string;
  balance: TLong;
  transactionId: string;
  conflictHeight?: number;
}

export interface INextCommittedGenerator {
  address: string;
  transactionId: string;
}
