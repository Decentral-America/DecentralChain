import { keccak, blake2b, base58Encode, base16Decode } from '@decentralchain/ts-lib-crypto';

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function validateEthAddress(addr: string): boolean {
  return ETH_ADDRESS_RE.test(addr);
}

export default function ethAddress2dcc(ethAddress: string, chainId: number): string {
  if (!validateEthAddress(ethAddress)) {
    throw new TypeError(
      `Invalid Ethereum address: expected 0x-prefixed 40-hex-char string, received "${ethAddress}"`,
    );
  }
  if (!Number.isInteger(chainId) || chainId < 0 || chainId > 255) {
    throw new RangeError(`Invalid chainId: expected integer 0–255, received ${String(chainId)}`);
  }
  ethAddress = ethAddress.slice(2);

  const prefixBytes = new Uint8Array([0x01, chainId]);

  // Decode HEX string into bytes (PK_HASH)
  const pkHashBytes = base16Decode(ethAddress);

  // Compute checksum: CHECKSUM = keccak256(blake2b256([0x01, CHAIN_ID] + PK_HASH))
  const checksumBytes = new Uint8Array([...prefixBytes, ...pkHashBytes]);
  const checksum = keccak(blake2b(checksumBytes));

  // Concatenate [0x01, CHAIN_ID] (2 bytes) + PK_HASH (original 20 bytes) + CHECKSUM[0:4] (first 4 bytes)
  const dccBytes = new Uint8Array([
    ...prefixBytes,
    ...pkHashBytes.slice(0, 20),
    ...checksum.slice(0, 4),
  ]);

  // Encode as base58
  const dccAddress = base58Encode(dccBytes);

  return dccAddress;
}
