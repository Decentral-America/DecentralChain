import { type IParsedRating } from '../../interface';

// @ts-expect-error - placeholder until token rating API is implemented
export function getAssetsRating(_assets: string | Array<string>): Promise<Array<IParsedRating>> {
  // return request(
  //     {
  //         url: `${get('tokenrating')}/api/v1/token/`,
  //         fetchOptions: {
  //             method: 'POST',
  //             headers: {
  //                 'Accept': 'application/json',
  //                 'Content-Type': 'application/json;charset=UTF-8'
  //             },
  //             body: stringifyJSON({
  //                 "assetIds": toArray(assets),
  //                 "page": 1,
  //                 "limit": 25
  //             })
  //         }
  //     })
  //     .then((tokensList: any) => {
  //         return Object.values(tokensList).map((ratingItem: ITokenRating) => {
  //             return {
  //                 assetId: ratingItem.assetId,
  //                 rating: ratingItem.averageScore
  //             };
  //         })
  //     });
}
