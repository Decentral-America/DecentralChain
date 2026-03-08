import { BigNumber } from '@decentralchain/bignumber';
import {
  type AliasTransaction,
  type AssetDecimals,
  type BurnTransaction,
  type CancelLeaseTransaction,
  type DataTransaction,
  type DataTransactionEntry,
  type EthereumTransaction,
  type ExchangeTransaction,
  type GenesisTransaction,
  type InvokeScriptTransaction,
  type IssueTransaction,
  type LeaseTransaction,
  type Long,
  type MassTransferTransaction,
  type PaymentTransaction,
  type ReissueTransaction,
  type SetAssetScriptTransaction,
  type SetScriptTransaction,
  type SponsorshipTransaction,
  TRANSACTION_TYPE,
  type TransferTransaction,
  type UpdateAssetInfoTransaction,
  type WithApiMixin,
} from '@decentralchain/ts-types';
import { type IWithStateChanges, type TPayment, type TStateChanges } from '../../api-node/debug';
import { type IWithApplicationStatus, type TLong } from '../../interface';

interface TStateUpdate {
  data: (DataTransactionEntry & { address: string })[];
  transfers: {
    address: string;
    sender: string;
    amount: TLong;
    asset: string | null;
  }[];
  issues: {
    address: string;
    assetId: string;
    name: string;
    description: string;
    quantity: TLong;
    decimals: AssetDecimals;
    isReissuable: boolean;
    compiledScript: null | string;
    nonce: TLong;
  }[];
  reissues: {
    address: string;
    assetId: string;
    isReissuable: boolean;
    quantity: TLong;
  }[];
  burns: {
    address: string;
    assetId: string;
    quantity: TLong;
  }[];
  sponsorFees: {
    address: string;
    assetId: string;
    minSponsoredAssetFee: TLong;
  }[];
  leases: {
    sender: string;
    leaseId: string;
    recipient: string;
    amount: TLong;
  }[];
  leaseCancels: { leaseId: string; address: string }[];
}

export interface TWithStateUpdate {
  stateUpdate: TStateUpdate;
}
export type TWithState = IWithStateChanges & TWithStateUpdate;

export type TTransaction<LONG = Long> =
  | GenesisTransaction<LONG>
  | PaymentTransaction<LONG>
  | IssueTransaction<LONG>
  | TransferTransaction<LONG>
  | ReissueTransaction<LONG>
  | BurnTransaction<LONG>
  | LeaseTransaction<LONG>
  | CancelLeaseTransaction<LONG>
  | AliasTransaction<LONG>
  | MassTransferTransaction<LONG>
  | DataTransaction<LONG>
  | SetScriptTransaction<LONG>
  | SponsorshipTransaction<LONG>
  | ExchangeTransaction<LONG>
  | SetAssetScriptTransaction<LONG>
  | (InvokeScriptTransaction<LONG> & TWithState)
  | UpdateAssetInfoTransaction<LONG>
  | EthereumTransaction<LONG>;

export function addStateUpdateField(
  transaction: TTransaction & WithApiMixin & IWithApplicationStatus,
): TTransaction & WithApiMixin & IWithApplicationStatus {
  if (transaction.type !== TRANSACTION_TYPE.ETHEREUM) return transaction;

  const { payload } = transaction;
  if (
    !('type' in payload) ||
    payload.type !== 'invocation' ||
    !payload.stateChanges?.invokes.length
  ) {
    return transaction;
  }

  const payments =
    payload.payment?.map((p: TPayment) => ({
      assetId: p.assetId,
      amount: p.amount,
    })) ?? [];
  const dApp = payload.dApp;
  // Capture after null guard so TypeScript narrows the type
  const { stateChanges } = payload;
  return Object.defineProperty(transaction, 'stateUpdate', {
    get: () => makeStateUpdate(stateChanges, payments, dApp, transaction.sender),
  });
}

function makeStateUpdate(
  stateChanges: TStateChanges,
  payment: TPayment[],
  dAppParam: string | undefined,
  sender: string,
): TStateUpdate {
  const dApp = dAppParam ?? '';
  const payments = payment.map((p) => ({ payment: p, dApp, sender }));
  const addField = <T extends object, K extends string>(array: T[], fieldName: K) =>
    array.map((item) => ({ ...item, [fieldName]: dApp }) as T & Record<K, string>);
  const transfers = addField(stateChanges.transfers, 'sender');
  const leases = addField(stateChanges.leases, 'sender');
  const issues = addField(stateChanges.issues, 'address');
  const data = addField(stateChanges.data, 'address');
  const reissues = addField(stateChanges.reissues, 'address');
  const burns = addField(stateChanges.burns, 'address');
  const sponsorFees = addField(stateChanges.sponsorFees, 'address');
  const leaseCancels = addField(stateChanges.leaseCancels, 'address');

  const stateUpdate = {
    payments,
    data,
    transfers,
    reissues,
    issues,
    burns,
    sponsorFees,
    leases,
    leaseCancels,
  };

  const recursiveFunction = (sc: TStateChanges, senderAddr: string) => {
    if (sc.invokes.length === 0) return;
    sc.invokes.forEach((x) => {
      //payments
      x.payment.forEach((y) => {
        const existing = payments.find(
          (z) => z.payment.assetId === y.assetId && z.dApp === x.dApp && senderAddr === x.dApp,
        );
        if (existing) {
          existing.payment.amount = new BigNumber(existing.payment.amount).add(y.amount).toFixed();
        } else {
          payments.push({
            payment: y,
            sender: senderAddr,
            dApp: x.dApp,
          });
        }
      });
      //data
      x.stateChanges.data.forEach((y) => {
        const idx = stateUpdate.data.findIndex((z) => z.key === y.key && z.address === x.dApp);
        if (idx >= 0) {
          stateUpdate.data.splice(idx, 1, { ...y, address: x.dApp });
        } else {
          stateUpdate.data.push({ ...y, address: x.dApp });
        }
      });
      //burns
      x.stateChanges.burns.forEach((y) => {
        const existing = stateUpdate.burns.find((z) => z.assetId === y.assetId);
        if (existing) {
          existing.quantity = new BigNumber(existing.quantity).add(y.quantity).toFixed();
        } else {
          stateUpdate.burns.push({ ...y, address: x.dApp });
        }
      });
      //issues
      x.stateChanges.issues.forEach((y) => {
        stateUpdate.issues.push({ ...y, address: x.dApp });
      });
      //reissues
      x.stateChanges.reissues.forEach((y) => {
        const existing = stateUpdate.reissues.find((z) => z.assetId === y.assetId);
        if (existing) {
          existing.quantity = new BigNumber(existing.quantity).add(y.quantity).toFixed();
        } else {
          stateUpdate.reissues.push({ ...y, address: x.dApp });
        }
      });
      //transfers
      x.stateChanges.transfers.forEach((y) => {
        const existing = stateUpdate.transfers.find(
          (z) => z.asset === y.asset && z.address === y.address && x.dApp === z.sender,
        );
        if (existing) {
          existing.amount = new BigNumber(existing.amount).add(y.amount).toFixed();
        } else {
          stateUpdate.transfers.push({ ...y, sender: x.dApp });
        }
      });
      //sponsorFees
      x.stateChanges.sponsorFees.forEach((y) => {
        const idx = stateUpdate.sponsorFees.findIndex(
          (z) => z.assetId === y.assetId && z.address === x.dApp,
        );
        if (idx >= 0) {
          stateUpdate.sponsorFees.splice(idx, 1, { ...y, address: x.dApp });
        } else {
          stateUpdate.sponsorFees.push({ ...y, address: x.dApp });
        }
      });
      //lease and leaseCancels
      x.stateChanges.leases.forEach((y) => {
        stateUpdate.leases.push({ ...y, sender: x.dApp });
      });
      x.stateChanges.leaseCancels.forEach((y) => {
        stateUpdate.leaseCancels.push({ ...y, address: x.dApp });
      });

      recursiveFunction(x.stateChanges, x.dApp);
    });
  };

  recursiveFunction(stateChanges, sender);
  return stateUpdate;
}
