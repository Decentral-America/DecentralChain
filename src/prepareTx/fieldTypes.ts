const fieldFactory =
  (type: string, optionalData?: unknown) =>
  (
    fromField: string | string[] | null,
    toField?: string | null,
    processor: unknown = null,
    optional = false,
  ) => ({
    name: fromField,
    field: toField ?? (typeof fromField === 'string' ? fromField : null),
    optional,
    processor,
    type,
    optionalData: optionalData,
  });
export const string = (_data?: unknown) => fieldFactory('string');
export const asset = (_data?: unknown) => fieldFactory('assetId');
export const publicKey = (_data?: unknown) => fieldFactory('publicKey');
export const assetName = (_data?: unknown) => fieldFactory('assetName');
export const assetDescription = (_data?: unknown) => fieldFactory('assetDescription');
export const precision = (_data?: unknown) => fieldFactory('precision');
export const number = (_data?: unknown) => fieldFactory('number');
export const aliasName = (data: unknown) => fieldFactory('aliasName', data);
export const aliasOrAddress = (data: unknown) => fieldFactory('aliasOrAddress', data);
export const money = (_data?: unknown) => fieldFactory('money');
export const numberLike = (_data?: unknown) => fieldFactory('numberLike');
export const attachment = (_data?: unknown) => fieldFactory('attachment');
export const timestamp = (_data?: unknown) => fieldFactory('timestamp');
export const orderType = (_data?: unknown) => fieldFactory('orderType');
export const fromData = (_data?: unknown) => fieldFactory('fromData');
export const boolean = (_data?: unknown) => fieldFactory('boolean');
export const transfers = (data?: unknown) => fieldFactory('transfers', data);
export const data = (_data?: unknown) => fieldFactory('data');
export const script = (_data?: unknown) => fieldFactory('script');
export const asset_script = (_data?: unknown) => fieldFactory('asset_script');
export const required = (_data?: unknown) => fieldFactory('required');
export const call = (_data?: unknown) => fieldFactory('call');
export const payment = (_data?: unknown) => fieldFactory('payment');
