export const MoneyFormat = {
  Float: 'float',
  Long: 'long',
} as const;
export type MoneyFormat = (typeof MoneyFormat)[keyof typeof MoneyFormat];

export type WithMoneyFormat = {
  moneyFormat: MoneyFormat;
};
