import { type Asset } from '@decentralchain/data-entities';
import { Effect, Option, pipe } from 'effect';
import { AppError } from '../../errorHandling';
import { type SearchedItems, type Service } from '../../types';
import {
  type AssetsGetRequest,
  type AssetsMgetRequest,
  type AssetsRepo,
  type AssetsSearchRequest,
} from './repo/types';

export type AssetsServiceGetRequest = { id: AssetsGetRequest };
export type AssetsServiceMgetRequest = { ids: AssetsMgetRequest };
export type AssetsServiceSearchRequest = AssetsSearchRequest;

export type AssetsService = {
  get: Service<AssetsServiceGetRequest, Option.Option<Asset>>;
  mget: Service<AssetsServiceMgetRequest, Option.Option<Asset>[]>;
  search: Service<AssetsServiceSearchRequest, SearchedItems<Asset>>;
  precisions: Service<AssetsServiceMgetRequest, number[]>;
};

export default (repo: AssetsRepo): AssetsService => ({
  get: (req) => repo.get(req.id),
  mget: (req) => repo.mget(req.ids),

  precisions: (req) => {
    const assetIds = new Map<string, number>();
    req.ids.forEach((assetId) => {
      if (!assetIds.has(assetId)) assetIds.set(assetId, assetIds.size);
    });

    return pipe(
      repo.mget(Array.from(assetIds.keys())),
      Effect.flatMap((ms) =>
        Effect.all(
          ms.map((ma, idx) =>
            Option.isSome(ma)
              ? Effect.succeed(ma.value.precision)
              : Effect.fail(AppError.Resolver(`Asset ${req.ids[idx]} precision not found.`)),
          ),
        ),
      ),
      Effect.map((precisions) =>
        req.ids.map((id) => precisions[assetIds.get(id) as number] as number),
      ),
    );
  },

  search: (req) => repo.search(req),
});
