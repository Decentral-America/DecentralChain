import { Option } from 'effect';

export const transformResults =
  <Id, ResponseRaw, ResponseTransformed>(
    transformDbResponse: (result: ResponseRaw, request?: Id[]) => ResponseTransformed,
  ) =>
  (
    maybeResponses: Option.Option<ResponseRaw>[],
    request?: Id[],
  ): Option.Option<ResponseTransformed>[] =>
    maybeResponses.map((m) => Option.map(m, (r) => transformDbResponse(r, request)));
