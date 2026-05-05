import { type Option } from 'effect';
import { type AliasInfo, type SearchedItems, type Service } from '../../types';
import { type WithMoneyFormat } from '../types';
import {
  type AliasesGetRequest,
  type AliasesMgetRequest,
  type AliasesRepo,
  type AliasesSearchRequest,
} from './repo';

export type { WithAddress, WithAddresses, WithQueries } from './repo';

export type AliasesServiceGetRequest = {
  id: AliasesGetRequest;
};

export type AliasesServiceMgetRequest = {
  aliases: AliasesMgetRequest;
};

export type AliasesServiceSearchRequest = AliasesSearchRequest;

export type AliasesService = {
  get: Service<AliasesServiceGetRequest & WithMoneyFormat, Option.Option<AliasInfo>>;
  mget: Service<AliasesServiceMgetRequest & WithMoneyFormat, Option.Option<AliasInfo>[]>;
  search: Service<AliasesServiceSearchRequest & WithMoneyFormat, SearchedItems<AliasInfo>>;
};

export default (repo: AliasesRepo): AliasesService => ({
  get: (req) => repo.get(req.id),
  mget: (req) => repo.mget(req.aliases),
  search: (req) => repo.search(req),
});
