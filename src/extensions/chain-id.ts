import { type TChainId, MAIN_NET_CHAIN_ID, TEST_NET_CHAIN_ID } from '../crypto/interface';

/** Chain ID utility for converting and checking network identifiers. */
export const ChainId = {
  /** Convert a chain ID (string or number) to its numeric representation. */
  toNumber(chainId: TChainId): number {
    return typeof chainId === 'string' ? chainId.charCodeAt(0) : chainId;
  },
  /** Check if the given chain ID corresponds to mainnet. */
  isMainnet(chainId: TChainId): boolean {
    return ChainId.toNumber(chainId) === MAIN_NET_CHAIN_ID;
  },
  /** Check if the given chain ID corresponds to testnet. */
  isTestnet(chainId: TChainId): boolean {
    return ChainId.toNumber(chainId) === TEST_NET_CHAIN_ID;
  },
};

/** @deprecated Use `ChainId` instead. */
export const ChaidId = ChainId;
