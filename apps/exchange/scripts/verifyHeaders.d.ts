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
  },
): string[];
export function requiredOriginsFor(network: 'mainnet' | 'stagenet' | 'testnet'): string[];
