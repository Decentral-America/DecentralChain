import {
  base58Decode,
  base58Encode,
  blake2b,
  createAddress,
  createPrivateKey,
  createPublicKey,
  utf8Encode,
  verifySignature,
} from '@decentralchain/crypto';
import waitForExpect from 'wait-for-expect';

import { JSONbn } from '../src/_core/jsonBn';
import type { MessageInputTx } from '../src/messages/types';
import { makeTxBytes } from '../src/messages/utils';
import { ContentScript } from './helpers/ContentScript';
import { CustomNetworkModal } from './helpers/CustomNetworkModal';
import { EmptyHomeScreen } from './helpers/EmptyHomeScreen';
import { AccountsHome } from './helpers/flows/AccountsHome';
import { App } from './helpers/flows/App';
import { Network } from './helpers/flows/Network';
import { HomeScreen } from './helpers/HomeScreen';
import { CommonTransaction } from './helpers/messages/CommonTransaction';
import { FinalTransactionScreen } from './helpers/messages/FinalTransactionScreen';
import { OtherAccountsScreen } from './helpers/OtherAccountsScreen';
import { Windows } from './helpers/Windows';
import { ISSUER_SEED, USER_1_SEED, USER_2_SEED, WHITELIST } from './utils/constants';
import { BROWSER_NODE_URL } from './utils/hooks';
import { faucet, getNetworkByte, getTransactionStatus } from './utils/nodeInteraction';
import {
  ALIAS,
  BURN,
  CANCEL_LEASE,
  DATA,
  INVOKE_SCRIPT,
  ISSUE,
  LEASE,
  MASS_TRANSFER,
  REISSUE,
  SET_ASSET_SCRIPT,
  SET_SCRIPT,
  SET_SCRIPT_COMPILED,
  SPONSORSHIP,
  TRANSFER,
} from './utils/transactions';

const DCC_TOKEN_SCALE = 10 ** 8;
type Account = { address: string; publicKey: string };

describe('Publish', () => {
  const nodeUrl = 'http://localhost:6869';
  let chainId: number;
  let issuer: Account, user1: Account, user2: Account;
  let dAppTab: string;
  let messageWindow: string | null = null;

  let smartAssetId: string;
  let assetWithMaxValuesId: string;

  beforeAll(async () => {
    chainId = await getNetworkByte(nodeUrl);

    const issuerPrivateKeyBytes = await createPrivateKey(utf8Encode(ISSUER_SEED));
    const issuerPublicKeyBytes = await createPublicKey(issuerPrivateKeyBytes);
    issuer = {
      address: base58Encode(createAddress(issuerPublicKeyBytes, chainId)),
      publicKey: base58Encode(issuerPublicKeyBytes),
    };

    const user1PrivateKeyBytes = await createPrivateKey(utf8Encode(USER_1_SEED));
    const user1PublicKeyBytes = await createPublicKey(user1PrivateKeyBytes);
    user1 = {
      address: base58Encode(createAddress(user1PublicKeyBytes, chainId)),
      publicKey: base58Encode(user1PublicKeyBytes),
    };

    const user2PrivateKeyBytes = await createPrivateKey(utf8Encode(USER_2_SEED));
    const user2PublicKeyBytes = await createPublicKey(user2PrivateKeyBytes);
    user2 = {
      address: base58Encode(createAddress(user2PublicKeyBytes, chainId)),
      publicKey: base58Encode(user2PublicKeyBytes),
    };
    await faucet({
      amount: 10 * DCC_TOKEN_SCALE,
      chainId,
      nodeUrl,
      recipient: issuer.address,
    });
    await App.initVault();

    const tabKeeper = await browser.getWindowHandle();
    const { waitForNewWindows } = await Windows.captureNewWindows();
    await EmptyHomeScreen.addButton.click();
    const [tabAccounts] = await waitForNewWindows(1);

    await browser.switchToWindow(tabKeeper);
    await browser.closeWindow();

    await browser.switchToWindow(tabAccounts);
    await browser.refresh();

    await Network.switchTo('Custom');
    if (await CustomNetworkModal.root.isDisplayed()) {
      await CustomNetworkModal.addressInput.setValue(BROWSER_NODE_URL);
      await CustomNetworkModal.saveButton.click();
    }

    await AccountsHome.importAccount('user2', USER_2_SEED);
    await AccountsHome.importAccount('user1', USER_1_SEED);
    await AccountsHome.importAccount('issuer', ISSUER_SEED);

    dAppTab = (await browser.createWindow('tab')).handle;
    await browser.switchToWindow(dAppTab);
    await browser.navigateTo(`https://${WHITELIST[3]!}`);

    await browser.switchToWindow(tabAccounts);
    await browser.closeWindow();

    await browser.switchToWindow(dAppTab);
  });

  afterAll(async () => {
    const tabKeeper = (await browser.createWindow('tab')).handle;
    await App.closeBgTabs(tabKeeper);
    await browser.openKeeperPopup();
    await Network.switchTo('Mainnet');
    await App.resetVault();
  });

  async function performSignAndPublishTransaction(input: MessageInputTx) {
    const { waitForNewWindows } = await Windows.captureNewWindows();
    await ContentScript.waitForCubensisConnect();
    await browser.execute((tx: MessageInputTx) => {
      CubensisConnect.signAndPublishTransaction(tx).then(
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

  async function getResult() {
    await browser.switchToWindow(dAppTab);
    return JSON.parse(
      await browser.execute(() => {
        const { result } = window;
        delete window.result;
        return result;
      }),
    );
  }

  async function approveTransaction() {
    await CommonTransaction.approveButton.click();
    await FinalTransactionScreen.closeButton.click();
  }

  describe('Asset issue', () => {
    it('Asset with max values', async () => {
      const data = {
        description: `Lorem ipsum dolor sit amet, consectetuer adipiscing elit. ${'Aenean commodo ligula eget dolor. Aenean'.repeat(
          10,
        )}`,
        name: '16 characters :)',
        precision: 8 as const,
        quantity: '9223372036854775807',
        reissuable: true,
      };
      await performSignAndPublishTransaction({ ...ISSUE, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        chainId,
        decimals: data.precision,
        description: data.description,
        fee: '100000000',
        name: data.name,
        quantity: data.quantity,
        reissuable: data.reissuable,
        senderPublicKey: issuer.publicKey,
        type: ISSUE.type,
        version: 3 as const,
      };
      const bytes = makeTxBytes({
        ...expectedApproveResult,
        quantity: data.quantity,
        script: null,
        timestamp: parsedApproveResult.timestamp,
      });

      expect(parsedApproveResult).toMatchObject(expectedApproveResult);
      expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
      expect(
        await verifySignature(
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
      assetWithMaxValuesId = parsedApproveResult.assetId;
    });

    it('Asset with min values', async () => {
      const data = {
        description: '',
        name: 'Four',
        precision: 0 as const,
        quantity: '1',
        reissuable: false,
      };
      await performSignAndPublishTransaction({ ...ISSUE, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        chainId,
        decimals: data.precision,
        description: data.description,
        fee: '100000',
        name: data.name,
        quantity: data.quantity,
        reissuable: data.reissuable,
        senderPublicKey: issuer.publicKey,
        type: ISSUE.type,
        version: 3 as const,
      };
      const bytes = makeTxBytes({
        ...expectedApproveResult,
        quantity: data.quantity,
        script: null,
        timestamp: parsedApproveResult.timestamp,
      });

      expect(parsedApproveResult).toMatchObject(expectedApproveResult);
      expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
      expect(
        await verifySignature(
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Smart asset', async () => {
      const data = {
        description: 'Asset with script',
        name: 'Smart Asset',
        precision: 8 as const,
        quantity: '100000000000',
        reissuable: true,
        script: 'base64:BQbtKNoM',
      };
      await performSignAndPublishTransaction({ ...ISSUE, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        chainId,
        decimals: data.precision,
        description: data.description,
        fee: '100000000',
        name: data.name,
        quantity: data.quantity,
        reissuable: data.reissuable,
        script: data.script,
        senderPublicKey: issuer.publicKey,
        type: ISSUE.type,
        version: 3 as const,
      };
      const bytes = makeTxBytes({
        ...expectedApproveResult,
        quantity: data.quantity,
        timestamp: parsedApproveResult.timestamp,
      });

      expect(parsedApproveResult).toMatchObject(expectedApproveResult);
      expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
      expect(
        await verifySignature(
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);

      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
      smartAssetId = parsedApproveResult.assetId;
    });

    it('NFT', async () => {
      const data = {
        description: 'NFT is a non-reissuable asset with quantity 1 and decimals 0',
        name: 'Non-fungible',
        precision: 0 as const,
        quantity: '1',
        reissuable: false,
        script: 'base64:BQbtKNoM',
      };
      await performSignAndPublishTransaction({ ...ISSUE, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        chainId,
        decimals: data.precision,
        description: data.description,
        fee: '100000',
        name: data.name,
        quantity: data.quantity,
        reissuable: data.reissuable,
        script: data.script,
        senderPublicKey: issuer.publicKey,
        type: ISSUE.type,
        version: 3 as const,
      };
      const bytes = makeTxBytes({
        ...expectedApproveResult,
        quantity: data.quantity,
        timestamp: parsedApproveResult.timestamp,
      });

      expect(parsedApproveResult).toMatchObject(expectedApproveResult);
      expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
      expect(
        await verifySignature(
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });
  });

  describe('Editing an asset', () => {
    it('Reissue', async () => {
      const data = {
        assetId: smartAssetId,
        quantity: '777',
        reissuable: false,
      };
      await performSignAndPublishTransaction({ ...REISSUE, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        assetId: data.assetId,
        chainId,
        fee: '500000',
        quantity: data.quantity,
        reissuable: data.reissuable,
        senderPublicKey: issuer.publicKey,
        type: REISSUE.type,
        version: 3 as const,
      };
      const bytes = makeTxBytes({
        ...expectedApproveResult,
        quantity: data.quantity,
        timestamp: parsedApproveResult.timestamp,
      });

      expect(parsedApproveResult).toMatchObject(expectedApproveResult);
      expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
      expect(
        await verifySignature(
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Burn', async () => {
      const data = {
        assetId: smartAssetId,
        quantity: '100500',
      };
      await performSignAndPublishTransaction({ ...BURN, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        amount: data.quantity,
        assetId: data.assetId,
        chainId,
        fee: '500000',
        senderPublicKey: issuer.publicKey,
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
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Set asset script', async () => {
      const data = {
        assetId: smartAssetId,
        script: 'base64:BQQAAAAHJG1hdGNoMAUAAAACdHgGGDRbEA==',
      };
      await performSignAndPublishTransaction({ ...SET_ASSET_SCRIPT, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        assetId: data.assetId,
        chainId,
        fee: '100000000',
        script: data.script,
        senderPublicKey: issuer.publicKey,
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
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Enable sponsorship fee', async () => {
      const data = {
        minSponsoredAssetFee: {
          amount: '10000000',
          assetId: assetWithMaxValuesId,
        },
      };
      await performSignAndPublishTransaction({ ...SPONSORSHIP, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        assetId: data.minSponsoredAssetFee.assetId,
        chainId,
        fee: '100000',
        minSponsoredAssetFee: data.minSponsoredAssetFee.amount,
        senderPublicKey: issuer.publicKey,
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
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Disable sponsorship fee', async () => {
      const data = {
        minSponsoredAssetFee: {
          amount: '0',
          assetId: assetWithMaxValuesId,
        },
      };
      await performSignAndPublishTransaction({ ...SPONSORSHIP, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        assetId: data.minSponsoredAssetFee.assetId,
        chainId,
        fee: '100000',
        minSponsoredAssetFee: null,
        senderPublicKey: issuer.publicKey,
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
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });
  });

  describe('Transfers', () => {
    it('Transfer', async () => {
      const data = {
        amount: {
          amount: '10050000000000',
          assetId: assetWithMaxValuesId,
        },
        attachment: 'base64:BQbtKNoM',
        recipient: user1.address,
      };
      await performSignAndPublishTransaction({ ...TRANSFER, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        amount: data.amount.amount,
        assetId: data.amount.assetId,
        attachment: '3ke2ct1rnYr52Y1jQvzNG',
        chainId,
        fee: '100000',
        feeAssetId: null,
        recipient: data.recipient,
        senderPublicKey: issuer.publicKey,
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
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Mass transfer', async () => {
      const data = {
        attachment: 'base64:BQbtKNoM',
        totalAmount: {
          assetId: null,
        },
        transfers: [
          { amount: '10000000', recipient: user1.address },
          { amount: '10000000', recipient: user2.address },
        ],
      };
      await performSignAndPublishTransaction({ ...MASS_TRANSFER, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        attachment: '3ke2ct1rnYr52Y1jQvzNG',
        chainId,
        fee: '200000',
        senderPublicKey: issuer.publicKey,
        transfers: data.transfers,
        type: MASS_TRANSFER.type,
        version: 2 as const,
      };
      const bytes = makeTxBytes({
        ...expectedApproveResult,
        assetId: null,
        timestamp: parsedApproveResult.timestamp,
      });

      expect(parsedApproveResult).toMatchObject(expectedApproveResult);
      expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
      expect(
        await verifySignature(
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });
  });

  describe('Record in the account data storage', () => {
    it('Write to Data storage', async () => {
      const data = {
        data: [
          {
            key: 'bool-entry',
            type: 'boolean' as const,
            value: false,
          },
          {
            key: 'str-entry',
            type: 'string' as const,
            value: 'Some string',
          },
          {
            key: 'binary',
            type: 'binary' as const,
            value: 'base64:AbCdAbCdAbCdAbCdAbCdAbCdAbCdAbCdAbCdAbCdAbCd',
          },
          {
            key: 'integer',
            type: 'integer' as const,
            value: '20',
          },
        ],
      };

      await performSignAndPublishTransaction({ ...DATA, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        chainId,
        data: data.data,
        fee: '100000',
        senderPublicKey: issuer.publicKey,
        type: DATA.type,
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
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Write MAX values to Data storage', async () => {
      const strValueMax =
        `Sed ut perspiciatis unde omnis iste natus error ` +
        `sit voluptatem accusantium doloremque laudantium, totam rem aperiam, ${'eaque ipsa quae ab illo inventore\n'.repeat(
          217,
        )}`;
      const binValueMax = `base64:${Buffer.from(strValueMax).toString('base64')}`;
      const data = {
        data: [
          {
            key: 'bool-entry',
            type: 'boolean' as const,
            value: true,
          },
          {
            key: 'str-entry',
            type: 'string' as const,
            value: strValueMax,
          },
          {
            key: 'bin-entry',
            type: 'binary' as const,
            value: binValueMax,
          },
          {
            key: 'int-entry',
            type: 'integer' as const,
            value: '9223372036854775807',
          },
        ],
      };

      await performSignAndPublishTransaction({ ...DATA, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        chainId,
        data: data.data,
        fee: '1500000',
        senderPublicKey: issuer.publicKey,
        type: DATA.type,
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
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });
  });

  async function changeKeeperAccountAndClose(accountName: string) {
    const tab = (await browser.createWindow('tab')).handle;
    await browser.switchToWindow(tab);
    await browser.openKeeperPopup();
    await HomeScreen.otherAccountsButton.click();
    const account = await OtherAccountsScreen.getAccountByName(accountName);
    await account.root.click();
    await browser.closeWindow();
    await browser.switchToWindow(dAppTab);
  }

  describe('Installing the script on the account and calling it', () => {
    it('Set script', async () => {
      await changeKeeperAccountAndClose('user1');
      await performSignAndPublishTransaction(SET_SCRIPT_COMPILED);
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        chainId,
        fee: '300000',
        script: SET_SCRIPT_COMPILED.data.script,
        senderPublicKey: user1.publicKey,
        type: SET_SCRIPT_COMPILED.type,
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
          base58Decode(user1.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Invoke script with payment', async () => {
      await changeKeeperAccountAndClose('issuer');

      const data = {
        call: {
          args: [],
          function: 'deposit',
        },
        dApp: user1.address,
        payment: [{ amount: '200000000', assetId: null }],
      };

      await performSignAndPublishTransaction({ ...INVOKE_SCRIPT, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        call: data.call,
        chainId,
        dApp: data.dApp,
        fee: '500000',
        payment: data.payment,
        senderPublicKey: issuer.publicKey,
        type: INVOKE_SCRIPT.type,
        version: 2 as const,
      };
      const bytes = makeTxBytes({
        ...expectedApproveResult,
        feeAssetId: null,
        timestamp: parsedApproveResult.timestamp,
      });

      expect(parsedApproveResult).toMatchObject(expectedApproveResult);
      expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
      expect(
        await verifySignature(
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Invoke with argument', async () => {
      const data = {
        call: {
          args: [{ type: 'integer' as const, value: '100' }],
          function: 'withdraw',
        },
        dApp: user1.address,
        payment: [],
      };

      await performSignAndPublishTransaction({ ...INVOKE_SCRIPT, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        call: data.call,
        chainId,
        dApp: data.dApp,
        fee: '500000',
        payment: data.payment,
        senderPublicKey: issuer.publicKey,
        type: INVOKE_SCRIPT.type,
        version: 2 as const,
      };
      const bytes = makeTxBytes({
        ...expectedApproveResult,
        feeAssetId: null,
        timestamp: parsedApproveResult.timestamp,
      });

      expect(parsedApproveResult).toMatchObject(expectedApproveResult);
      expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
      expect(
        await verifySignature(
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Invoke with long arguments and payments list', async () => {
      const binLong = `base64:${btoa(
        new Uint8Array(Array(100).fill([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).flat()).toString(),
      )}`;

      const data = {
        call: {
          args: [
            { type: 'boolean' as const, value: true },
            { type: 'binary' as const, value: binLong },
            { type: 'integer' as const, value: '-9223372036854775808' },
            {
              type: 'string' as const,
              value: `Lorem ipsum dolor sit amet, consectetuer adipiscing elit. ${'Aenean commodo ligula eget dolor. Aenean'.repeat(
                3,
              )}`,
            },
            {
              type: 'list' as const,
              value: [
                { type: 'boolean' as const, value: true },
                { type: 'binary' as const, value: binLong },
                { type: 'integer' as const, value: '-9223372036854775808' },
                {
                  type: 'string' as const,
                  value: `Lorem ipsum dolor sit amet, consectetuer adipiscing elit. ${'Aenean commodo ligula eget dolor. Aenean'.repeat(
                    3,
                  )}`,
                },
              ],
            },
          ],
          function: 'allArgTypes',
        },
        dApp: user1.address,
        payment: [
          { amount: '27000000', assetId: null },
          { amount: '27000000', assetId: assetWithMaxValuesId },
          { amount: '27000000', assetId: smartAssetId },
          { amount: '200000', assetId: null },
          { amount: '150000', assetId: assetWithMaxValuesId },
          { amount: '12222', assetId: smartAssetId },
          { amount: '1212', assetId: null },
          { amount: '3434', assetId: assetWithMaxValuesId },
          { amount: '5656', assetId: smartAssetId },
          { amount: '50000000', assetId: null },
        ],
      };

      await performSignAndPublishTransaction({ ...INVOKE_SCRIPT, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        call: data.call,
        chainId,
        dApp: data.dApp,
        fee: '500000',
        payment: data.payment,
        senderPublicKey: issuer.publicKey,
        type: INVOKE_SCRIPT.type,
        version: 2 as const,
      };
      const bytes = makeTxBytes({
        ...expectedApproveResult,
        feeAssetId: null,
        timestamp: parsedApproveResult.timestamp,
      });

      expect(parsedApproveResult).toMatchObject(expectedApproveResult);
      expect(parsedApproveResult.id).toBe(base58Encode(blake2b(bytes)));
      expect(
        await verifySignature(
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });

    it('Remove script', async () => {
      await changeKeeperAccountAndClose('user1');
      await performSignAndPublishTransaction({ ...SET_SCRIPT, data: {} });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        chainId,
        fee: '100000',
        script: null,
        senderPublicKey: user1.publicKey,
        type: SET_SCRIPT_COMPILED.type,
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
          base58Decode(user1.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });
  });

  describe('Leasing', () => {
    let leaseId: string;

    it('Lease', async () => {
      await changeKeeperAccountAndClose('issuer');

      const data = {
        amount: '1000',
        recipient: user2.address,
      };
      await performSignAndPublishTransaction({ ...LEASE, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        amount: data.amount,
        chainId,
        fee: '100000',
        recipient: data.recipient,
        senderPublicKey: issuer.publicKey,
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
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
      leaseId = parsedApproveResult.id;
    });

    it('Cancel lease', async () => {
      const data = { leaseId };
      await performSignAndPublishTransaction({ ...CANCEL_LEASE, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        chainId,
        fee: '100000',
        leaseId: data.leaseId,
        senderPublicKey: issuer.publicKey,
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
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });
  });

  describe('Aliases', () => {
    it('Create alias', async () => {
      const data = {
        alias: `test_${Date.now()}`,
      };

      await performSignAndPublishTransaction({ ...ALIAS, data });
      await approveTransaction();

      const [status, result] = await getResult();
      expect(status).toBe('RESOLVED');

      const parsedApproveResult = JSONbn.parse(result) as Record<string, any>;
      const expectedApproveResult = {
        alias: data.alias,
        chainId,
        fee: '100000',
        senderPublicKey: issuer.publicKey,
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
          base58Decode(issuer.publicKey),
          bytes,
          base58Decode(parsedApproveResult.proofs[0]!),
        ),
      ).toBe(true);
      await waitForExpect(async () => {
        expect(await getTransactionStatus(parsedApproveResult.id, nodeUrl)).toBe('confirmed');
      }, 15000);
    });
  });
});
