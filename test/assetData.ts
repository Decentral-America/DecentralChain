import { type IAssetInfo } from '../src/entities/Asset';

const defaultData: IAssetInfo = {
  id: 'default-id',
  name: 'Default Name',
  precision: 8,
  description: 'Default description',
  height: 10,
  timestamp: new Date('2016-04-12'),
  sender: '3Pxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  quantity: 1000,
  reissuable: false,
  hasScript: true,
  minSponsoredFee: 100000,
};

export function getAssetData(partialData: Partial<IAssetInfo> = {}): IAssetInfo {
  return { ...defaultData, ...partialData };
}
