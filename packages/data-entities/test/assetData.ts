import { type IAssetInfo } from '../src/entities/Asset';

const defaultData: IAssetInfo = {
  description: 'Default description',
  hasScript: true,
  height: 10,
  id: 'default-id',
  minSponsoredFee: 100000,
  name: 'Default Name',
  precision: 8,
  quantity: 1000,
  reissuable: false,
  sender: '3Pxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  timestamp: new Date('2016-04-12'),
};

export function getAssetData(partialData: Partial<IAssetInfo> = {}): IAssetInfo {
  return { ...defaultData, ...partialData };
}
