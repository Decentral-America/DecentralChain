import { init, last, take } from 'ramda';

import { type SearchedItems } from '../../../../../types';
import { type WithLimit } from '../../../../_common';
import { type CursorSerialization, type RequestWithCursor } from '../../../pagination';

type ResponseMeta = {
  isLastPage: boolean;
  lastCursor?: string;
};

const createMeta =
  <Cursor, Request extends RequestWithCursor<WithLimit, string>, ResponseRaw>(
    serialize: CursorSerialization<Cursor, Request, ResponseRaw>['serialize'],
  ) =>
  (request: Request, responsesRaw: ResponseRaw[]): ResponseMeta => {
    const metaBuilder: ResponseMeta = {
      isLastPage: true,
    };
    const lastResponse = last(init(responsesRaw)) as ResponseRaw | undefined;
    if (typeof lastResponse !== 'undefined') {
      metaBuilder.isLastPage = responsesRaw.length < request.limit;
      const cursor = serialize(request, lastResponse as ResponseRaw);
      if (cursor !== undefined) {
        metaBuilder.lastCursor = cursor;
      }
    }
    return metaBuilder;
  };

export const transformResults =
  <Cursor, Request extends RequestWithCursor<WithLimit, string>, ResponseRaw, ResponseTransformed>(
    transformDbResponse: (result: ResponseRaw, request?: Request) => ResponseTransformed,
    serialize: CursorSerialization<Cursor, Request, ResponseRaw>['serialize'],
  ) =>
  (responses: ResponseRaw[], request: Request): SearchedItems<ResponseTransformed> => {
    const limited = (take as any)(request.limit)(responses) as ResponseRaw[];
    const transformedData = limited.map((r) => transformDbResponse(r, request));

    return {
      items: transformedData,
      ...createMeta(serialize)(request, responses),
    };
  };
