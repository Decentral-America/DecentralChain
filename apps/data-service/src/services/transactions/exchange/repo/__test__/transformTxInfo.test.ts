import { txExchange } from './mocks/tx';
import transformTxInfo from '../transformTxInfo';

test('transformTxInfo for exchange tx should correctly transform fields', () => {
  expect(transformTxInfo(txExchange)).toMatchSnapshot();
});
