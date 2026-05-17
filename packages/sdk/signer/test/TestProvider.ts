import { libs, order, signTx } from '@decentralchain/transactions';
import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { EventEmitter } from 'typed-ts-events';
import {
  type AuthEvents,
  type ConnectOptions,
  type Handler,
  type Provider,
  type SignerTx,
  type TOrderArgs,
  type TSignedOrder,
  type TypedData,
  type UserData,
} from '../src/index';
import { NETWORK_BYTE } from './test-env';

export class TestProvider implements Provider {
  private options: ConnectOptions = {
    NETWORK_BYTE,
    NODE_URL: 'https://nodes.decentralchain.io',
  };

  private readonly seed: string;
  public readonly user: UserData;
  public debugEmitter: EventEmitter<TEvents> = new EventEmitter<TEvents>();
  private readonly emitter: EventEmitter<AuthEvents> = new EventEmitter<AuthEvents>();

  constructor(seed?: string) {
    this.seed = seed ?? libs.crypto.randomSeed();

    this.user = {
      address: libs.crypto.address(this.seed),
      publicKey: libs.crypto.publicKey(this.seed),
    };
  }

  public on<EVENT extends keyof AuthEvents>(
    event: EVENT,
    handler: Handler<AuthEvents[EVENT]>,
  ): Provider {
    this.emitter.on(event, handler);
    return this;
  }

  public once<EVENT extends keyof AuthEvents>(
    event: EVENT,
    handler: Handler<AuthEvents[EVENT]>,
  ): Provider {
    this.emitter.once(event, handler);
    return this;
  }

  public off<EVENT extends keyof AuthEvents>(
    event: EVENT,
    handler: Handler<AuthEvents[EVENT]>,
  ): Provider {
    this.emitter.off(event, handler);
    return this;
  }

  public connect(options: ConnectOptions): Promise<void> {
    this.options = options;
    this.debugEmitter.trigger('connect', [options]);
    return Promise.resolve();
  }

  public login(): Promise<UserData> {
    const promise = Promise.resolve({
      address: libs.crypto.address(this.seed, this.options.NETWORK_BYTE),
      publicKey: libs.crypto.publicKey(this.seed),
    });

    this.debugEmitter.trigger('login', [] as []);
    return promise;
  }

  public logout(): Promise<void> {
    this.debugEmitter.trigger('logout', [] as []);
    return Promise.resolve();
  }

  public sign(list: Array<SignerTx>): Promise<unknown> {
    this.debugEmitter.trigger('sign', [list]);

    const fixAlias = (tx: Record<string, unknown>) =>
      tx.type === TRANSACTION_TYPE.ALIAS
        ? { ...tx, alias: String(tx.alias).replace(/alias:.:/, '') }
        : tx;

    const fixIssueDescription = (tx: Record<string, unknown>) =>
      tx.type === TRANSACTION_TYPE.ISSUE && tx.description == null
        ? { ...tx, description: '' }
        : tx;

    return Promise.resolve(
      list.map((item) =>
        signTx(
          fixIssueDescription(fixAlias({ chainId: this.options.NETWORK_BYTE, ...item })) as any,
          this.seed,
        ),
      ),
    ) as any;
  }

  public signMessage(data: string | number): Promise<string> {
    this.debugEmitter.trigger('signMessage', [data]);
    return Promise.reject(new Error('signMessage: not implemented in TestProvider'));
  }

  public signOrder(data: TOrderArgs): Promise<TSignedOrder> {
    this.debugEmitter.trigger('signOrder', [data]);
    return Promise.resolve(order(data as any) as any);
  }

  public signTypedData(data: Array<TypedData>): Promise<string> {
    this.debugEmitter.trigger('signTypedData', [data]);
    return Promise.reject(new Error('signTypedData: not implemented in TestProvider'));
  }
}

type TEvents = {
  [Key in keyof Provider]: Provider[Key] extends (...args: infer A) => unknown ? A : never;
};
