import { base58Decode } from '@decentralchain/crypto';
import invariant from 'tiny-invariant';
import { NetworkName } from '#networks/types';

function getNetworkCodeByAddress(address: string): string {
  const addrBytes = base58Decode(address);
  invariant(
    addrBytes.length >= 2,
    `getNetworkCodeByAddress: address too short (${addrBytes.length} bytes)`,
  );
  return String.fromCharCode(addrBytes[1] as number);
}

export function getNetworkByNetworkCode(networkCode: string): NetworkName {
  switch (networkCode) {
    case 'S':
      return NetworkName.Stagenet;
    case 'T':
      return NetworkName.Testnet;
    case 'W':
      return NetworkName.Mainnet;
    default:
      return NetworkName.Custom;
  }
}

export function getNetworkByAddress(address: string): NetworkName {
  return getNetworkByNetworkCode(getNetworkCodeByAddress(address));
}

export async function getNetworkCode(url: string) {
  const response = await fetch(new URL('/blocks/headers/last', url));

  if (!response.ok) {
    throw response;
  }

  const { generator }: { generator: string } = await response.json();

  if (!generator) {
    throw new Error('Incorrect node url');
  }

  const networkCode = getNetworkCodeByAddress(generator);

  if (!networkCode) {
    throw new Error('Incorrect node byte');
  }

  return networkCode;
}

export async function getMatcherPublicKey(url: string) {
  const response = await fetch(new URL('/matcher', url));

  if (!response.ok) {
    throw response;
  }

  const publicKey = (await response.json()) as string;

  if (base58Decode(publicKey).length !== 32) {
    throw new Error('Invalid matcher public key');
  }

  return publicKey;
}
