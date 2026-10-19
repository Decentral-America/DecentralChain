export function configuredAssetIds(config: { tradingPairs?: string[][] }): string[];
export function visibleMarkets<T extends { amountAssetName?: string; priceAssetName?: string }>(
  markets: T[],
  hiddenNames: string[],
): T[];
