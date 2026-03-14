import { ethTxId2dcc } from '@decentralchain/node-api-js';
import { ApiClientService } from './ApiClientService';

const MAX_UNCONFIRMED_TRANSACTIONS = 25;

export class TransactionService extends ApiClientService {
  constructor(transactionTransformerService, configurationService, networkId) {
    super(configurationService, networkId);

    this.transformer = transactionTransformerService;
  }

  loadTransaction = (id) => {
    const txId = id.startsWith('0x') && id.length === 66 ? ethTxId2dcc(id) : id;
    return this.loadRawTransaction(txId).then((tx) => {
      return this.transformer.transform(tx);
    });
  };

  loadRawTransaction = (id) => {
    const txId = id.startsWith('0x') && id.length === 66 ? ethTxId2dcc(id) : id;
    return this.getApi().transactions.info(txId);
  };

  loadUnconfirmed = () => {
    return this.getApi()
      .transactions.unconfirmed()
      .then((response) => {
        const transactions = response;
        transactions.sort((a, b) => b.timestamp - a.timestamp);

        const size = transactions.length;
        const sliced = transactions.slice(0, MAX_UNCONFIRMED_TRANSACTIONS);

        return this.transformer.transform(sliced).then((transformed) => ({
          size,
          transactions: transformed,
        }));
      });
  };
}
