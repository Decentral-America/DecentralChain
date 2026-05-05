import { Option } from 'effect';
import { fromMaybe } from '../';
import { type Serializable, toSerializable } from '../serializable';

type RawData = {
  id: string;
  timestamp: Date;
};
type Data = Serializable<'mock', RawData | null>;

const data: RawData = { id: 'qwe', timestamp: new Date() };
const mock: Data = {
  __type: 'mock',
  data,
};

const mockWithNull: Data = {
  __type: 'mock',
  data: null,
};

const transform = (raw?: RawData): Data => {
  return raw
    ? toSerializable<'mock', RawData | null>('mock', raw)
    : toSerializable<'mock', RawData | null>('mock', null);
};

describe('fromMaybe should construct type from', () => {
  it('Some', () => expect(fromMaybe(transform)(Option.some(data))).toEqual(mock));
  it('None', () => expect(fromMaybe(transform)(Option.none())).toEqual(mockWithNull));
});
