export function parseHeadersFile(
  text: string,
): { pattern: string; headers: { name: string; value: string | null }[] }[];
export function headersForPattern(
  rules: ReturnType<typeof parseHeadersFile>,
  pattern: string,
): Map<string, string>;
export function parseCsp(value: string): Map<string, string[]>;
export function sourceAllows(source: string, url: string): boolean;
export function withNoindexHeader(text: string): string;
export function scanBundleOrigins(distDir: string): string[];
export function checkBundleOrigins(headersText: string, origins: string[]): string[];
export function checkHeaders(
  text: string,
  opts: {
    network: 'mainnet' | 'stagenet' | 'testnet';
    requiredOrigins?: string[];
    bundleOrigins?: string[];
    analyticsEnabled?: boolean;
  },
): string[];
export const NON_FETCH_ORIGINS: Map<string, string>;
export function resolveBuildNetwork(
  env: Record<string, string | undefined>,
  isProduction: boolean,
): 'mainnet' | 'stagenet' | 'testnet';
export function analyticsEnabledFor(network: 'mainnet' | 'stagenet' | 'testnet'): boolean;
export function requiredOriginsFor(network: 'mainnet' | 'stagenet' | 'testnet'): string[];
