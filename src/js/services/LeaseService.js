import Currency from '../shared/Currency';
import Money from '../shared/Money';
import { ApiClientService } from './ApiClientService';

export class LeaseService extends ApiClientService {
  loadLease = (id) => {
    return this.loadRawLease(id).then((leases) => {
      return {
        ...leases[0],
        amount: Money.fromCoins(leases[0].amount, Currency.DCC),
      };
    });
  };

  loadRawLease = (id) => {
    return this.getApi().transactions.leaseInfo([id]);
  };
}
