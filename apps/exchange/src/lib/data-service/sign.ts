import {
  type Adapter,
  AdapterType,
  adapterList,
  getAdapterByType,
} from '@decentralchain/signature-adapter';

export interface IUserData {
  userType: AdapterType;
  address: string;
  networkByte: number;
  seed?: string;
  id?: string;
  privateKey?: string;
  publicKey?: string;
}

type AdapterConstructor = new (...args: unknown[]) => Adapter;

let API: Adapter | null = null;
let _userData: IUserData | null = null;

export function setSignatureApi(api: Adapter) {
  API = api;
}

export function dropSignatureApi() {
  API = null;
}

export function setUserData(userData: IUserData) {
  _userData = userData;
}

export function dropUserData() {
  _userData = null;
}

export function getUserAddress() {
  return _userData ? _userData.address : '';
}

export function getSignatureApi(): Adapter | null {
  if (!API || API.isDestroyed()) {
    try {
      const userData = _userData;
      if (!userData) return API;
      const ConcreteAdapter = getAdapterByType(userData.userType) as AdapterConstructor | null;
      if (!ConcreteAdapter) return API;

      switch (userData.userType) {
        case AdapterType.Seed:
          setSignatureApi(new ConcreteAdapter(userData.seed, userData.networkByte));
          break;
        case AdapterType.PrivateKey:
          setSignatureApi(new ConcreteAdapter(userData.privateKey, userData.networkByte));
          break;
        default:
          setSignatureApi(new ConcreteAdapter(userData, userData.networkByte));
      }
    } catch {
      return API;
    }
  }

  return API;
}

type UserWithSettings = {
  userType: AdapterType;
  settings: { get: (key: string) => unknown };
  [key: string]: unknown;
};

export function getDefaultSignatureApi(user: UserWithSettings): Adapter {
  const encryptionRounds = user.settings.get('encryptionRounds');
  const userData = { ...user, encryptionRounds };
  const firstAdapterEntry = adapterList[0];
  const AdapterClass = (getAdapterByType(user.userType) ??
    (firstAdapterEntry
      ? getAdapterByType(firstAdapterEntry.type)
      : null)) as AdapterConstructor | null;
  if (!AdapterClass) throw new Error(`No adapter found for user type: ${String(user.userType)}`);
  return new AdapterClass(userData);
}
