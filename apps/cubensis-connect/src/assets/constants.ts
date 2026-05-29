import type { NetworkName } from '#networks/types';

// Asset IDs for each network. DCC mainnet has no pre-registered tokens yet —
// third-party tokens will appear dynamically when users receive them.
// The Waves mainnet token catalog (75+ hardcoded asset IDs) was removed as dead
// code — none of those assets exist on DCC's chain.
export const assetIds: Record<NetworkName, Record<string, string>> = {
  custom: {
    DCC: 'DCC',
  },
  mainnet: {
    DCC: 'DCC',
  },
  stagenet: {
    DCC: 'DCC',
  },
  testnet: {
    DCC: 'DCC',
  },
};

// Default ticker mappings for known assets. DCC-native tokens will be added
// here as they are issued on the DCC chain. The Waves mainnet ticker catalog
// (~100 entries) was removed — those assets don't exist on DCC.
export const defaultAssetTickers: Record<string, string> = {
  DCC: 'DCC',
};

const logosByName: Record<string, string> = {
  DCC: new URL('./logos/DCC.svg', import.meta.url).toString(),
};

export const assetLogosByNetwork: Partial<{
  [network: string]: Partial<{
    [assetId: string]: string;
  }>;
}> = Object.fromEntries(
  Object.entries(assetIds).map(([network, nameToIdMap]) => [
    network,
    Object.fromEntries(Object.entries(nameToIdMap).map(([name, id]) => [id, logosByName[name]])),
  ]),
);
