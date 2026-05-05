import { Option } from 'effect';

export const transformResults =
  <Id, ResponseRaw, ResponseTransformed>(
    transformDbResponse: (results: ResponseRaw, request?: Id) => ResponseTransformed,
  ) =>
  (maybeResponse: Option.Option<ResponseRaw>, request?: Id): Option.Option<ResponseTransformed> =>
    Option.map(maybeResponse, (r) => transformDbResponse(r, request));
