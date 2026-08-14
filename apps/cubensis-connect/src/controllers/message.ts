import { BigNumber } from '@decentralchain/bignumber';
import { base58Decode, base58Encode, blake2b } from '@decentralchain/crypto';
import { nanoid } from 'nanoid';
import invariant from 'tiny-invariant';
import Browser from 'webextension-polyfill';
import { createStore } from 'zustand/vanilla';
import { JSONbn } from '#_core/jsonBn';
import {
  computeHash,
  makeAuthBytes,
  makeCancelOrderBytes,
  makeCustomDataBytes,
  makeDccAuthBytes,
  makeOrderBytes,
  makeRequestBytes,
  makeTxBytes,
  stringifyOrder,
  stringifyTransaction,
} from '#messages/utils';
import { ERRORS, KeeperError } from '../lib/keeperError';
import { TypedEventEmitter } from '../lib/TypedEventEmitter';
import type {
  Message,
  MessageInput,
  MessageInputOfType,
  MessageOfType,
  MoneyLike,
} from '../messages/types';
import { MessageStatus } from '../messages/types';
import { PERMISSIONS } from '../permissions/constants';
import { captureException } from '../sentry/init';
import type { ExtensionStorage } from '../storage/storage';
import type { AssetInfoController } from './assetInfo';
import type { BuildTransactionDeps } from './buildTransaction';
import { buildTransaction, isMoneyLikeValuePositive } from './buildTransaction';
import type { CurrentAccountController } from './currentAccount';
import { moneyLikeToMoney } from './messageUtils';
import type { NetworkController } from './network';
import type { PermissionsController } from './permissions';
import type { RemoteConfigController } from './remoteConfig';
import type { WalletController } from './wallet';

export class MessageController extends TypedEventEmitter {
  private store;
  private networkController;
  private assetInfoController;
  setPermission;
  private getAccountBalance;
  private remoteConfigController;
  private walletController;

  constructor({
    extensionStorage,
    assetInfoController,
    networkController,
    setPermission,
    getAccountBalance,
    remoteConfigController,
    walletController,
  }: {
    extensionStorage: ExtensionStorage;
    assetInfoController: AssetInfoController;
    networkController: NetworkController;
    setPermission: PermissionsController['setPermission'];
    getAccountBalance: CurrentAccountController['getAccountBalance'];
    remoteConfigController: RemoteConfigController;
    walletController: WalletController;
  }) {
    super();

    this.store = createStore(() => extensionStorage.getInitState({ messages: [] }));
    extensionStorage.subscribe(this.store);

    this.assetInfoController = assetInfoController;
    this.networkController = networkController;
    this.remoteConfigController = remoteConfigController;
    this.walletController = walletController;

    // permissions
    this.setPermission = setPermission;
    this.getAccountBalance = getAccountBalance;
    this.#rejectAllByTime();

    Browser.alarms.onAlarm.addListener(({ name }) => {
      if (name === 'rejectMessages') {
        this.#rejectAllByTime();
      }
    });

    this.#updateBadge();
  }

  async newMessage<T extends MessageInput['type']>(messageInput: MessageInputOfType<T>) {
    try {
      const message = await this.#generateMessage(messageInput);
      const { messages } = this.store.getState();
      this.#updateStore(messages.concat(message));
      return message as MessageOfType<T>;
    } catch (err) {
      if (err instanceof KeeperError) {
        throw err;
      }

      if (err instanceof Response) {
        throw new Error(await err.text());
      }

      captureException(err);
      throw ERRORS.UNKNOWN(String(err));
    }
  }

  async getMessageResult(id: string) {
    const message = this.getMessageById(id);

    switch (message.status) {
      case MessageStatus.Signed:
      case MessageStatus.Published:
        return message.result;
      case MessageStatus.Rejected:
      case MessageStatus.RejectedForever:
        throw ERRORS.USER_DENIED(undefined, message.status);
      case MessageStatus.Failed:
        throw ERRORS.FAILED_MSG(undefined, message.err);
    }

    const finishedMessage = await new Promise<Message>((resolve) => {
      this.once(`${id}:finished`, resolve);
    });

    switch (finishedMessage.status) {
      case MessageStatus.Signed:
      case MessageStatus.Published:
        return finishedMessage.result;
      case MessageStatus.Rejected:
      case MessageStatus.RejectedForever:
        throw ERRORS.USER_DENIED(undefined, message.status);
      case MessageStatus.Failed:
        throw ERRORS.FAILED_MSG(undefined, finishedMessage.err);
      default:
        throw ERRORS.UNKNOWN();
    }
  }

  getMessages() {
    return this.store.getState().messages;
  }

  getMessageById(id: string) {
    const result = this.store.getState().messages.find((message) => message.id === id);

    if (!result) throw new Error(`Failed to get message with id ${id}`);

    return result;
  }

  deleteMessage(id: string) {
    const { messages } = this.store.getState();
    const index = messages.findIndex((message) => message.id === id);

    if (index > -1) {
      messages.splice(index, 1);
      this.#updateStore(messages);
    }
  }

  async approve(id: string) {
    const message = this.getMessageById(id);

    try {
      const { address, network, publicKey } = message.account;
      const wallet = this.walletController.getWallet(address, network);

      switch (message.type) {
        case 'auth': {
          const { data, host, name, prefix, version } = message.data.data;

          const signature = await wallet.signAuth(makeAuthBytes({ data, host }));

          message.result = {
            address,
            host,
            name,
            prefix,
            publicKey,
            signature: base58Encode(signature),
            version,
          };

          message.status = MessageStatus.Signed;

          if (message.successPath) {
            const url = new URL(message.successPath);
            url.searchParams.append('p', message.result.publicKey);
            url.searchParams.append('s', message.result.signature);
            url.searchParams.append('a', message.result.address);
            this.emit('Open new tab', url.toString());
          }
          break;
        }
        case 'authOrigin':
          this.setPermission(message.origin, PERMISSIONS.APPROVED);
          message.result = { approved: 'OK' };
          message.status = MessageStatus.Signed;
          break;
        case 'cancelOrder': {
          const cancelOrder = {
            orderId: message.data.data.id,
            sender: message.data.data.senderPublicKey,
          };

          const signature = await wallet.signCancelOrder(makeCancelOrderBytes(cancelOrder));

          const signedCancelOrder = {
            ...cancelOrder,
            signature: base58Encode(signature),
          };

          if (message.broadcast) {
            message.result = JSONbn.stringify(
              await this.networkController.broadcastCancelOrder(signedCancelOrder, message),
            );

            message.status = MessageStatus.Published;
          } else {
            message.result = JSONbn.stringify(signedCancelOrder);
            message.status = MessageStatus.Signed;
          }
          break;
        }
        case 'customData': {
          const { data } = message;

          const signature = await wallet.signCustomData(makeCustomDataBytes(data));

          message.result = {
            ...data,
            signature: base58Encode(signature),
          };

          message.status = MessageStatus.Signed;
          break;
        }
        case 'order': {
          const signature = await wallet.signOrder(
            makeOrderBytes(message.data),
            message.data.version,
          );

          const signedOrder =
            message.data.version === 1
              ? { ...message.data, signature }
              : {
                  ...message.data,
                  proofs: message.data.proofs.concat([base58Encode(signature)]),
                };

          if (message.broadcast) {
            message.result = JSONbn.stringify(
              await this.networkController.broadcastOrder(signedOrder),
            );

            message.status = MessageStatus.Published;
          } else {
            message.result = stringifyOrder(signedOrder);
            message.status = MessageStatus.Signed;
          }
          break;
        }
        case 'request': {
          const signature = await wallet.signRequest(
            makeRequestBytes({
              senderPublicKey: message.data.data.senderPublicKey,
              timestamp: message.data.data.timestamp,
            }),
          );

          message.result = base58Encode(signature);

          message.status = MessageStatus.Signed;
          break;
        }
        case 'transaction': {
          const signature = await wallet.signTx(makeTxBytes(message.data), message.data);

          const signedTx = {
            ...message.data,
            proofs: message.data.proofs.concat([base58Encode(signature)]),
          };

          if (message.broadcast) {
            message.result = JSONbn.stringify(
              await this.networkController.broadcastTransaction(signedTx),
            );

            message.status = MessageStatus.Published;
          } else {
            message.result = stringifyTransaction(signedTx);
            message.status = MessageStatus.Signed;
          }

          if (message.successPath) {
            const url = new URL(message.successPath);
            url.searchParams.append('txId', message.data.id);
            this.emit('Open new tab', url.href);
          }
          break;
        }
        case 'transactionPackage': {
          message.result = await Promise.all(
            message.data.map(async (data) => {
              const signature = await wallet.signTx(makeTxBytes(data), data);

              return stringifyTransaction({
                ...data,
                proofs: data.proofs.concat([base58Encode(signature)]),
              });
            }),
          );

          message.status = MessageStatus.Signed;
          break;
        }
        case 'dccAuth': {
          const data = {
            ...message.data,
            publicKey: message.data.publicKey || publicKey,
            timestamp: message.data.timestamp || Date.now(),
          };

          const signature = await wallet.signDccAuth(makeDccAuthBytes(data));

          message.result = {
            ...data,
            signature: base58Encode(signature),
          };

          message.status = MessageStatus.Signed;
          break;
        }
        case 'getKEK': {
          const sharedKey = await wallet.createSharedKey(message.data.publicKey);

          message.result = base58Encode(sharedKey);
          message.status = MessageStatus.Signed;
          break;
        }
      }

      this.#updateMessage(message);
      this.emit(`${message.id}:finished`, message);

      return message;
    } catch (err) {
      if (err instanceof KeeperError && err.message === 'Request is rejected on ledger') {
        this.reject(id);
        return message;
      }

      const errorMessage =
        err && typeof err === 'object' && 'message' in err && err.message
          ? String(err.message)
          : String(err);

      Object.assign(message, {
        err: errorMessage,
        status: MessageStatus.Failed,
      });

      this.#updateMessage(message);
      this.emit(`${message.id}:finished`, message);

      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error(errorMessage);
      }
    }
  }

  reject(id: string, forever?: boolean) {
    const message = this.getMessageById(id);

    message.status = forever ? MessageStatus.RejectedForever : MessageStatus.Rejected;

    this.#updateMessage(message);
    this.emit(`${message.id}:finished`, message);
  }

  async updateTransactionFee(id: string, fee: MoneyLike) {
    const message = this.getMessageById(id);
    invariant(message.type === 'transaction');

    message.input.data.data.fee = fee;

    if (!message.input.data.data.initialFee) {
      message.input.data.data.initialFee = {
        assetId: 'feeAssetId' in message.data ? message.data.feeAssetId : null,
        coins: message.data.fee,
      };
    }

    const newMessage = await this.#generateMessage(message.input);
    newMessage.id = id;
    this.#updateMessage(newMessage);
    return newMessage;
  }

  rejectByOrigin(byOrigin: string) {
    const { messages } = this.store.getState();

    messages.forEach(({ id, origin }) => {
      if (byOrigin === origin) {
        this.reject(id);
      }
    });
  }

  removeMessagesFromConnection(connectionId: string) {
    const { messages } = this.store.getState();

    messages.forEach((message) => {
      if (message.connectionId === connectionId) {
        this.reject(message.id);
      }
    });

    this.#updateStore(messages.filter((message) => message.connectionId !== connectionId));
  }

  clearMessages(ids?: string | string[]) {
    if (typeof ids === 'string') {
      this.deleteMessage(ids);
    } else if (ids && ids.length > 0) {
      for (const id of ids) {
        this.deleteMessage(id);
      }
    } else {
      this.#updateStore([]);
    }
  }

  getUnapproved() {
    return this.store
      .getState()
      .messages.filter(({ status }) => status === MessageStatus.UnApproved);
  }

  #rejectAllByTime() {
    const { message_expiration_ms } = this.remoteConfigController.getMessagesConfig();

    const { messages } = this.store.getState();

    messages.forEach(({ id, timestamp, status }) => {
      if (Date.now() - timestamp > message_expiration_ms && status === MessageStatus.UnApproved) {
        this.reject(id);
      }
    });

    this.#updateMessagesByTimeout();
  }

  #updateMessagesByTimeout() {
    const { update_messages_ms } = this.remoteConfigController.getMessagesConfig();

    Browser.alarms.create('rejectMessages', {
      delayInMinutes: update_messages_ms / 1000 / 60,
    });
  }

  #updateMessage(message: Message) {
    const messages = this.store.getState().messages;
    messages[messages.findIndex((m) => m.id === message.id)] = message;
    this.#updateStore(messages);
  }

  #updateStore(messages: Message[]) {
    this.store.setState({ ...this.store.getState(), messages });
    this.#updateBadge();
  }

  #updateBadge() {
    this.emit('Update badge');
  }

  #buildTransactionDeps(): BuildTransactionDeps {
    return {
      getAccountBalance: this.getAccountBalance,
      getAssets: () => this.assetInfoController.getAssets(),
      getNetworkCode: () => this.networkController.getNetworkCode(),
      getNode: () => this.networkController.getNode(),
      getUsdPrices: () => this.assetInfoController.getUsdPrices(),
      updateAssets: (assetIds) => this.assetInfoController.updateAssets(assetIds),
    };
  }

  async #generateMessage(messageInput: MessageInput): Promise<Message> {
    if (!messageInput.data && messageInput.type !== 'authOrigin') {
      throw ERRORS.REQUEST_ERROR('should contain a data field', messageInput);
    }

    switch (messageInput.type) {
      case 'auth': {
        let successPath: string | null = null;

        try {
          successPath = messageInput.data.successPath
            ? new URL(
                messageInput.data.successPath,
                messageInput.data.referrer || `https://${messageInput.origin}`,
              ).href
            : null;
        } catch {
          // ignore
        }

        const { data, icon, name } = messageInput.data;

        const host = messageInput.data.host || new URL(`https://${messageInput.origin}`).host;

        // DCC canonical auth prefix — returned verbatim in the result object
        // delivered to dApps. Must match the domain separator used in makeAuthBytes.
        const prefix = 'DccWalletAuthentication';

        return {
          ...messageInput,
          data: {
            data: { data, host, icon, name, prefix },
            referrer: messageInput.data.referrer,
          },
          ext_uuid: messageInput.options?.uid,
          id: nanoid(),
          messageHash: base58Encode(computeHash(makeAuthBytes({ data, host }))),
          status: MessageStatus.UnApproved,
          successPath,
          timestamp: Date.now(),
        };
      }
      case 'authOrigin':
        return {
          ...messageInput,
          ext_uuid: messageInput.options?.uid,
          id: nanoid(),
          status: MessageStatus.UnApproved,
          timestamp: Date.now(),
        };
      case 'cancelOrder': {
        const data = {
          senderPublicKey: messageInput.account.publicKey,
          ...messageInput.data.data,
        } as { senderPublicKey: string; id: string };

        return {
          ...messageInput,
          amountAsset: messageInput.data.amountAsset,
          data: { ...messageInput.data, data, timestamp: Date.now() },
          ext_uuid: messageInput.options?.uid,
          id: nanoid(),
          messageHash: base58Encode(
            computeHash(
              makeCancelOrderBytes({
                orderId: data.id,
                sender: data.senderPublicKey,
              }),
            ),
          ),
          priceAsset: messageInput.data.priceAsset,
          status: MessageStatus.UnApproved,
          timestamp: Date.now(),
        };
      }
      case 'customData': {
        try {
          const data = {
            ...messageInput.data,
            publicKey: messageInput.data.publicKey || messageInput.account.publicKey,
          };

          return {
            ...messageInput,
            data: {
              ...data,
              hash: base58Encode(computeHash(makeCustomDataBytes(data))),
            },
            ext_uuid: messageInput.options?.uid,
            id: nanoid(),
            status: MessageStatus.UnApproved,
            timestamp: Date.now(),
          };
        } catch (err) {
          throw ERRORS.REQUEST_ERROR(
            err instanceof Error ? err.message : String(err),
            messageInput,
          );
        }
      }
      case 'order': {
        if (!isMoneyLikeValuePositive(messageInput.data.data.amount)) {
          throw ERRORS.REQUEST_ERROR('amount is not valid', messageInput.data);
        }

        if (!isMoneyLikeValuePositive(messageInput.data.data.price)) {
          throw ERRORS.REQUEST_ERROR('price is not valid', messageInput.data);
        }

        if (!isMoneyLikeValuePositive(messageInput.data.data.matcherFee)) {
          throw ERRORS.REQUEST_ERROR('matcherFee is not valid', messageInput.data);
        }

        const amountAssetId =
          messageInput.data.data.amount.assetId === 'DCC'
            ? null
            : messageInput.data.data.amount.assetId;

        const matcherFeeAssetId =
          messageInput.data.data.matcherFee.assetId === 'DCC'
            ? null
            : messageInput.data.data.matcherFee.assetId;

        const priceAssetId =
          messageInput.data.data.price.assetId === 'DCC'
            ? null
            : messageInput.data.data.price.assetId;

        await this.assetInfoController.updateAssets([
          amountAssetId,
          matcherFeeAssetId,
          priceAssetId,
        ]);

        const assets = this.assetInfoController.getAssets();

        const amountAsset = assets[amountAssetId ?? 'DCC'];
        invariant(amountAsset);

        const priceAsset = assets[priceAssetId ?? 'DCC'];
        invariant(priceAsset);

        const version = messageInput.data.data.version ?? 3;

        // A valid DCC address is always ≥ 2 bytes: [networkId, chainId, ...].
        // Extract chain ID before the object literal so the invariant fires with a clear message.
        const accountAddrBytes = base58Decode(messageInput.account.address);
        invariant(
          accountAddrBytes.length >= 2,
          'Account address too short to contain chain ID byte',
        );
        const chainIdFromAddress = accountAddrBytes[1] as number;

        const orderParams = {
          amount: moneyLikeToMoney(messageInput.data.data.amount, assets).toCoins(),
          assetPair: {
            amountAsset: amountAssetId,
            priceAsset: priceAssetId,
          },
          chainId: messageInput.data.data.chainId ?? chainIdFromAddress,
          eip712Signature: messageInput.data.data.eip712Signature,
          expiration: messageInput.data.data.expiration,
          matcherFee: moneyLikeToMoney(messageInput.data.data.matcherFee, assets).toCoins(),
          matcherFeeAssetId,
          matcherPublicKey:
            messageInput.data.data.matcherPublicKey ??
            (await this.networkController.getMatcherPublicKey()),
          orderType: messageInput.data.data.orderType,
          price: moneyLikeToMoney(messageInput.data.data.price, assets)
            .getTokens()
            .mul(
              new BigNumber(10).pow(
                version < 4 || messageInput.data.data.priceMode === 'assetDecimals'
                  ? 8 + priceAsset.precision - amountAsset.precision
                  : 8,
              ),
            )
            .toString(),
          priceMode: messageInput.data.data.priceMode ?? 'fixedDecimals',
          proofs: messageInput.data.data.proofs ?? [],
          senderPublicKey: messageInput.account.publicKey,
          timestamp: messageInput.data.data.timestamp ?? Date.now(),
          version,
        };

        const order = {
          id: base58Encode(computeHash(makeOrderBytes(orderParams))),
          ...orderParams,
        };

        return {
          ...messageInput,
          data: order,
          ext_uuid: messageInput.options?.uid,
          id: nanoid(),
          status: MessageStatus.UnApproved,
          timestamp: Date.now(),
        };
      }
      case 'request': {
        const data = {
          senderPublicKey: messageInput.account.publicKey,
          timestamp: Date.now(),
          ...messageInput.data.data,
        } as { senderPublicKey: string; timestamp: number };

        return {
          ...messageInput,
          data: { ...messageInput.data, data },
          ext_uuid: messageInput.options?.uid,
          id: nanoid(),
          messageHash: base58Encode(
            computeHash(
              makeRequestBytes({
                senderPublicKey: data.senderPublicKey,
                timestamp: data.timestamp,
              }),
            ),
          ),
          status: MessageStatus.UnApproved,
          timestamp: Date.now(),
        };
      }
      case 'transaction': {
        const messageTx = await buildTransaction(
          this.#buildTransactionDeps(),
          messageInput.account,
          messageInput.data,
        );

        return {
          ...messageInput,
          data: messageTx,
          ext_uuid: messageInput.options?.uid,
          id: nanoid(),
          input: messageInput,
          status: MessageStatus.UnApproved,
          successPath: messageInput.data.successPath || undefined,
          timestamp: Date.now(),
        };
      }
      case 'transactionPackage': {
        const { max, allow_tx } = this.remoteConfigController.getPackConfig();

        const msgs = messageInput.data.length;

        if (!msgs || msgs > max) {
          throw ERRORS.REQUEST_ERROR(`max transactions in pack is ${max}`, messageInput);
        }

        const unavailableTx = messageInput.data.filter(({ type }) => !allow_tx.includes(type));

        if (unavailableTx.length) {
          throw ERRORS.REQUEST_ERROR(`tx type can be ${allow_tx.join(', ')}`, messageInput);
        }

        const txs = await Promise.all(
          messageInput.data.map((txParams) =>
            buildTransaction(this.#buildTransactionDeps(), messageInput.account, txParams),
          ),
        );

        return {
          ...messageInput,
          data: txs,
          ext_uuid: messageInput.options?.uid,
          id: nanoid(),
          input: messageInput,
          status: MessageStatus.UnApproved,
          timestamp: Date.now(),
        };
      }
      case 'dccAuth': {
        try {
          const data = {
            ...messageInput.data,
            publicKey: messageInput.data.publicKey || messageInput.account.publicKey,
          };

          return {
            ...messageInput,
            data: {
              ...data,
              address: messageInput.account.address,
              hash: base58Encode(blake2b(makeDccAuthBytes(data))),
            },
            ext_uuid: messageInput.options?.uid,
            id: nanoid(),
            status: MessageStatus.UnApproved,
            timestamp: Date.now(),
          };
        } catch (err) {
          throw ERRORS.REQUEST_ERROR(
            err instanceof Error ? err.message : String(err),
            messageInput,
          );
        }
      }
      case 'getKEK':
        return {
          ...messageInput,
          ext_uuid: messageInput.options?.uid,
          id: nanoid(),
          status: MessageStatus.UnApproved,
          timestamp: Date.now(),
        };
    }
  }
}
