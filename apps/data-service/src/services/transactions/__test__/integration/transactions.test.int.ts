import { zipObj } from 'ramda';

// presets
import { get, mget, search } from './presets';

// dependencies
import { createPgDriver } from '../../../../db';
import { loadConfig } from '../../../../loadConfig';
const options = loadConfig();
const drivers = {
  pg: createPgDriver(options),
};

const commonServiceCreatorOptions = {
  drivers,
  emitEvent: () => () => {},
};

const serviceNames = {
  1: 'genesis',
  2: 'payment',
  3: 'issue',
  4: 'transfer',
  5: 'reissue',
  6: 'burn',
  7: 'exchange',
  8: 'lease',
  9: 'leaseCancel',
  10: 'alias',
  11: 'massTransfer',
  12: 'data',
  13: 'setScript',
  14: 'sponsorship',
  15: 'setAssetScript',
  16: 'invokeScript',
  17: 'updateAssetInfo',
};

const serviceInstances = zipObj(
  Object.keys(serviceNames),
  Object.values(serviceNames).map((svcName) => {
    const serviceCreator = require(`../../${svcName}`).default;
    return serviceCreator(commonServiceCreatorOptions);
  }),
);

import allCommonDataServiceCreator from '../../all/commonData';
import allServiceCreator from '../../all';

const allServiceInstances = {
  ...serviceInstances,
  all: allServiceCreator(commonServiceCreatorOptions)(serviceInstances),
  allCommonData: allCommonDataServiceCreator(commonServiceCreatorOptions),
};

// tests description
const services = [
  {
    ids: [
      '2DVtfgXjpMeFf2PQCqvwxAiaGbiDsxDjSdNQkc5JQ74eWxjWFYgwvqzC4dn7iB1AhuM32WxEiVi1SGijsBtYQwn8',
      '2TsxPS216SsZJAiep7HrjZ3stHERVkeZWjMPFcvMotrdGpFa6UCCmoFiBGNizx83Ks8DnP3qdwtJ8WFcN9J4exa3',
    ],
    name: 'genesis',
    service: allServiceInstances['1'],
    tests: ['get', 'mget'],
  },
  {
    // first ID has 12 txs with it
    ids: [
      '5jpwaJnERa8Gr1ChgrNYnmxm2EtZ4KHC5bW1ZLL7LCY1bUV9gFWFAGjpJaPDCawmFzguqGBgYDyeocpEsKWeYDM1',
      '119tSRyy2sAFcAS5Htb6m4FtsCtJsacAwarg75WpsAf9HgMJnpvgcLou31ARxxEp1WMuTmGTRNUeghCgrS4PxDT',
    ],
    name: 'payment',
    service: allServiceInstances['2'],
  },
  {
    ids: [
      'CeFjjLBxhpj1vsF832KC6SXEHicc1a2gUJMzaAZGHUJ7',
      '5ZUsD93EbK1SZZa2GXYZx3SjhcXWDvMKqzWoJZjNGkW8',
    ],
    name: 'issue',
    service: allServiceInstances['3'],
  },
  {
    ids: [
      'GN5SSawWUwodvAcHV2d96pe7HgFqvxoEAU9FCW9MUphE',
      'Co8JB3md1hsnFKYS2xonipBFyQcB7qskyosoJf6YhBi1',
    ],
    name: 'transfer',
    service: allServiceInstances['4'],
  },
  {
    ids: [
      '2JksHUA6E4ZQd351i3oxJq2Ts7tvMN7NNVfoduR1fFsk',
      '2TyaLLCzjvC3tVTWebq5hAvEakXeACRrf3Bgu4e8fSos',
    ],
    name: 'reissue',
    service: allServiceInstances['5'],
  },
  {
    ids: [
      '41wEWfP9wMQLJViYTfmE7797fWeZJwTXsk43oUgqZ1WZ',
      'CTgfKGmiu12FPgyuhmqaKvXWrDGYqWwtHemqn8par82Y',
    ],
    name: 'burn',
    service: allServiceInstances['6'],
  },
  {
    ids: [
      'FU5mCVTaa83TPMx4fj1F7bL6ZAfpMKcPpDDvhvxCD557',
      '4ZXpBjWJRFWaJhq9P2WUgW7N7F5h1poeJyQSfBpJuwfb',
    ],
    name: 'exchange',
    service: allServiceInstances['7'],
  },
  {
    ids: [
      'CQ1AAooHc3kK81Gk3NY7Y9ewsDhQqRpiito4pm64NkS9',
      '78Fj9MJgjhs2o1aeyN6WCSr3m9p8TyweHJj1rY7Zv4aE',
    ],
    name: 'lease',
    service: allServiceInstances['8'],
  },
  {
    ids: [
      '4g5vqYxyczBhuyzKydHZiAG6mLcNCmXvvVyAVJwNUtqm',
      'FXfeJWZxoXeSBz5HRN2EYcjKxPXQUkjYDuDKEvQWvBFb',
    ],
    name: 'leaseCancel',
    service: allServiceInstances['9'],
  },
  {
    // both broken aliases, have 3 txs each on this ID
    ids: [
      '21BmkGpk98wWHrCydjwTFvHWPfQxtH5NEQd9X7wUpi5R',
      'HbgSfoQ7ftAF3TUQNovbFnohsRK7AdztFznrJHTqH7F7',
    ],
    name: 'alias',
    service: allServiceInstances['10'],
  },
  {
    ids: [
      'BDvR1eppSmJgxs2tof5Dfcw9Q6KPBmZYwyYriFNCoy5p',
      'BooPcaewXeC1yfBKy89d8Sjk3L7Yii6WFr4kArqe32Ky',
    ],
    name: 'massTransfer',
    service: allServiceInstances['11'],
  },
  {
    ids: [
      'AkM4bQ5dVkqWezSgMPdW5iieX98xDsiFjVDbEddntGNv',
      'FKL7UhhmV7WnaQh72zb3WeyF7uyBBh47kvdVXqwDoKvS',
    ],
    name: 'data',
    service: allServiceInstances['12'],
  },
  {
    ids: [
      '8Nwjd2tcQWff3S9WAhBa7vLRNpNnigWqrTbahvyfMVrU',
      'Dt7L51pQbmMcc971byGeBHDgoi7AMfHgCtmoWYMRyWhL',
    ],
    name: 'setScript',
    service: allServiceInstances['13'],
  },
  {
    ids: [
      'A56FrxqFp6Pw9tyqgyDsUugfZMydmzRCqeTwpMnRijCJ',
      'GGFdKLjvMnjCdmZRjuc6z9QjD8PCHZywNFBSwf62xTpS',
    ],
    name: 'sponsorship',
    service: allServiceInstances['14'],
  },
  {
    ids: [
      'Co8JB3md1hsnFKYS2xonipBFyQcB7qskyosoJf6YhBi1', // 4
      'AkM4bQ5dVkqWezSgMPdW5iieX98xDsiFjVDbEddntGNv', // 12
    ],
    name: 'all.commonData',
    service: allServiceInstances.allCommonData,
  },
  {
    ids: [
      'Co8JB3md1hsnFKYS2xonipBFyQcB7qskyosoJf6YhBi1', // 4
      'AkM4bQ5dVkqWezSgMPdW5iieX98xDsiFjVDbEddntGNv', // 12
    ],
    name: 'all',
    service: allServiceInstances.all,
  },
];

// for disabling some tests for debug purpose
// const pred = s => s.name === 'data';
const pred = () => true;

// test run
services.filter(pred).forEach((s) => {
  describe(`${s.name} transactions service`, () => {
    if (!s.tests || s.tests.includes('get')) {
      get(s.service, s.ids[0]);
    }
    if (!s.tests || s.tests.includes('mget')) {
      mget(s.service, s.ids);
    }
    if (!s.tests || s.tests.includes('search')) {
      search(s.service);
    }
  });
});
