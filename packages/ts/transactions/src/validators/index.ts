import { aliasValidator as alias } from './alias';
import { authValidator as auth } from './auth';
import { burnValidator as burn } from './burn';
import { cancelLeaseValidator as cancelLease } from './cancel-lease';
import { cancelOrderValidator as cancelOrder } from './cancel-order';
import { commitToGeneractionValidator as commitToGeneraction } from './commit-to-generaction';
import { customDataValidator as customData } from './custom-data';
import { dataValidator as data, dataFieldValidator } from './data';
import { authValidator as dccAuth } from './dccAuth';
import { exchangeValidator as exchange } from './exchange';
import { invokeValidator as invokeScript } from './invoke-script';
import { issueValidator as issue } from './issue';
import { leaseValidator as lease } from './lease';
import { massTransferValidator as massTransfer } from './mass-transfer';
import { orderValidator as order } from './order';
import { reissueValidator as reissue } from './reissue';
import { setAssetScriptValidator as setAssetScript } from './set-asset-script';
import { setScriptValidator as setScript } from './set-script';
import { sponsorshipValidator as sponsorship } from './sponsorship';
import { transferValidator as transfer } from './transfer';
import { updateAssetInfoValidator as updateAssetInfo } from './update-asset-info';

export * from './validators';

export const validate = {
  alias,
  auth,
  burn,
  cancelLease,
  cancelOrder,
  commitToGeneraction,
  customData,
  data,
  dataFieldValidator,
  dccAuth,
  exchange,
  invokeScript,
  issue,
  lease,
  massTransfer,
  order,
  reissue,
  setAssetScript,
  setScript,
  sponsorship,
  transfer,
  updateAssetInfo,
};
