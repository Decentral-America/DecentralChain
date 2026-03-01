//@ts-ignore
const fieldFactory =
  (type: any, optionalData?: any) =>
  (fromField: any, toField = fromField, processor: any = null, optional = false) => ({
    name: fromField,
    field: toField || fromField,
    optional,
    processor,
    type,
    optionalData: optionalData,
  });
export const string = (_data?: any) => fieldFactory('string');
export const asset = (_data?: any) => fieldFactory('assetId');
export const publicKey = (_data?: any) => fieldFactory('publicKey');
export const assetName = (_data?: any) => fieldFactory('assetName');
export const assetDescription = (_data?: any) => fieldFactory('assetDescription');
export const precision = (_data?: any) => fieldFactory('precision');
export const number = (_data?: any) => fieldFactory('number');
export const address = (data: any) => fieldFactory('address', data);
export const aliasName = (data: any) => fieldFactory('aliasName', data);
export const aliasOrAddress = (data: any) => fieldFactory('aliasOrAddress', data);
export const money = (_data?: any) => fieldFactory('money');
export const numberLike = (_data?: any) => fieldFactory('numberLike');
export const attachment = (_data?: any) => fieldFactory('attachment');
export const httpsUrl = (_data?: any) => fieldFactory('httpsUrl');
export const timestamp = (_data?: any) => fieldFactory('timestamp');
export const orderType = (_data?: any) => fieldFactory('orderType');
export const fromData = (_data?: any) => fieldFactory('fromData');
export const boolean = (_data?: any) => fieldFactory('boolean');
export const transfers = (data?: any) => fieldFactory('transfers', data);
export const data = (_data?: any) => fieldFactory('data');
export const script = (_data?: any) => fieldFactory('script');
export const asset_script = (_data?: any) => fieldFactory('asset_script');
export const required = (_data?: any) => fieldFactory('required');
export const call = (_data?: any) => fieldFactory('call');
export const payment = (_data?: any) => fieldFactory('payment');
