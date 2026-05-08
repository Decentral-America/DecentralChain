import transformTxInfo from '../transformTxInfo';
import { txExchange } from './mocks/tx';

test('transformTxInfo for exchange tx should correctly transform fields', () => {
  expect(transformTxInfo(txExchange as any)).toMatchSnapshot();
});
