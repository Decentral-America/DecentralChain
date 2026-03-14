import { BigNumber } from '@decentralchain/bignumber';
import { base58Decode, base58Encode, blake2b, verifySignature } from '@decentralchain/crypto';
import { binary } from '@decentralchain/marshall';

import { JSONbn } from '../src/_core/jsonBn';
import {
  type MessageInputCancelOrder,
  type MessageInputCustomData,
  type MessageInputOrder,
  type MessageInputTx,
} from '../src/messages/types';
import {
  makeAuthBytes,
  makeCancelOrderBytes,
  makeCustomDataBytes,
  makeOrderBytes,
  makeTxBytes,
} from '../src/messages/utils';
import { ContentScript } from './helpers/ContentScript';
import { EmptyHomeScreen } from './helpers/EmptyHomeScreen';
import { AccountsHome } from './helpers/flows/AccountsHome';
import { App } from './helpers/flows/App';
import { Network } from './helpers/flows/Network';
import { HomeScreen } from './helpers/HomeScreen';
import { MessagesScreen } from './helpers/MessagesScreen';
import { AssetScriptTransactionScreen } from './helpers/messages/AssetScriptTransactionScreen';
import { AuthMessageScreen } from './helpers/messages/AuthMessageScreen';
import { BurnTransactionScreen } from './helpers/messages/BurnTransactionScreen';
import { CancelOrderTransactionScreen } from './helpers/messages/CancelOrderTransactionScreen';
import { CommonTransaction } from './helpers/messages/CommonTransaction';
import { CreateAliasTransactionScreen } from './helpers/messages/CreateAliasTransactionScreen';
import { CreateOrderMessage } from './helpers/messages/CreateOrderMessage';
import { DataTransactionScreen } from './helpers/messages/DataTransactionScreen';
import { FinalTransactionScreen } from './helpers/messages/FinalTransactionScreen';
import { InvokeScriptTransactionScreen } from './helpers/messages/InvokeScriptTransactionScreen';
import { IssueTransactionScreen } from './helpers/messages/IssueTransactionScreen';
import { LeaseCancelTransactionScreen } from './helpers/messages/LeaseCancelTransactionScreen';
import { LeaseTransactionScreen } from './helpers/messages/LeaseTransactionScreen';
import { MassTransferTransactionScreen } from './helpers/messages/MassTransferTransactionScreen';
import { PackageTransactionScreen } from './helpers/messages/PackageTransactionScreen';
import { ReissueTransactionScreen } from './helpers/messages/ReissueTransactionScreen';
import { SetScriptTransactionScreen } from './helpers/messages/SetScriptTransactionScreen';
import { SponsorshipTransactionScreen } from './helpers/messages/SponsorshipTransactionScreen';
import { TransferTransactionScreen } from './helpers/messages/TransferTransactionScreen';
import { UpdateAssetInfoTransactionScreen } from './helpers/messages/UpdateAssetInfoTransactionScreen';
import { Windows } from './helpers/Windows';
import { CUSTOMLIST, WHITELIST } from './utils/constants';
import { CUSTOM_DATA_V1, CUSTOM_DATA_V2 } from './utils/customData';
import {
  ALIAS,
  BURN,
  BURN_WITH_QUANTITY,
  CANCEL_LEASE,
  DATA,
  INVOKE_SCRIPT,
  INVOKE_SCRIPT_WITHOUT_CALL,
  ISSUE,
  ISSUE_WITHOUT_SCRIPT,
  LEASE,
  LEASE_WITH_ALIAS,
  LEASE_WITH_MONEY_LIKE,
  MASS_TRANSFER,
  MASS_TRANSFER_WITHOUT_ATTACHMENT,
  PACKAGE,
  REISSUE,
  REISSUE_WITH_MONEY_LIKE,
  SET_ASSET_SCRIPT,
  SET_SCRIPT,
  SET_SCRIPT_WITHOUT_SCRIPT,
  SPONSORSHIP,
  SPONSORSHIP_REMOVAL,
  TRANSFER,
  TRANSFER_WITHOUT_ATTACHMENT,
  UPDATE_ASSET_INFO,
} from './utils/transactions';

describe('Signature', () => {
  let tabOrigin: string;
  let messageWindow: string;

  const senderPublicKey = 'AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV';
  const senderPublicKeyBytes = base58Decode(senderPublicKey);

  beforeAll(async () => {
    await App.initVault();
    await Network.switchToAndCheck('Testnet');

    const tabKeeper = await browser.getWindowHandle();

    const { waitForNewWindows } = await Windows.captureNewWindows();
    await EmptyHomeScreen.addButton.click();
    const [tabAccounts] = await waitForNewWindows(1);

    await browser.switchToWindow(tabKeeper);
    await browser.closeWindow();

    await browser.switchToWindow(tabAccounts!);
    await browser.refresh();

    // TODO: Update seed phrase when DCC test node genesis config is set up
    await AccountsHome.importAccount('rich', 'waves private node seed with waves tokens');

    tabOrigin = tabAccounts!;
    await browser.navigateTo(`https://${WHITELIST[3]!}`);
  });

  afterAll(async () => {
    const tabKeeper = (await browser.createWindow('tab')).handle;
    await App.closeBgTabs(tabKeeper);
    await App.resetVault();
  });

  const validateCommonFields = async (address: string, accountName: string, network: string) => {
    await expect(CommonTransaction.originAddress).toHaveText(address);
    await expect(CommonTransaction.accountName).toHaveText(accountName);
    await expect(CommonTransaction.originNetwork).toHaveText(network);
  };

  async function checkThereAreNoMessages() {
    await browser.switchToWindow((await browser.createWindow('tab')).handle);
    await browser.openKeeperPopup();
    await expect(HomeScreen.root).toBeDisplayed();
    await browser.closeWindow();
  }

  function authMessageCall() {
    CubensisConnect.auth({ data: 'hello' });
  }

  async function rejectTransaction({ forever = false } = {}) {
    if (forever) {
      await AuthMessageScreen.rejectArrowButton.click();
      await AuthMessageScreen.addToBlacklistButton.click();
    } else {
      await CommonTransaction.rejectButton.click();
    }
    await FinalTransactionScreen.closeButton.click();
  }

  async function approveTransaction() {
    await CommonTransaction.approveButton.click();
    await browser.pause(100);
    await FinalTransactionScreen.closeButton.click();
  }

  async function getResult() {
    await browser.switchToWindow(tabOrigin);
    return JSON.parse(
      await browser.execute(() => {
        const { result } = window;
        delete window.result;
        return result;
      }),
    );
  }

  async function validateRejectedResult({ data = 'rejected' } = {}) {
    const [status, result] = await getResult();
    expect(status).toBe('REJECTED');
    expect(result).toStrictEqual({
      code: '10',
      data,
      message: 'User denied message',
    });
  }

  describe('Stale messages removal', () => {
    async function triggerMessageWindow(func: () => void, options = { waitForNewWindow: true }) {
      if (options.waitForNewWindow) {
        const { waitForNewWindows } = await Windows.captureNewWindows();
        await ContentScript.waitForCubensisConnect();
        await browser.execute(func);
        [messageWindow] = await waitForNewWindows(1);
      } else {
        await ContentScript.waitForCubensisConnect();
        await browser.execute(func);
      }
      await browser.switchToWindow(messageWindow);
      await browser.refresh();
    }

    it('removes messages and closes window when tab is reloaded', async () => {
      await triggerMessageWindow(authMessageCall);
      await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

      await browser.switchToWindow(tabOrigin);
      await browser.refresh();
      await Windows.waitForWindowToClose(messageWindow);

      await checkThereAreNoMessages();
      await browser.switchToWindow(tabOrigin);
    });

    it('removes messages and closes window when the tab is closed', async () => {
      const newTabOrigin = (await browser.createWindow('tab')).handle;
      await browser.switchToWindow(newTabOrigin);
      await browser.navigateTo(`https://${CUSTOMLIST[1]!}`);

      await triggerMessageWindow(authMessageCall);
      await validateCommonFields(CUSTOMLIST[1]!, 'rich', 'Testnet');

      await browser.switchToWindow(newTabOrigin);
      await browser.closeWindow();
      await browser.switchToWindow(tabOrigin);
      await Windows.waitForWindowToClose(messageWindow);

      await checkThereAreNoMessages();
      await browser.switchToWindow(tabOrigin);
    });

    it('does not close message window, if there are other messages left', async () => {
      await triggerMessageWindow(authMessageCall);
      await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

      const newTabOrigin = (await browser.createWindow('tab')).handle;
      await browser.switchToWindow(newTabOrigin);
      await browser.navigateTo(`https://${CUSTOMLIST[1]!}`);

      await triggerMessageWindow(authMessageCall, { waitForNewWindow: false });
      expect(await MessagesScreen.messagesCards).toHaveLength(2);

      await browser.switchToWindow(newTabOrigin);
      await browser.closeWindow();

      await browser.switchToWindow(messageWindow);
      await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

      await rejectTransaction();
    });
  });

  describe('Permission request from origin', () => {
    async function performPermissionRequest() {
      const { waitForNewWindows } = await Windows.captureNewWindows();
      await ContentScript.waitForCubensisConnect();
      await browser.execute(() => {
        CubensisConnect.publicState().then(
          (result) => {
            window.result = JSON.stringify(['RESOLVED', result]);
          },
          (err) => {
            window.result = JSON.stringify(['REJECTED', err]);
          },
        );
      });
      [messageWindow] = await waitForNewWindows(1);
      await browser.switchToWindow(messageWindow);
      await browser.refresh();
    }

    it('Rejected', async () => {
      await browser.switchToWindow(tabOrigin);
      await browser.navigateTo(`https://${CUSTOMLIST[0]!}`);
      await performPermissionRequest();
      await validateCommonFields(CUSTOMLIST[0]!, 'rich', 'Testnet');
      await rejectTransaction();
      await validateRejectedResult();
    });

    it('Reject forever', async () => {
      await browser.switchToWindow(tabOrigin);
      await browser.navigateTo(`https://${CUSTOMLIST[1]!}`);
      await performPermissionRequest();
      await validateCommonFields(CUSTOMLIST[1]!, 'rich', 'Testnet');
      await rejectTransaction({ forever: true });
      await validateRejectedResult({ data: 'rejected_forever' });
    });

    it('Approved', async () => {
      await browser.switchToWindow(tabOrigin);
      await browser.navigateTo(`https://${CUSTOMLIST[0]!}`);
      await performPermissionRequest();
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');
      expect(result.initialized).toBe(true);
      expect(typeof result.version).toBe('string');
      expect(result.account).toMatchObject({
        address: '3MsX9C2MzzxE4ySF5aYcJoaiPfkyxZMg4cW',
        name: 'rich',
        network: 'testnet',
        networkCode: 'T',
        publicKey: 'AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV',
        type: 'seed',
      });
      expect(result.network).toMatchObject({
        code: 'T',
        matcher: 'https://matcher-testnet.waves.exchange/',
        // TODO: Update test network URLs to DCC endpoints
        server: 'https://nodes-testnet.wavesnodes.com/',
      });
      expect(result.txVersion).toMatchObject({
        '3': [3, 2],
        '4': [3, 2],
        '5': [3, 2],
        '6': [3, 2],
        '8': [3, 2],
        '9': [3, 2],
        '10': [3, 2],
        '11': [2, 1],
        '12': [2, 1],
        '13': [2, 1],
        '14': [2, 1],
        '15': [2, 1],
        '16': [2, 1],
        '17': [1],
        '1000': [1],
        '1001': [1],
        '1002': [4, 3, 2, 1],
        '1003': [1, 0],
      });
    });
  });

  describe('Authentication request from origin', () => {
    async function performAuthRequest() {
      const { waitForNewWindows } = await Windows.captureNewWindows();
      await ContentScript.waitForCubensisConnect();
      await browser.execute(() => {
        CubensisConnect.auth({ data: 'generated auth data' }).then(
          (result) => {
            window.result = JSON.stringify(['RESOLVED', result]);
          },
          (err) => {
            window.result = JSON.stringify(['REJECTED', err]);
          },
        );
      });
      [messageWindow] = await waitForNewWindows(1);
      await browser.switchToWindow(messageWindow);
      await browser.refresh();
    }

    it('Rejected', async () => {
      await browser.navigateTo(`https://${WHITELIST[3]!}`);
      await performAuthRequest();
      await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');
      await rejectTransaction();
      const [status, result] = await getResult();
      expect(status).toBe('REJECTED');
      expect(result).toStrictEqual({
        code: '10',
        data: 'rejected',
        message: 'User denied message',
      });
    });

    it('Approved', async () => {
      await browser.switchToWindow(tabOrigin);
      await browser.navigateTo(`https://${WHITELIST[3]!}`);
      await performAuthRequest();
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');
      const expectedApproveResult = {
        address: '3MsX9C2MzzxE4ySF5aYcJoaiPfkyxZMg4cW',
        host: WHITELIST[3]!,
        // TODO: Wire-format prefix — must match WavesWalletAuthentication signing prefix in production
        prefix: 'WavesWalletAuthentication',
        publicKey: senderPublicKey,
      };
      const bytes = makeAuthBytes({
        data: 'generated auth data',
        host: WHITELIST[3]!,
      });
      expect(result).toMatchObject(expectedApproveResult);
      expect(
        await verifySignature(senderPublicKeyBytes, bytes, base58Decode(result.signature)),
      ).toBe(true);
    });
  });

  describe('Matcher request', () => {
    const timestamp = Date.now();
    async function performMatcherRequest() {
      const { waitForNewWindows } = await Windows.captureNewWindows();
      await ContentScript.waitForCubensisConnect();

      await browser.execute(
        (senderPublicKey: string, timestamp: number) => {
          CubensisConnect.signRequest({
            data: {
              senderPublicKey,
              timestamp,
            },
          }).then(
            (result) => {
              window.result = JSON.stringify(['RESOLVED', result]);
            },
            (err) => {
              window.result = JSON.stringify(['REJECTED', err]);
            },
          );
        },
        senderPublicKey,
        timestamp,
      );
      [messageWindow] = await waitForNewWindows(1);
      await browser.switchToWindow(messageWindow);
      await browser.refresh();
    }

    it('Rejected', async () => {
      await browser.switchToWindow(tabOrigin);
      await browser.navigateTo(`https://${WHITELIST[3]!}`);
      await performMatcherRequest();
      await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');
      await rejectTransaction();
      await validateRejectedResult();
    });

    it('Approved', async () => {
      await browser.switchToWindow(tabOrigin);
      await browser.navigateTo(`https://${WHITELIST[3]!}`);
      await performMatcherRequest();
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');
      const bytes = Uint8Array.of(
        ...senderPublicKeyBytes,
        ...(() => {
          const buf = new ArrayBuffer(8);
          new DataView(buf).setBigInt64(0, BigInt(timestamp));
          return new Uint8Array(buf);
        })(),
      );
      expect(await verifySignature(senderPublicKeyBytes, bytes, base58Decode(result))).toBe(true);
    });
  });

  describe('Transactions', () => {
    async function performSignTransaction(input: MessageInputTx) {
      const { waitForNewWindows } = await Windows.captureNewWindows();
      await ContentScript.waitForCubensisConnect();
      await browser.execute((tx: MessageInputTx) => {
        CubensisConnect.signTransaction(tx).then(
          (result) => {
            window.result = JSON.stringify(['RESOLVED', result]);
          },
          (err) => {
            window.result = JSON.stringify(['REJECTED', err]);
          },
        );
      }, input);
      [messageWindow] = await waitForNewWindows(1);
      await browser.switchToWindow(messageWindow);
      await browser.refresh();
    }

    function setTxVersion<T extends MessageInputTx>(tx: T, version: number): T {
      return { ...tx, data: { ...tx.data, version } };
    }

    describe('Issue', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(ISSUE);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(IssueTransactionScreen.issueType).toHaveText('Issue Smart Token');
        await expect(IssueTransactionScreen.issueAmount).toHaveText(
          '92233720368.54775807 ShortToken',
        );
        await expect(IssueTransactionScreen.issueDescription).toHaveText(ISSUE.data.description);
        await expect(IssueTransactionScreen.issueDecimals).toHaveText(`${ISSUE.data.precision}`);
        await expect(IssueTransactionScreen.issueReissuable).toHaveText('Reissuable');
        await expect(IssueTransactionScreen.contentScript).toHaveText('base64:BQbtKNoM');
        await expect(CommonTransaction.transactionFee).toHaveText('1.004 WAVES');

        await rejectTransaction();
        await validateRejectedResult();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(ISSUE);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          chainId: 84,
          decimals: ISSUE.data.precision,
          description: ISSUE.data.description,
          fee: 100400000,
          name: ISSUE.data.name,
          quantity: new BigNumber(ISSUE.data.quantity),
          reissuable: ISSUE.data.reissuable,
          script: ISSUE.data.script,
          senderPublicKey,
          type: ISSUE.type,
          version: 3 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          quantity: ISSUE.data.quantity,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      it.todo('Copying script to the clipboard');
      describe('without script', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(ISSUE_WITHOUT_SCRIPT);
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(IssueTransactionScreen.issueType).toHaveText('Issue Token');
          await expect(IssueTransactionScreen.issueAmount).toHaveText(
            '92233720368.54775807 ShortToken',
          );
          await expect(IssueTransactionScreen.issueDescription).toHaveText(ISSUE.data.description);
          await expect(IssueTransactionScreen.issueDecimals).toHaveText(`${ISSUE.data.precision}`);
          await expect(IssueTransactionScreen.issueReissuable).toHaveText('Reissuable');
          await expect(CommonTransaction.transactionFee).toHaveText('1.004 WAVES');

          await rejectTransaction();
          await validateRejectedResult();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(ISSUE_WITHOUT_SCRIPT);
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            chainId: 84,
            decimals: ISSUE_WITHOUT_SCRIPT.data.precision,
            description: ISSUE_WITHOUT_SCRIPT.data.description,
            fee: 100400000,
            name: ISSUE_WITHOUT_SCRIPT.data.name,
            quantity: new BigNumber(ISSUE_WITHOUT_SCRIPT.data.quantity),
            reissuable: ISSUE_WITHOUT_SCRIPT.data.reissuable,
            senderPublicKey,
            type: ISSUE_WITHOUT_SCRIPT.type,
            version: 3 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            quantity: ISSUE_WITHOUT_SCRIPT.data.quantity,
            script: null,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.script).toBe(null);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(ISSUE, 2));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(IssueTransactionScreen.issueType).toHaveText('Issue Smart Token');
          await expect(IssueTransactionScreen.issueAmount).toHaveText(
            '92233720368.54775807 ShortToken',
          );
          await expect(IssueTransactionScreen.issueDescription).toHaveText(ISSUE.data.description);
          await expect(IssueTransactionScreen.issueDecimals).toHaveText(`${ISSUE.data.precision}`);
          await expect(IssueTransactionScreen.issueReissuable).toHaveText('Reissuable');
          await expect(IssueTransactionScreen.contentScript).toHaveText('base64:BQbtKNoM');
          await expect(CommonTransaction.transactionFee).toHaveText('1.004 WAVES');

          await rejectTransaction();
          await validateRejectedResult();
        });

        it('Approved', async () => {
          await performSignTransaction(setTxVersion(ISSUE, 2));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            chainId: 84,
            decimals: ISSUE.data.precision,
            description: ISSUE.data.description,
            fee: 100400000,
            name: ISSUE.data.name,
            quantity: new BigNumber(ISSUE.data.quantity),
            reissuable: ISSUE.data.reissuable,
            script: ISSUE.data.script,
            senderPublicKey,
            type: ISSUE.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            quantity: ISSUE.data.quantity,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('Transfer', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(TRANSFER);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(TransferTransactionScreen.transferAmount).toHaveText(
          '-123456790 NonScriptToken',
        );
        await expect(TransferTransactionScreen.recipient).toHaveText('3N5HNJz5otiU...BVv5HhYLdhiD');
        await expect(TransferTransactionScreen.attachmentContent).toHaveText('base64:BQbtKNoM');
        await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');
        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(TRANSFER);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          amount: TRANSFER.data.amount.amount,
          assetId: TRANSFER.data.amount.assetId,
          attachment: '3ke2ct1rnYr52Y1jQvzNG',
          chainId: 84,
          fee: 500000,
          feeAssetId: null,
          recipient: TRANSFER.data.recipient,
          senderPublicKey,
          type: TRANSFER.type,
          version: 3 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      // TODO this checks should be into unittests
      it.todo('Address');
      it.todo('Alias');
      it.todo('Waves / asset / smart asset');
      it.todo('Attachment');
      it.todo('Transfers to Gateways');
      describe('without attachment', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(TRANSFER_WITHOUT_ATTACHMENT);
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(TransferTransactionScreen.transferAmount).toHaveText('-1.23456790 WAVES');
          await expect(TransferTransactionScreen.recipient).toHaveText('alias:T:alice');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(TRANSFER_WITHOUT_ATTACHMENT);
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            amount: TRANSFER_WITHOUT_ATTACHMENT.data.amount.amount,
            assetId: null,
            chainId: 84,
            fee: 500000,
            feeAssetId: null,
            recipient: 'alias:T:alice',
            senderPublicKey,
            type: TRANSFER_WITHOUT_ATTACHMENT.type,
            version: 3 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(TRANSFER, 2));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(TransferTransactionScreen.transferAmount).toHaveText(
            '-123456790 NonScriptToken',
          );
          await expect(TransferTransactionScreen.recipient).toHaveText(
            '3N5HNJz5otiU...BVv5HhYLdhiD',
          );
          await expect(TransferTransactionScreen.attachmentContent).toHaveText('base64:BQbtKNoM');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(TRANSFER, 2));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            amount: TRANSFER.data.amount.amount,
            assetId: TRANSFER.data.amount.assetId,
            attachment: '3ke2ct1rnYr52Y1jQvzNG',
            chainId: 84,
            fee: 500000,
            feeAssetId: null,
            recipient: TRANSFER.data.recipient,
            senderPublicKey,
            type: TRANSFER.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('Reissue', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(REISSUE);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(ReissueTransactionScreen.reissueAmount).toHaveText(
          '+123456790 NonScriptToken',
        );
        await expect(ReissueTransactionScreen.reissuableType).toHaveText('Reissuable');
        await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(REISSUE);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          assetId: REISSUE.data.assetId,
          chainId: 84,
          fee: 500000,
          quantity: REISSUE.data.quantity,
          reissuable: REISSUE.data.reissuable,
          senderPublicKey,
          type: REISSUE.type,
          version: 3 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      describe('with money-like', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(REISSUE_WITH_MONEY_LIKE);
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(ReissueTransactionScreen.reissueAmount).toHaveText(
            '+123456790 NonScriptToken',
          );
          await expect(ReissueTransactionScreen.reissuableType).toHaveText('Reissuable');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(REISSUE_WITH_MONEY_LIKE);
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            assetId: REISSUE_WITH_MONEY_LIKE.data.amount.assetId,
            chainId: 84,
            fee: 500000,
            quantity: REISSUE_WITH_MONEY_LIKE.data.amount.amount,
            reissuable: REISSUE_WITH_MONEY_LIKE.data.reissuable,
            senderPublicKey,
            type: REISSUE_WITH_MONEY_LIKE.type,
            version: 3 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(REISSUE, 2));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(ReissueTransactionScreen.reissueAmount).toHaveText(
            '+123456790 NonScriptToken',
          );
          await expect(ReissueTransactionScreen.reissuableType).toHaveText('Reissuable');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(REISSUE, 2));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            assetId: REISSUE.data.assetId,
            chainId: 84,
            fee: 500000,
            quantity: REISSUE.data.quantity,
            reissuable: REISSUE.data.reissuable,
            senderPublicKey,
            type: REISSUE.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('Burn', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(BURN);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(BurnTransactionScreen.burnAmount).toHaveText('-123456790 NonScriptToken');
        await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(BURN);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          amount: BURN.data.amount,
          assetId: BURN.data.assetId,
          chainId: 84,
          fee: 500000,
          senderPublicKey,
          type: BURN.type,
          version: 3 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      describe('with quantity instead of amount', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(BURN_WITH_QUANTITY);
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(BurnTransactionScreen.burnAmount).toHaveText('-123456790 NonScriptToken');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(BURN_WITH_QUANTITY);
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            amount: BURN_WITH_QUANTITY.data.quantity,
            assetId: BURN_WITH_QUANTITY.data.assetId,
            chainId: 84,
            fee: 500000,
            senderPublicKey,
            type: BURN_WITH_QUANTITY.type,
            version: 3 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(BURN, 2));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(CommonTransaction.originAddress).toHaveText(WHITELIST[3]!);
          await expect(CommonTransaction.accountName).toHaveText('rich');
          await expect(CommonTransaction.originNetwork).toHaveText('Testnet');
          await expect(BurnTransactionScreen.burnAmount).toHaveText('-123456790 NonScriptToken');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(BURN, 2));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            amount: BURN.data.amount,
            assetId: BURN.data.assetId,
            chainId: 84,
            fee: 500000,
            senderPublicKey,
            type: BURN.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('Lease', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(LEASE);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(LeaseTransactionScreen.leaseAmount).toHaveText('1.23456790 WAVES');
        await expect(LeaseTransactionScreen.leaseRecipient).toHaveText(
          '3N5HNJz5otiU...BVv5HhYLdhiD',
        );
        await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(LEASE);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          amount: LEASE.data.amount,
          chainId: 84,
          fee: 500000,
          recipient: LEASE.data.recipient,
          senderPublicKey,
          type: LEASE.type,
          version: 3 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      describe('with alias', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(LEASE_WITH_ALIAS);
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(LeaseTransactionScreen.leaseAmount).toHaveText('1.23456790 WAVES');
          await expect(LeaseTransactionScreen.leaseRecipient).toHaveText('alias:T:bobby');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(LEASE_WITH_ALIAS);
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            amount: LEASE_WITH_ALIAS.data.amount,
            chainId: 84,
            fee: 500000,
            recipient: 'alias:T:bobby',
            senderPublicKey,
            type: LEASE_WITH_ALIAS.type,
            version: 3 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });

      describe('with money-like', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(LEASE_WITH_MONEY_LIKE);
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(LeaseTransactionScreen.leaseAmount).toHaveText('1.23456790 WAVES');
          await expect(LeaseTransactionScreen.leaseRecipient).toHaveText(
            '3N5HNJz5otiU...BVv5HhYLdhiD',
          );
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(LEASE_WITH_MONEY_LIKE);
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            amount: LEASE_WITH_MONEY_LIKE.data.amount.amount,
            chainId: 84,
            fee: 500000,
            recipient: LEASE_WITH_MONEY_LIKE.data.recipient,
            senderPublicKey,
            type: LEASE_WITH_MONEY_LIKE.type,
            version: 3 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(LEASE, 2));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(LeaseTransactionScreen.leaseAmount).toHaveText('1.23456790 WAVES');
          await expect(LeaseTransactionScreen.leaseRecipient).toHaveText(
            '3N5HNJz5otiU...BVv5HhYLdhiD',
          );
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(LEASE, 2));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            amount: LEASE.data.amount,
            chainId: 84,
            fee: 500000,
            recipient: LEASE.data.recipient,
            senderPublicKey,
            type: LEASE.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('Cancel lease', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(CANCEL_LEASE);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(LeaseCancelTransactionScreen.cancelLeaseAmount).toHaveText('0.00000001 WAVES');
        await expect(LeaseCancelTransactionScreen.cancelLeaseRecipient).toHaveText('alias:T:merry');
        await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(CANCEL_LEASE);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          chainId: 84,
          fee: 500000,
          leaseId: CANCEL_LEASE.data.leaseId,
          senderPublicKey,
          type: CANCEL_LEASE.type,
          version: 3 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(CANCEL_LEASE, 2));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(LeaseCancelTransactionScreen.cancelLeaseAmount).toHaveText(
            '0.00000001 WAVES',
          );
          await expect(LeaseCancelTransactionScreen.cancelLeaseRecipient).toHaveText(
            'alias:T:merry',
          );
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(CANCEL_LEASE, 2));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            chainId: 84,
            fee: 500000,
            leaseId: CANCEL_LEASE.data.leaseId,
            senderPublicKey,
            type: CANCEL_LEASE.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('Alias', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(ALIAS);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(CreateAliasTransactionScreen.aliasValue).toHaveText('test_alias');
        await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(ALIAS);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          alias: ALIAS.data.alias,
          chainId: 84,
          fee: 500000,
          senderPublicKey,
          type: ALIAS.type,
          version: 3 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      // TODO this checks should be into unittests
      it.todo('Minimum alias length');
      it.todo('Maximum alias length');
      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(ALIAS, 2));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(CreateAliasTransactionScreen.aliasValue).toHaveText('test_alias');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(ALIAS, 2));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            alias: ALIAS.data.alias,
            chainId: 84,
            fee: 500000,
            senderPublicKey,
            type: ALIAS.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(
            base58Encode(blake2b(Uint8Array.of(bytes[0], ...bytes.subarray(36, -16)))),
          );
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('MassTransfer', () => {
      async function checkMassTransferItems(items: Array<{ recipient: string; amount: string }>) {
        const transferItems = await MassTransferTransactionScreen.getTransferItems();
        const actualItems = await Promise.all(
          transferItems.map(async (transferItem: any) => {
            const [recipient, amount] = await Promise.all([
              transferItem.recipient.getText(),
              transferItem.amount.getText(),
            ]);
            return { amount, recipient };
          }),
        );
        expect(actualItems).toStrictEqual(items);
      }

      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(MASS_TRANSFER);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(MassTransferTransactionScreen.massTransferAmount).toHaveText(
          '-2 NonScriptToken',
        );
        await checkMassTransferItems([
          {
            amount: '1',
            recipient: '3N5HNJz5otiU...BVv5HhYLdhiD',
          },
          {
            amount: '1',
            recipient: 'alias:T:merry',
          },
        ]);
        await expect(MassTransferTransactionScreen.massTransferAttachment).toHaveText(
          'base64:BQbtKNoM',
        );
        await expect(CommonTransaction.transactionFee).toHaveText('0.006 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(MASS_TRANSFER);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          assetId: MASS_TRANSFER.data.totalAmount.assetId,
          attachment: '3ke2ct1rnYr52Y1jQvzNG',
          chainId: 84,
          fee: 600000,
          senderPublicKey,
          transfers: [
            { amount: 1, recipient: '3N5HNJz5otiUavvoPrxMBrXBVv5HhYLdhiD' },
            { amount: 1, recipient: 'alias:T:merry' },
          ],
          type: MASS_TRANSFER.type,
          version: 2 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      describe('without attachment', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(MASS_TRANSFER_WITHOUT_ATTACHMENT);
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(MassTransferTransactionScreen.massTransferAmount).toHaveText(
            '-0.00000123 WAVES',
          );
          await checkMassTransferItems([
            {
              amount: '0.0000012',
              recipient: '3N5HNJz5otiU...BVv5HhYLdhiD',
            },
            {
              amount: '0.00000003',
              recipient: 'alias:T:merry',
            },
          ]);
          await expect(CommonTransaction.transactionFee).toHaveText('0.006 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(MASS_TRANSFER_WITHOUT_ATTACHMENT);
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            assetId: null,
            chainId: 84,
            fee: 600000,
            senderPublicKey,
            transfers: [
              { amount: 120, recipient: '3N5HNJz5otiUavvoPrxMBrXBVv5HhYLdhiD' },
              { amount: 3, recipient: 'alias:T:merry' },
            ],
            type: MASS_TRANSFER_WITHOUT_ATTACHMENT.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(MASS_TRANSFER, 1));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(MassTransferTransactionScreen.massTransferAmount).toHaveText(
            '-2 NonScriptToken',
          );
          await checkMassTransferItems([
            {
              amount: '1',
              recipient: '3N5HNJz5otiU...BVv5HhYLdhiD',
            },
            {
              amount: '1',
              recipient: 'alias:T:merry',
            },
          ]);
          await expect(MassTransferTransactionScreen.massTransferAttachment).toHaveText(
            'base64:BQbtKNoM',
          );
          await expect(CommonTransaction.transactionFee).toHaveText('0.006 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(MASS_TRANSFER, 1));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            assetId: MASS_TRANSFER.data.totalAmount.assetId,
            attachment: '3ke2ct1rnYr52Y1jQvzNG',
            chainId: 84,
            fee: 600000,
            senderPublicKey,
            transfers: [
              { amount: 1, recipient: '3N5HNJz5otiUavvoPrxMBrXBVv5HhYLdhiD' },
              { amount: 1, recipient: 'alias:T:merry' },
            ],
            type: MASS_TRANSFER.type,
            version: 1 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('Data', () => {
      async function checkDataEntries(
        entries: Array<{ key: string; type: string; value: string }>,
      ) {
        const dataRows = await DataTransactionScreen.getDataRows();
        const actualItems = await Promise.all(
          dataRows.map(async (it: any) => {
            const [key, type, value] = await Promise.all([
              it.key.getText(),
              it.type.getText(),
              it.value.getText(),
            ]);
            return { key, type, value };
          }),
        );
        expect(actualItems).toStrictEqual(entries);
      }

      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(DATA);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await checkDataEntries([
          {
            key: 'stringValue',
            type: 'string',
            value: 'Lorem ipsum dolor sit amet',
          },
          {
            key: 'longMaxValue',
            type: 'integer',
            value: '9223372036854775807',
          },
          {
            key: 'flagValue',
            type: 'boolean',
            value: 'true',
          },
          {
            key: 'base64',
            type: 'binary',
            value: 'base64:BQbtKNoM',
          },
        ]);
        await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(DATA);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          chainId: 84,
          data: [
            {
              key: 'stringValue',
              type: 'string',
              value: 'Lorem ipsum dolor sit amet',
            },
            {
              key: 'longMaxValue',
              type: 'integer',
              value: new BigNumber('9223372036854775807'),
            },
            { key: 'flagValue', type: 'boolean', value: true },
            {
              key: 'base64',
              type: 'binary',
              value: 'base64:BQbtKNoM',
            },
          ],
          fee: 500000,
          senderPublicKey,
          type: DATA.type,
          version: 2 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          data: DATA.data.data,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(DATA, 1));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await checkDataEntries([
            {
              key: 'stringValue',
              type: 'string',
              value: 'Lorem ipsum dolor sit amet',
            },
            {
              key: 'longMaxValue',
              type: 'integer',
              value: '9223372036854775807',
            },
            {
              key: 'flagValue',
              type: 'boolean',
              value: 'true',
            },
            {
              key: 'base64',
              type: 'binary',
              value: 'base64:BQbtKNoM',
            },
          ]);
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(DATA, 1));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            chainId: 84,
            data: [
              {
                key: 'stringValue',
                type: 'string',
                value: 'Lorem ipsum dolor sit amet',
              },
              {
                key: 'longMaxValue',
                type: 'integer',
                value: new BigNumber('9223372036854775807'),
              },
              { key: 'flagValue', type: 'boolean', value: true },
              {
                key: 'base64',
                type: 'binary',
                value: 'base64:BQbtKNoM',
              },
            ],
            fee: 500000,
            senderPublicKey,
            type: DATA.type,
            version: 1 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            data: DATA.data.data,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('SetScript', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(SET_SCRIPT);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(SetScriptTransactionScreen.scriptTitle).toHaveText('Set Script');
        await expect(SetScriptTransactionScreen.contentScript).toHaveText('base64:BQbtKNoM');
        await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(SET_SCRIPT);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          chainId: 84,
          fee: 500000,
          script: SET_SCRIPT.data.script,
          senderPublicKey,
          type: SET_SCRIPT.type,
          version: 2 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      it.todo('Copying script to the clipboard');
      it.todo('Set');
      it.todo('Cancel');
      describe('without script', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(SET_SCRIPT_WITHOUT_SCRIPT);
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(SetScriptTransactionScreen.scriptTitle).toHaveText('Remove Account Script');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(SET_SCRIPT_WITHOUT_SCRIPT);
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            chainId: 84,
            fee: 500000,
            senderPublicKey,
            type: SET_SCRIPT_WITHOUT_SCRIPT.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            script: null,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.script).toBe(null);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(SET_SCRIPT, 1));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(SetScriptTransactionScreen.scriptTitle).toHaveText('Set Script');
          await expect(SetScriptTransactionScreen.contentScript).toHaveText('base64:BQbtKNoM');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(SET_SCRIPT, 1));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            chainId: 84,
            fee: 500000,
            script: SET_SCRIPT.data.script,
            senderPublicKey,
            type: SET_SCRIPT.type,
            version: 1 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('Sponsorship', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(SPONSORSHIP);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(SponsorshipTransactionScreen.title).toHaveText('Set Sponsorship');
        await expect(SponsorshipTransactionScreen.amount).toHaveText('123456790 NonScriptToken');
        await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(SPONSORSHIP);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          assetId: SPONSORSHIP.data.minSponsoredAssetFee.assetId,
          chainId: 84,
          fee: 500000,
          minSponsoredAssetFee: SPONSORSHIP.data.minSponsoredAssetFee.amount,
          senderPublicKey,
          type: SPONSORSHIP.type,
          version: 2 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      describe('removal', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(SPONSORSHIP_REMOVAL);
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(SponsorshipTransactionScreen.title).toHaveText('Disable Sponsorship');
          await expect(SponsorshipTransactionScreen.asset).toHaveText('NonScriptToken');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(SPONSORSHIP_REMOVAL);
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            assetId: SPONSORSHIP_REMOVAL.data.minSponsoredAssetFee.assetId,
            chainId: 84,
            fee: 500000,
            minSponsoredAssetFee: null,
            senderPublicKey,
            type: SPONSORSHIP_REMOVAL.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(SPONSORSHIP, 1));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(SponsorshipTransactionScreen.title).toHaveText('Set Sponsorship');
          await expect(SponsorshipTransactionScreen.amount).toHaveText('123456790 NonScriptToken');
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(SPONSORSHIP, 1));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            assetId: SPONSORSHIP.data.minSponsoredAssetFee.assetId,
            chainId: 84,
            fee: 500000,
            minSponsoredAssetFee: SPONSORSHIP.data.minSponsoredAssetFee.amount,
            senderPublicKey,
            type: SPONSORSHIP.type,
            version: 1 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('SetAssetScript', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(SET_ASSET_SCRIPT);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(AssetScriptTransactionScreen.asset).toHaveText('NonScriptToken');
        await expect(AssetScriptTransactionScreen.script).toHaveText('base64:BQbtKNoM');
        await expect(CommonTransaction.transactionFee).toHaveText('1.004 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(SET_ASSET_SCRIPT);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          assetId: SET_ASSET_SCRIPT.data.assetId,
          chainId: 84,
          fee: 100400000,
          script: SET_ASSET_SCRIPT.data.script,
          senderPublicKey,
          type: SET_ASSET_SCRIPT.type,
          version: 2 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      it.todo('Copying script to the clipboard');
      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(SET_ASSET_SCRIPT, 1));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(AssetScriptTransactionScreen.asset).toHaveText('NonScriptToken');
          await expect(AssetScriptTransactionScreen.script).toHaveText('base64:BQbtKNoM');
          await expect(CommonTransaction.transactionFee).toHaveText('1.004 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(SET_ASSET_SCRIPT, 1));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            assetId: SET_ASSET_SCRIPT.data.assetId,
            chainId: 84,
            fee: 100400000,
            script: SET_ASSET_SCRIPT.data.script,
            senderPublicKey,
            type: SET_ASSET_SCRIPT.type,
            version: 1 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('InvokeScript', () => {
      async function checkArgs(args: Array<{ type: string; value: string }>) {
        const invokeArguments = await InvokeScriptTransactionScreen.getArguments();
        const actualArgs = await Promise.all(
          invokeArguments.map(async (it: any) => {
            const [type, value] = await Promise.all([it.type.getText(), it.value.getText()]);
            return {
              type,
              value,
            };
          }),
        );
        expect(actualArgs).toStrictEqual(args);
      }

      async function checkPayments(payments: string[]) {
        const invokePayments = await InvokeScriptTransactionScreen.getPayments();

        const actualPayments = await Promise.all(
          [...invokePayments].map((it: any) => it.getText()),
        );

        expect(actualPayments).toStrictEqual(payments);
      }

      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(INVOKE_SCRIPT);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(InvokeScriptTransactionScreen.paymentsTitle).toHaveText('2 Payments');
        await expect(InvokeScriptTransactionScreen.dApp).toHaveText('3My2kBJaGfeM...3y8rAgfV2EAx');
        await expect(InvokeScriptTransactionScreen.function).toHaveText(
          INVOKE_SCRIPT.data.call.function,
        );
        await checkArgs([
          {
            type: 'integer',
            value: '42',
          },
          {
            type: 'boolean',
            value: 'false',
          },
          {
            type: 'string',
            value: 'hello',
          },
        ]);
        await checkPayments(['0.00000001 WAVES', '1 NonScriptToken']);
        await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(INVOKE_SCRIPT);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          call: INVOKE_SCRIPT.data.call,
          chainId: 84,
          dApp: INVOKE_SCRIPT.data.dApp,
          fee: 500000,
          feeAssetId: null,
          payment: INVOKE_SCRIPT.data.payment,
          senderPublicKey,
          type: INVOKE_SCRIPT.type,
          version: 2 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });

      // TODO this checks should be into unittests
      it.todo('dApp: address / alias');
      it.todo('Function name at max length');
      it.todo('Default function call');
      it.todo('Maximum number of arguments');
      it.todo('Arguments of all types (primitives and List of unions)');
      describe('Payment', () => {
        it.todo('Zero count');
        it.todo('Maximum count');
        it.todo('Waves / asset / smart asset');
      });

      describe('without call', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(INVOKE_SCRIPT_WITHOUT_CALL);
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(InvokeScriptTransactionScreen.paymentsTitle).toHaveText('No Payments');
          await expect(InvokeScriptTransactionScreen.dApp).toHaveText(
            `alias:T:${INVOKE_SCRIPT_WITHOUT_CALL.data.dApp}`,
          );
          await expect(InvokeScriptTransactionScreen.function).toHaveText('default');
          await checkArgs([]);
          await checkPayments([]);
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(INVOKE_SCRIPT_WITHOUT_CALL);
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            chainId: 84,
            dApp: 'alias:T:chris',
            fee: 500000,
            feeAssetId: null,
            payment: INVOKE_SCRIPT_WITHOUT_CALL.data.payment,
            senderPublicKey,
            type: INVOKE_SCRIPT_WITHOUT_CALL.type,
            version: 2 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            call: null,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });

      describe('with legacy serialization', () => {
        it('Rejected', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(INVOKE_SCRIPT, 1));
          await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

          await expect(InvokeScriptTransactionScreen.paymentsTitle).toHaveText('2 Payments');
          await expect(InvokeScriptTransactionScreen.dApp).toHaveText(
            '3My2kBJaGfeM...3y8rAgfV2EAx',
          );
          await expect(InvokeScriptTransactionScreen.function).toHaveText(
            INVOKE_SCRIPT.data.call.function,
          );
          await checkArgs([
            {
              type: 'integer',
              value: '42',
            },
            {
              type: 'boolean',
              value: 'false',
            },
            {
              type: 'string',
              value: 'hello',
            },
          ]);
          await checkPayments(['0.00000001 WAVES', '1 NonScriptToken']);
          await expect(CommonTransaction.transactionFee).toHaveText('0.005 WAVES');

          await rejectTransaction();
        });

        it('Approved', async () => {
          await browser.switchToWindow(tabOrigin);
          await browser.navigateTo(`https://${WHITELIST[3]!}`);
          await performSignTransaction(setTxVersion(INVOKE_SCRIPT, 1));
          await approveTransaction();

          const [status, result] = await getResult();
          expect(status).toBe('RESOLVED');
          const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
          const expectedApproveResult = {
            call: INVOKE_SCRIPT.data.call,
            chainId: 84,
            dApp: INVOKE_SCRIPT.data.dApp,
            fee: 500000,
            feeAssetId: null,
            payment: INVOKE_SCRIPT.data.payment,
            senderPublicKey,
            type: INVOKE_SCRIPT.type,
            version: 1 as const,
          };
          const bytes = makeTxBytes({
            ...expectedApproveResult,
            timestamp: parsedApproveResult.timestamp,
          });
          expect(parsedApproveResult).toMatchObject(expectedApproveResult);
          expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
          expect(
            await verifySignature(
              senderPublicKeyBytes,
              bytes,
              base58Decode(parsedApproveResult.proofs[0]!),
            ),
          ).toBe(true);
        });
      });
    });

    describe('UpdateAssetInfo', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(UPDATE_ASSET_INFO);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(UpdateAssetInfoTransactionScreen.assetId).toHaveText(
          UPDATE_ASSET_INFO.data.assetId,
        );
        await expect(UpdateAssetInfoTransactionScreen.assetName).toHaveText(
          UPDATE_ASSET_INFO.data.name,
        );
        await expect(UpdateAssetInfoTransactionScreen.assetDescription).toHaveText(
          UPDATE_ASSET_INFO.data.description,
        );
        await expect(UpdateAssetInfoTransactionScreen.fee).toHaveText('0.001 WAVES');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignTransaction(UPDATE_ASSET_INFO);
        await approveTransaction();

        const [status, result] = await getResult();
        expect(status).toBe('RESOLVED');
        const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
        const expectedApproveResult = {
          assetId: UPDATE_ASSET_INFO.data.assetId,
          chainId: 84,
          description: UPDATE_ASSET_INFO.data.description,
          fee: 100000,
          name: UPDATE_ASSET_INFO.data.name,
          senderPublicKey,
          type: UPDATE_ASSET_INFO.type,
          version: 1 as const,
        };
        const bytes = makeTxBytes({
          ...expectedApproveResult,
          timestamp: parsedApproveResult.timestamp,
        });
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.proofs[0]!),
          ),
        ).toBe(true);
      });
    });
  });

  describe('Order', () => {
    function createOrder(tx: MessageInputOrder) {
      CubensisConnect.signOrder(tx).then(
        (result) => {
          window.result = result;
        },
        () => {
          window.result = null;
        },
      );
    }

    function cancelOrder(tx: MessageInputCancelOrder) {
      CubensisConnect.signCancelOrder(tx).then(
        (result) => {
          window.result = result;
        },
        () => {
          window.result = null;
        },
      );
    }

    async function performSignOrder(
      script: (tx: MessageInputOrder) => void,
      tx: MessageInputOrder,
    ) {
      const { waitForNewWindows } = await Windows.captureNewWindows();
      await ContentScript.waitForCubensisConnect();
      await browser.execute(script, tx);
      [messageWindow] = await waitForNewWindows(1);
      await browser.switchToWindow(messageWindow);
      await browser.refresh();
    }

    async function performSignCancelOrder(
      script: (tx: MessageInputCancelOrder) => void,
      tx: MessageInputCancelOrder,
    ) {
      const { waitForNewWindows } = await Windows.captureNewWindows();
      await ContentScript.waitForCubensisConnect();
      await browser.execute(script, tx);
      [messageWindow] = await waitForNewWindows(1);
      await browser.switchToWindow(messageWindow);
      await browser.refresh();
    }

    describe('Create', () => {
      describe('version 3', () => {
        describe('basic', () => {
          const INPUT = {
            data: {
              amount: {
                assetId: 'WAVES',
                tokens: '100',
              },
              expiration: Date.now() + 100000,
              matcherFee: {
                assetId: 'WAVES',
                tokens: '0.03',
              },
              matcherPublicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
              orderType: 'sell',
              price: {
                assetId: '7sP5abE9nGRwZxkgaEXgkQDZ3ERBcm9PLHixaUE5SYoT',
                tokens: '0.01',
              },
            },
          } as const;

          it('Rejected', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

            await expect(CreateOrderMessage.orderTitle).toHaveText('Sell: WAVES/NonScriptToken');
            await expect(CreateOrderMessage.orderAmount).toHaveText('-100.00000000 WAVES');
            await expect(CreateOrderMessage.orderPriceTitle).toHaveText('+0 NonScriptToken');
            await expect(CreateOrderMessage.orderPrice).toHaveText('0 NonScriptToken');
            await expect(CreateOrderMessage.orderMatcherPublicKey).toHaveText(
              INPUT.data.matcherPublicKey,
            );
            await expect(CreateOrderMessage.createOrderFee).toHaveText('0.03 WAVES');

            await rejectTransaction();
          });

          it('Approved', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await approveTransaction();

            const parsedApproveResult = await getResult();
            const expectedApproveResult = {
              amount: 10000000000,
              assetPair: {
                amountAsset: null,
                priceAsset: INPUT.data.price.assetId,
              },
              matcherFee: 3000000,
              matcherFeeAssetId: null,
              matcherPublicKey: INPUT.data.matcherPublicKey,
              orderType: INPUT.data.orderType,
              price: 0,
              senderPublicKey,
              version: 3,
            };
            const bytes = binary.serializeOrder({
              ...expectedApproveResult,
              expiration: parsedApproveResult.expiration,
              timestamp: parsedApproveResult.timestamp,
            });
            expect(parsedApproveResult).toMatchObject(expectedApproveResult);
            expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
            expect(
              await verifySignature(
                senderPublicKeyBytes,
                bytes,
                base58Decode(parsedApproveResult.proofs[0]!),
              ),
            ).toBe(true);
          });
        });

        describe('with price precision conversion', () => {
          const INPUT = {
            data: {
              amount: {
                assetId: '5Sh9KghfkZyhjwuodovDhB6PghDUGBHiAPZ4MkrPgKtX',
                tokens: '1.000000',
              },
              expiration: Date.now() + 100000,
              matcherFee: {
                assetId: 'EMAMLxDnv3xiz8RXg8Btj33jcEw3wLczL3JKYYmuubpc',
                tokens: '0.04077612',
              },
              matcherPublicKey: '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy',
              orderType: 'buy',
              price: {
                assetId: '25FEqEjRkqK6yCkiT7Lz6SAYz7gUFCtxfCChnrVFD5AT',
                tokens: '1.014002',
              },
            },
          } as const;

          it('Rejected', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

            await expect(CreateOrderMessage.orderTitle).toHaveText('Buy: Tether USD/USD-Nea272c');
            await expect(CreateOrderMessage.orderAmount).toHaveText('+1.000000 Tether USD');
            await expect(CreateOrderMessage.orderPriceTitle).toHaveText('-1.014002 USD-Nea272c');
            await expect(CreateOrderMessage.orderPrice).toHaveText('1.014002 USD-Nea272c');
            await expect(CreateOrderMessage.orderMatcherPublicKey).toHaveText(
              INPUT.data.matcherPublicKey,
            );
            await expect(CreateOrderMessage.createOrderFee).toHaveText('0.04077612 TXW-DEVa4f6df');

            await rejectTransaction();
          });

          it('Approved', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await approveTransaction();

            const parsedApproveResult = await getResult();
            const expectedApproveResult = {
              amount: 1000000,
              assetPair: {
                amountAsset: INPUT.data.amount.assetId,
                priceAsset: INPUT.data.price.assetId,
              },
              matcherFee: 4077612,
              matcherFeeAssetId: 'EMAMLxDnv3xiz8RXg8Btj33jcEw3wLczL3JKYYmuubpc',
              matcherPublicKey: INPUT.data.matcherPublicKey,
              orderType: INPUT.data.orderType,
              price: 101400200,
              senderPublicKey,
              version: 3,
            };
            const bytes = binary.serializeOrder({
              ...expectedApproveResult,
              expiration: parsedApproveResult.expiration,
              timestamp: parsedApproveResult.timestamp,
            });
            expect(parsedApproveResult).toMatchObject(expectedApproveResult);
            expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
            expect(
              await verifySignature(
                senderPublicKeyBytes,
                bytes,
                base58Decode(parsedApproveResult.proofs[0]!),
              ),
            ).toBe(true);
          });
        });

        describe('with different decimals', () => {
          const INPUT = {
            data: {
              amount: {
                assetId: '5Sh9KghfkZyhjwuodovDhB6PghDUGBHiAPZ4MkrPgKtX',
                coins: 15637504,
              },
              expiration: Date.now() + 100000,
              matcherFee: {
                assetId: 'EMAMLxDnv3xiz8RXg8Btj33jcEw3wLczL3JKYYmuubpc',
                tokens: '0.04077612',
              },
              matcherPublicKey: '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy',
              orderType: 'buy',
              price: {
                assetId: 'WAVES',
                coins: 121140511,
              },
            },
          } as const;

          it('Rejected', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

            await expect(CreateOrderMessage.orderTitle).toHaveText('Buy: Tether USD/WAVES');
            await expect(CreateOrderMessage.orderAmount).toHaveText('+15.637504 Tether USD');
            await expect(CreateOrderMessage.orderPriceTitle).toHaveText('-18.94335225 WAVES');
            await expect(CreateOrderMessage.orderPrice).toHaveText('1.21140511 WAVES');
            await expect(CreateOrderMessage.orderMatcherPublicKey).toHaveText(
              INPUT.data.matcherPublicKey,
            );
            await expect(CreateOrderMessage.createOrderFee).toHaveText('0.04077612 TXW-DEVa4f6df');

            await rejectTransaction();
          });

          it('Approved', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await approveTransaction();

            const parsedApproveResult = await getResult();
            const expectedApproveResult = {
              amount: 15637504,
              assetPair: {
                amountAsset: INPUT.data.amount.assetId,
                priceAsset: null,
              },
              matcherFee: 4077612,
              matcherFeeAssetId: 'EMAMLxDnv3xiz8RXg8Btj33jcEw3wLczL3JKYYmuubpc',
              matcherPublicKey: INPUT.data.matcherPublicKey,
              orderType: INPUT.data.orderType,
              price: 12114051100,
              senderPublicKey,
              version: 3,
            };
            const bytes = binary.serializeOrder({
              ...expectedApproveResult,
              expiration: parsedApproveResult.expiration,
              timestamp: parsedApproveResult.timestamp,
            });
            expect(parsedApproveResult).toMatchObject(expectedApproveResult);
            expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
            expect(
              await verifySignature(
                senderPublicKeyBytes,
                bytes,
                base58Decode(parsedApproveResult.proofs[0]!),
              ),
            ).toBe(true);
          });
        });
      });

      describe('version 4', () => {
        describe('with assetDecimals priceMode', () => {
          const INPUT = {
            data: {
              amount: {
                assetId: '5Sh9KghfkZyhjwuodovDhB6PghDUGBHiAPZ4MkrPgKtX',
                tokens: '1.000000',
              },
              expiration: Date.now() + 100000,
              matcherFee: {
                assetId: 'EMAMLxDnv3xiz8RXg8Btj33jcEw3wLczL3JKYYmuubpc',
                tokens: '0.04077612',
              },
              matcherPublicKey: '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy',
              orderType: 'buy',
              price: {
                assetId: '25FEqEjRkqK6yCkiT7Lz6SAYz7gUFCtxfCChnrVFD5AT',
                tokens: '1.014002',
              },
              priceMode: 'assetDecimals',
              version: 4,
            },
          } as const;

          it('Rejected', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

            await expect(CreateOrderMessage.orderTitle).toHaveText('Buy: Tether USD/USD-Nea272c');
            await expect(CreateOrderMessage.orderAmount).toHaveText('+1.000000 Tether USD');
            await expect(CreateOrderMessage.orderPriceTitle).toHaveText('-1.014002 USD-Nea272c');
            await expect(CreateOrderMessage.orderPrice).toHaveText('1.014002 USD-Nea272c');
            await expect(CreateOrderMessage.orderMatcherPublicKey).toHaveText(
              INPUT.data.matcherPublicKey,
            );
            await expect(CreateOrderMessage.createOrderFee).toHaveText('0.04077612 TXW-DEVa4f6df');

            await rejectTransaction();
          });

          it('Approved', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await approveTransaction();

            const parsedApproveResult = await getResult();
            const expectedApproveResult = {
              amount: 1000000,
              assetPair: {
                amountAsset: INPUT.data.amount.assetId,
                priceAsset: INPUT.data.price.assetId,
              },
              chainId: 84,
              matcherFee: 4077612,
              matcherFeeAssetId: 'EMAMLxDnv3xiz8RXg8Btj33jcEw3wLczL3JKYYmuubpc',
              matcherPublicKey: INPUT.data.matcherPublicKey,
              orderType: INPUT.data.orderType,
              price: 101400200,
              priceMode: 'assetDecimals' as const,
              senderPublicKey,
              version: 4 as const,
            };
            const bytes = makeOrderBytes({
              ...expectedApproveResult,
              expiration: parsedApproveResult.expiration,
              timestamp: parsedApproveResult.timestamp,
            });
            expect(parsedApproveResult).toMatchObject(expectedApproveResult);
            expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
            expect(
              await verifySignature(
                senderPublicKeyBytes,
                bytes,
                base58Decode(parsedApproveResult.proofs[0]!),
              ),
            ).toBe(true);
          });
        });

        describe('with fixedDecimals priceMode', () => {
          const INPUT = {
            data: {
              amount: {
                assetId: '5Sh9KghfkZyhjwuodovDhB6PghDUGBHiAPZ4MkrPgKtX',
                tokens: '1.000000',
              },
              expiration: Date.now() + 100000,
              matcherFee: {
                assetId: 'EMAMLxDnv3xiz8RXg8Btj33jcEw3wLczL3JKYYmuubpc',
                tokens: '0.04077612',
              },
              matcherPublicKey: '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy',
              orderType: 'buy',
              price: {
                assetId: '25FEqEjRkqK6yCkiT7Lz6SAYz7gUFCtxfCChnrVFD5AT',
                tokens: '1.014002',
              },
              priceMode: 'fixedDecimals',
              version: 4,
            },
          } as const;

          it('Rejected', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

            await expect(CreateOrderMessage.orderTitle).toHaveText('Buy: Tether USD/USD-Nea272c');
            await expect(CreateOrderMessage.orderAmount).toHaveText('+1.000000 Tether USD');
            await expect(CreateOrderMessage.orderPriceTitle).toHaveText('-1.014002 USD-Nea272c');
            await expect(CreateOrderMessage.orderPrice).toHaveText('1.014002 USD-Nea272c');
            await expect(CreateOrderMessage.orderMatcherPublicKey).toHaveText(
              INPUT.data.matcherPublicKey,
            );
            await expect(CreateOrderMessage.createOrderFee).toHaveText('0.04077612 TXW-DEVa4f6df');

            await rejectTransaction();
          });

          it('Approved', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await approveTransaction();

            const parsedApproveResult = await getResult();
            const expectedApproveResult = {
              amount: 1000000,
              assetPair: {
                amountAsset: INPUT.data.amount.assetId,
                priceAsset: INPUT.data.price.assetId,
              },
              chainId: 84,
              matcherFee: 4077612,
              matcherFeeAssetId: 'EMAMLxDnv3xiz8RXg8Btj33jcEw3wLczL3JKYYmuubpc',
              matcherPublicKey: INPUT.data.matcherPublicKey,
              orderType: INPUT.data.orderType,
              price: 101400200,
              priceMode: 'fixedDecimals' as const,
              senderPublicKey,
              version: 4 as const,
            };
            const bytes = makeOrderBytes({
              ...expectedApproveResult,
              expiration: parsedApproveResult.expiration,
              timestamp: parsedApproveResult.timestamp,
            });
            expect(parsedApproveResult).toMatchObject(expectedApproveResult);
            expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
            expect(
              await verifySignature(
                senderPublicKeyBytes,
                bytes,
                base58Decode(parsedApproveResult.proofs[0]!),
              ),
            ).toBe(true);
          });
        });

        describe('without priceMode', () => {
          const INPUT = {
            data: {
              amount: {
                assetId: '5Sh9KghfkZyhjwuodovDhB6PghDUGBHiAPZ4MkrPgKtX',
                tokens: '1.000000',
              },
              expiration: Date.now() + 100000,
              matcherFee: {
                assetId: 'EMAMLxDnv3xiz8RXg8Btj33jcEw3wLczL3JKYYmuubpc',
                tokens: '0.04077612',
              },
              matcherPublicKey: '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy',
              orderType: 'buy',
              price: {
                assetId: '25FEqEjRkqK6yCkiT7Lz6SAYz7gUFCtxfCChnrVFD5AT',
                tokens: '1.014002',
              },
              version: 4,
            },
          } as const;

          it('Rejected', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

            await expect(CreateOrderMessage.orderTitle).toHaveText('Buy: Tether USD/USD-Nea272c');
            await expect(CreateOrderMessage.orderAmount).toHaveText('+1.000000 Tether USD');
            await expect(CreateOrderMessage.orderPriceTitle).toHaveText('-1.014002 USD-Nea272c');
            await expect(CreateOrderMessage.orderPrice).toHaveText('1.014002 USD-Nea272c');
            await expect(CreateOrderMessage.orderMatcherPublicKey).toHaveText(
              INPUT.data.matcherPublicKey,
            );
            await expect(CreateOrderMessage.createOrderFee).toHaveText('0.04077612 TXW-DEVa4f6df');

            await rejectTransaction();
          });

          it('Approved', async () => {
            await browser.switchToWindow(tabOrigin);
            await browser.navigateTo(`https://${WHITELIST[3]!}`);
            await performSignOrder(createOrder, INPUT);
            await approveTransaction();

            const parsedApproveResult = await getResult();
            const expectedApproveResult = {
              amount: 1000000,
              assetPair: {
                amountAsset: INPUT.data.amount.assetId,
                priceAsset: INPUT.data.price.assetId,
              },
              chainId: 84,
              matcherFee: 4077612,
              matcherFeeAssetId: 'EMAMLxDnv3xiz8RXg8Btj33jcEw3wLczL3JKYYmuubpc',
              matcherPublicKey: INPUT.data.matcherPublicKey,
              orderType: INPUT.data.orderType,
              price: 101400200,
              priceMode: 'fixedDecimals' as const,
              senderPublicKey,
              version: 4 as const,
            };
            const bytes = makeOrderBytes({
              ...expectedApproveResult,
              expiration: parsedApproveResult.expiration,
              timestamp: parsedApproveResult.timestamp,
            });
            expect(parsedApproveResult).toMatchObject(expectedApproveResult);
            expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
            expect(
              await verifySignature(
                senderPublicKeyBytes,
                bytes,
                base58Decode(parsedApproveResult.proofs[0]!),
              ),
            ).toBe(true);
          });
        });
      });
    });

    describe('Cancel', () => {
      const INPUT = {
        amountAsset: '',
        data: { id: '31EeVpTAronk95TjCHdyaveDukde4nDr9BfFpvhZ3Sap' },
        priceAsset: '',
      };

      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignCancelOrder(cancelOrder, INPUT);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(CancelOrderTransactionScreen.orderId).toHaveText(INPUT.data.id);

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignCancelOrder(cancelOrder, INPUT);
        await approveTransaction();

        const parsedApproveResult = await getResult();
        const expectedApproveResult = {
          orderId: INPUT.data.id,
          sender: senderPublicKey,
        };
        const bytes = makeCancelOrderBytes(expectedApproveResult);
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            bytes,
            base58Decode(parsedApproveResult.signature),
          ),
        ).toBe(true);
      });
    });
  });

  describe('Multiple transactions package', () => {
    async function performSignTransactionPackage(tx: MessageInputTx[], name: string) {
      const { waitForNewWindows } = await Windows.captureNewWindows();
      await ContentScript.waitForCubensisConnect();
      await browser.execute(
        (tx: MessageInputTx[], name: string) => {
          CubensisConnect.signTransactionPackage(tx, name).then(
            (result) => {
              window.result = result;
            },
            () => {
              window.result = null;
            },
          );
        },
        tx,
        name,
      );
      [messageWindow] = await waitForNewWindows(1);
      await browser.switchToWindow(messageWindow);
      await browser.refresh();
    }

    async function checkPackageAmounts(amounts: string[]) {
      const actualAmounts = await Promise.all(
        await PackageTransactionScreen.packageAmounts.map(async (it: any) => await it.getText()),
      );
      expect(actualAmounts).toStrictEqual(amounts);
    }

    async function checkPackageFees(fees: string[]) {
      const actualFees = await Promise.all(
        await PackageTransactionScreen.packageFees.map(async (it: any) => await it.getText()),
      );
      expect(actualFees).toStrictEqual(fees);
    }

    it('Rejected', async () => {
      await browser.switchToWindow(tabOrigin);
      await browser.navigateTo(`https://${WHITELIST[3]!}`);
      await performSignTransactionPackage(PACKAGE, 'Test package');
      await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

      await expect(PackageTransactionScreen.packageCountTitle).toHaveText('7 Transactions');
      await checkPackageAmounts([
        '+92233720368.54775807 ShortToken',
        '-123456790 NonScriptToken',
        '+123456790 NonScriptToken',
        '-123456790 NonScriptToken',
        '-1.23456790 WAVES',
        '+0.00000001 WAVES',
        '-0.00000001 WAVES',
        '-1 NonScriptToken',
      ]);
      await checkPackageFees(['1.034 WAVES']);
      await PackageTransactionScreen.showTransactionsButton.click();
      expect(await PackageTransactionScreen.getPackageItems()).toHaveLength(7);

      const [issue, transfer, reissue, burn, lease, cancelLease, invokeScript] =
        await PackageTransactionScreen.getPackageItems();

      await expect(issue.type).toHaveText('Issue Smart Token');
      await expect(issue.amount).toHaveText('92233720368.54775807 ShortToken');
      await expect(issue.description).toHaveText('Full description of ShortToken');
      await expect(issue.decimals).toHaveText('8');
      await expect(issue.reissuable).toHaveText('Reissuable');
      await expect(issue.contentScript).toHaveText('base64:BQbtKNoM');
      await expect(issue.fee).toHaveText('1.004 WAVES');

      await expect(transfer.transferAmount).toHaveText('-123456790 NonScriptToken');
      await expect(transfer.recipient).toHaveText('3N5HNJz5otiU...BVv5HhYLdhiD');
      await expect(transfer.attachmentContent).toHaveText('base64:BQbtKNoM');
      await expect(transfer.fee).toHaveText('0.005 WAVES');

      await expect(reissue.reissueAmount).toHaveText('+123456790 NonScriptToken');
      await expect(reissue.fee).toHaveText('0.005 WAVES');

      await expect(burn.burnAmount).toHaveText('-123456790 NonScriptToken');
      await expect(burn.fee).toHaveText('0.005 WAVES');

      await expect(lease.leaseAmount).toHaveText('1.23456790 WAVES');
      await expect(lease.leaseRecipient).toHaveText('3N5HNJz5otiU...BVv5HhYLdhiD');
      await expect(lease.fee).toHaveText('0.005 WAVES');

      await expect(cancelLease.cancelLeaseAmount).toHaveText('0.00000001 WAVES');
      await expect(cancelLease.cancelLeaseRecipient).toHaveText('alias:T:merry');
      await expect(cancelLease.fee).toHaveText('0.005 WAVES');

      await expect(invokeScript.invokeScriptPaymentsTitle).toHaveText('2 Payments');
      await expect(invokeScript.invokeScriptDApp).toHaveText('3My2kBJaGfeM...3y8rAgfV2EAx');
      await expect(invokeScript.invokeScriptFunction).toHaveText(INVOKE_SCRIPT.data.call.function);

      const invokeArguments = await invokeScript.getInvokeArguments();
      const actualArgs = await Promise.all(
        invokeArguments.map(async (it: any) => {
          const [type, value] = await Promise.all([it.type.getText(), it.value.getText()]);
          return { type, value };
        }),
      );
      expect(actualArgs).toStrictEqual([
        {
          type: 'integer',
          value: '42',
        },
        {
          type: 'boolean',
          value: 'false',
        },
        {
          type: 'string',
          value: 'hello',
        },
      ]);

      const actualPayments = await Promise.all(
        await invokeScript.invokeScriptPaymentItems.map(async (it: any) => it.getText()),
      );
      expect(actualPayments).toStrictEqual(['0.00000001 WAVES', '1 NonScriptToken']);

      await expect(invokeScript.fee).toHaveText('0.005 WAVES');

      await rejectTransaction();
    });

    it('Approved', async () => {
      await browser.switchToWindow(tabOrigin);
      await browser.navigateTo(`https://${WHITELIST[3]!}`);
      await performSignTransactionPackage(PACKAGE, 'Test package');
      await approveTransaction();

      await browser.switchToWindow(tabOrigin);
      const approvedResult = await browser.execute<string[], []>(() => window.result);
      expect(approvedResult).toHaveLength(7);

      const parsedApproveResult = approvedResult.map<{
        id: string;
        proofs: string[];
        timestamp: number;
      }>((result) => JSONbn.parse(result) as { id: string; proofs: string[]; timestamp: number });

      const tx0 = parsedApproveResult[0]!;
      const tx1 = parsedApproveResult[1]!;
      const tx2 = parsedApproveResult[2]!;
      const tx3 = parsedApproveResult[3]!;
      const tx4 = parsedApproveResult[4]!;
      const tx5 = parsedApproveResult[5]!;
      const tx6 = parsedApproveResult[6]!;
      const expectedApproveResult0 = {
        chainId: 84,
        decimals: ISSUE.data.precision,
        description: ISSUE.data.description,
        fee: 100400000,
        name: ISSUE.data.name,
        quantity: new BigNumber(ISSUE.data.quantity),
        reissuable: ISSUE.data.reissuable,
        script: ISSUE.data.script,
        senderPublicKey,
        type: ISSUE.type,
        version: 3 as const,
      };
      const bytes0 = makeTxBytes({
        ...expectedApproveResult0,
        quantity: ISSUE.data.quantity,
        timestamp: tx0.timestamp,
      });
      expect(tx0).toMatchObject(expectedApproveResult0);
      expect(tx0.id).toBe(base58Encode(blake2b(bytes0)));
      expect(
        await verifySignature(senderPublicKeyBytes, bytes0, base58Decode(tx0.proofs[0]!)),
      ).toBe(true);

      const expectedApproveResult1 = {
        amount: TRANSFER.data.amount.amount,
        assetId: TRANSFER.data.amount.assetId,
        attachment: '3ke2ct1rnYr52Y1jQvzNG',
        chainId: 84,
        fee: 500000,
        feeAssetId: null,
        recipient: TRANSFER.data.recipient,
        senderPublicKey,
        type: TRANSFER.type,
        version: 3 as const,
      };
      const bytes1 = makeTxBytes({
        ...expectedApproveResult1,
        timestamp: tx1.timestamp,
      });
      expect(tx1).toMatchObject(expectedApproveResult1);
      expect(tx1.id).toBe(base58Encode(blake2b(bytes1)));
      expect(
        await verifySignature(senderPublicKeyBytes, bytes1, base58Decode(tx1.proofs[0]!)),
      ).toBe(true);

      const expectedApproveResult2 = {
        assetId: REISSUE.data.assetId,
        chainId: 84,
        fee: 500000,
        quantity: REISSUE.data.quantity,
        reissuable: REISSUE.data.reissuable,
        senderPublicKey,
        type: REISSUE.type,
        version: 3 as const,
      };
      const bytes2 = makeTxBytes({
        ...expectedApproveResult2,
        timestamp: tx2.timestamp,
      });
      expect(tx2).toMatchObject(expectedApproveResult2);
      expect(tx2.id).toBe(base58Encode(blake2b(bytes2)));
      expect(
        await verifySignature(senderPublicKeyBytes, bytes2, base58Decode(tx2.proofs[0]!)),
      ).toBe(true);

      const expectedApproveResult3 = {
        amount: BURN.data.amount,
        assetId: BURN.data.assetId,
        chainId: 84,
        fee: 500000,
        senderPublicKey,
        type: BURN.type,
        version: 3 as const,
      };
      const bytes3 = makeTxBytes({
        ...expectedApproveResult3,
        timestamp: tx3.timestamp,
      });
      expect(tx3).toMatchObject(expectedApproveResult3);
      expect(tx3.id).toBe(base58Encode(blake2b(bytes3)));
      expect(
        await verifySignature(senderPublicKeyBytes, bytes3, base58Decode(tx3.proofs[0]!)),
      ).toBe(true);

      const expectedApproveResult4 = {
        amount: LEASE.data.amount,
        chainId: 84,
        fee: 500000,
        recipient: LEASE.data.recipient,
        senderPublicKey,
        type: LEASE.type,
        version: 3 as const,
      };
      const bytes4 = makeTxBytes({
        ...expectedApproveResult4,
        timestamp: tx4.timestamp,
      });
      expect(tx4).toMatchObject(expectedApproveResult4);
      expect(tx4.id).toBe(base58Encode(blake2b(bytes4)));
      expect(
        await verifySignature(senderPublicKeyBytes, bytes4, base58Decode(tx4.proofs[0]!)),
      ).toBe(true);

      const expectedApproveResult5 = {
        chainId: 84,
        fee: 500000,
        leaseId: CANCEL_LEASE.data.leaseId,
        senderPublicKey,
        type: CANCEL_LEASE.type,
        version: 3 as const,
      };
      const bytes5 = makeTxBytes({
        ...expectedApproveResult5,
        timestamp: tx5.timestamp,
      });
      expect(tx5).toMatchObject(expectedApproveResult5);
      expect(tx5.id).toBe(base58Encode(blake2b(bytes5)));
      expect(
        await verifySignature(senderPublicKeyBytes, bytes5, base58Decode(tx5.proofs[0]!)),
      ).toBe(true);

      const expectedApproveResult6 = {
        call: INVOKE_SCRIPT.data.call,
        chainId: 84,
        dApp: INVOKE_SCRIPT.data.dApp,
        fee: 500000,
        feeAssetId: null,
        payment: INVOKE_SCRIPT.data.payment,
        senderPublicKey,
        type: INVOKE_SCRIPT.type,
        version: 2 as const,
      };
      const bytes6 = makeTxBytes({
        ...expectedApproveResult6,
        timestamp: tx6.timestamp,
      });
      expect(tx6).toMatchObject(expectedApproveResult6);
      expect(tx6.id).toBe(base58Encode(blake2b(bytes6)));
      expect(
        await verifySignature(senderPublicKeyBytes, bytes6, base58Decode(tx6.proofs[0]!)),
      ).toBe(true);
    });
  });

  describe('Custom data', () => {
    async function performSignCustomData(data: MessageInputCustomData) {
      const { waitForNewWindows } = await Windows.captureNewWindows();
      await ContentScript.waitForCubensisConnect();
      await browser.execute((data: MessageInputCustomData) => {
        CubensisConnect.signCustomData(data).then(
          (result) => {
            window.result = JSON.stringify(result);
          },
          () => {
            window.result = null;
          },
        );
      }, data);
      [messageWindow] = await waitForNewWindows(1);
      await browser.switchToWindow(messageWindow);
      await browser.refresh();
    }

    describe('Version 1', () => {
      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignCustomData(CUSTOM_DATA_V1);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await expect(DataTransactionScreen.contentScript).toHaveText('base64:AADDEE==');

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignCustomData(CUSTOM_DATA_V1);
        await approveTransaction();

        const parsedApproveResult = await getResult();
        const expectedApproveResult = {
          binary: CUSTOM_DATA_V1.binary,
          hash: 'BddvukE8EsQ22TC916wr9hxL5MTinpcxj7cKmyQFu1Qj',
          publicKey: senderPublicKey,
          version: CUSTOM_DATA_V1.version,
        };
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            makeCustomDataBytes(expectedApproveResult),
            base58Decode(parsedApproveResult.signature),
          ),
        ).toBe(true);
      });
    });

    describe('Version 2', () => {
      async function checkDataEntries(
        entries: Array<{ key: string; type: string; value: string }>,
      ) {
        const actualItems = await Promise.all(
          (await DataTransactionScreen.getDataRows()).map(async (it: any) => {
            const [key, type, value] = await Promise.all([
              it.key.getText(),
              it.type.getText(),
              it.value.getText(),
            ]);
            return {
              key,
              type,
              value,
            };
          }),
        );

        expect(actualItems).toStrictEqual(entries);
      }

      it('Rejected', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignCustomData(CUSTOM_DATA_V2);
        await validateCommonFields(WHITELIST[3]!, 'rich', 'Testnet');

        await checkDataEntries([
          {
            key: 'stringValue',
            type: 'string',
            value: 'Lorem ipsum dolor sit amet',
          },
          {
            key: 'longMaxValue',
            type: 'integer',
            value: '9223372036854775807',
          },
          {
            key: 'flagValue',
            type: 'boolean',
            value: 'true',
          },
          {
            key: 'base64',
            type: 'binary',
            value: 'base64:BQbtKNoM',
          },
        ]);

        await rejectTransaction();
      });

      it('Approved', async () => {
        await browser.switchToWindow(tabOrigin);
        await browser.navigateTo(`https://${WHITELIST[3]!}`);
        await performSignCustomData(CUSTOM_DATA_V2);
        await approveTransaction();

        const parsedApproveResult = await getResult();
        const expectedApproveResult = {
          data: CUSTOM_DATA_V2.data,
          hash: 'CntDRDubtuhwBKsmCTtZzMLVF9TFK6hLoWP424V8Zz2K',
          publicKey: senderPublicKey,
          version: CUSTOM_DATA_V2.version,
        };
        expect(parsedApproveResult).toMatchObject(expectedApproveResult);
        expect(
          await verifySignature(
            senderPublicKeyBytes,
            makeCustomDataBytes(expectedApproveResult),
            base58Decode(parsedApproveResult.signature),
          ),
        ).toBe(true);
      });
    });
  });
});
