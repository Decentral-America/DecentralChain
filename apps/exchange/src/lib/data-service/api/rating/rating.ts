import { type IParsedRating } from '../../interface';

/**
 * Placeholder: Token rating API not yet implemented.
 * Returns empty array until the tokenrating backend endpoint is available.
 */
export function getAssetsRating(_assets: string | Array<string>): Promise<Array<IParsedRating>> {
  return Promise.resolve([]);
}
