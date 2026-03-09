const explorerUrls = new Map([
  ['W', 'explorer.decentralchain.io'],
  ['T', 'testnet.explorer.decentralchain.io'],
  ['S', 'stagenet.explorer.decentralchain.io'],
  ['custom', 'explorer.decentralchain.io/custom'],
]);

export function getAccountLink(
  networkCode: string,
  address: string | null | undefined,
) {
  const explorer = explorerUrls.get(
    explorerUrls.has(networkCode) ? networkCode : 'custom',
  );
  return `https://${explorer}/address/${address}`;
}

export function getTxHistoryLink(networkCode: string, address: string): string {
  return `${getAccountLink(networkCode, address)}/tx/`;
}

export function getNftsLink(networkCode: string, address: string): string {
  return `${getAccountLink(networkCode, address)}/nft/`;
}

export function getTxDetailLink(networkCode: string, txId: string): string {
  const explorer = explorerUrls.get(
    explorerUrls.has(networkCode) ? networkCode : 'custom',
  );
  return `https://${explorer}/tx/${txId}`;
}

export function getAssetDetailLink(
  networkCode: string,
  assetId: string,
): string {
  const explorer = explorerUrls.get(
    explorerUrls.has(networkCode) ? networkCode : 'custom',
  );
  return `https://${explorer}/assets/${assetId}`;
}
