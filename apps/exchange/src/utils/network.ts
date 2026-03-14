/**
 * Network utility functions for DecentralChain
 * Handles network byte conversions and configuration access
 */

import { useConfig } from '@/contexts/ConfigContext';

/**
 * Convert network code character to ASCII byte value
 * Used for seed generation and address validation
 * 
 * @param code - Network code character ('?' for DCC mainnet, '!' for testnet, 'W' for Waves)
 * @returns ASCII byte value (63 for '?', 33 for '!', 87 for 'W')
 * 
 * @example
 * ```typescript
 * getNetworkByte('?') // Returns 63 (DCC mainnet)
 * getNetworkByte('!') // Returns 33 (DCC testnet)
 * getNetworkByte('W') // Returns 87 (Waves mainnet)
 * ```
 */
export const getNetworkByte = (code: string): number => {
  return code.charCodeAt(0);
};

/**
 * Convert network byte to character code
 * Used for displaying network identifiers
 * 
 * @param byte - ASCII byte value (network byte)
 * @returns Network code character
 * 
 * @example
 * ```typescript
 * getNetworkChar(63) // Returns '?' (DCC mainnet)
 * getNetworkChar(33) // Returns '!' (DCC testnet)
 * getNetworkChar(87) // Returns 'W' (Waves mainnet)
 * ```
 */
export const getNetworkChar = (byte: number): string => {
  return String.fromCharCode(byte);
};

/**
 * React hook to get current network byte from configuration
 * Provides reactive access to network byte and code values
 * Updates automatically when network is switched via ConfigContext
 * 
 * @returns Object containing byte (number) and char (string) for current network
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { byte, char } = useNetworkByte();
 *   // On DCC mainnet: byte = 63, char = '?'
 *   // On DCC testnet: byte = 33, char = '!'
 *   return <div>Network: {char} (byte: {byte})</div>;
 * }
 * ```
 */
export const useNetworkByte = (): { byte: number; char: string } => {
  const { networkCode } = useConfig();
  
  return {
    byte: getNetworkByte(networkCode),
    char: networkCode,
  };
};
