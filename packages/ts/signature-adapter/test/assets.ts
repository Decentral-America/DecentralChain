import { Asset } from '@decentralchain/data-entities';

export const DCCAsset = new Asset({
  description: '',
  height: 0,
  id: 'DCC',
  name: 'DecentralCoin',
  precision: 8,
  quantity: 10000000000000000,
  reissuable: false,
  sender: '',
  ticker: 'DCC',
  timestamp: new Date('2016-04-11T21:00:00.000Z'),
});

export const BtcAsset = new Asset({
  description: 'Bitcoin Token',
  height: 185539,
  id: '25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK',
  name: 'WBTC',
  precision: 8,
  quantity: 2100000000000000,
  reissuable: false,
  sender: '3DhKtKgynxyh9K2YrEMLgLBM8AMuLkKdkRn',
  ticker: 'BTC',
  timestamp: new Date(1480690876160),
});

export const TORCorp = new Asset({
  description: 'TOR Corporation',
  height: 1247969,
  id: '51LxAtwBXapvvTFSbbh4nLyWFxH6x8ocfNvrXxbTChze',
  name: 'TORCorp',
  precision: 6,
  quantity: 10000000000000000,
  reissuable: false,
  sender: '3P287ZEpVU14SAr4jhCF58fZPzfkQv4LXqm',
  ticker: '',
  timestamp: new Date(1541398865252),
});

export const INSTANTCOIN = new Asset({
  description:
    'INSTANTCOIN a token that is been build on the DCC platform. Subscribe on the website & social media for more upcoming updates.',
  height: 851542,
  id: '9LzU7cidQwVXG7inifAoRvh61qdGhT68PyiwGLcboyik',
  name: 'INSTANTCOIN',
  precision: 2,
  quantity: 10000000,
  reissuable: true,
  sender: '3P5YZYeYu3pEKywhGx2maBzZJ9sw6CuWqpq',
  ticker: '',
  timestamp: new Date(1516898561323),
});

export const Aracoin = new Asset({
  description: 'moeda Amazonica',
  height: 1529849,
  id: '9tv9pBXj8jrJnFiSktMiohULps9LZwhm47bjjCHc8P6s',
  name: 'Aracoin',
  precision: 8,
  quantity: 100000000000000,
  reissuable: true,
  sender: '3PNTrUhPCeuLzLNvJnyNvozpRw5e7XGRYG5',
  timestamp: new Date(1558057919829),
});

export const WETH = new Asset({
  description: 'Ethereum Token',
  height: 585888,
  id: '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
  name: 'WETH',
  precision: 8,
  quantity: 10000000000000000,
  reissuable: true,
  sender: '3PAfgHQPgodM6MxUzqRkepiKofGnECNoxt5',
  timestamp: new Date(1500374348683),
});

export const Voyage = new Asset({
  description: 'Voyage Token',
  height: 1484354,
  id: '9JKjU6U2Ho71U7VWHvr14RB7iLpx2qYBtyUZqLpv6pVB',
  name: 'Voyage',
  precision: 8,
  quantity: 100000000000000000,
  reissuable: false,
  sender: '3PCdWLg27GMKprpwKcHqcWS2UwXWwQNRwag',
  timestamp: new Date(1555369015615),
});

export const TBTC = new Asset({
  description: 'Tokenomica BTC',
  height: 1456494,
  id: '9SxLVHaEGTeEjRiAMnEw74YWWndQDRw8SZhknK9EYoUd',
  name: 'TBTC',
  precision: 8,
  quantity: 100000000,
  reissuable: true,
  sender: '3P9Typ8Wnoxt719juABnCeErU5wAvfcXAU9',
  timestamp: new Date(1553718649292),
});
