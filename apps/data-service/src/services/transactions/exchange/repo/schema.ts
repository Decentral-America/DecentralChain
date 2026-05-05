import { Schema } from 'effect';
import * as S from '../../../../utils/validation/schema';
import commonFields from '../../_common/commonFieldsSchemas';
import { OrderPriceMode, OrderType } from './types';

const orderFields = (prefix: string): Record<string, Schema.Schema<any>> => ({
  [`${prefix}_id`]: S.Base58,
  [`${prefix}_version`]: Schema.NullOr(S.NoNullChars),
  [`${prefix}_type`]: Schema.Literal(OrderType.Buy, OrderType.Sell),
  [`${prefix}_sender`]: S.Base58,
  [`${prefix}_sender_public_key`]: S.Base58,
  [`${prefix}_signature`]: Schema.Union(S.Base58, Schema.Literal('')),
  [`${prefix}_matcher_fee`]: S.Bignumber,
  [`${prefix}_price`]: S.Bignumber,
  [`${prefix}_amount`]: S.Bignumber,
  [`${prefix}_time_stamp`]: Schema.DateFromSelf,
  [`${prefix}_expiration`]: Schema.DateFromSelf,
  [`${prefix}_matcher_fee_asset_id`]: Schema.NullOr(S.AssetId),
  [`${prefix}_eip712signature`]: Schema.NullOr(S.Eip712Signature),
  [`${prefix}_price_mode`]: Schema.NullOr(
    Schema.Literal(OrderPriceMode.AssetDecimals, OrderPriceMode.FixedDecimals),
  ),
});

export const result = Schema.Struct({
  ...commonFields,
  amount: S.Bignumber,
  amount_asset: S.AssetId,
  buy_matcher_fee: S.Bignumber,
  price: S.Bignumber,
  price_asset: S.AssetId,
  sell_matcher_fee: S.Bignumber,
  ...orderFields('o1'),
  ...orderFields('o2'),
} as any);
