import { EventEmitter } from '../utils/EventEmitter.js';

export const PROTOCOL_TYPES = {
  DISPATCH: 'dispatch' as const,
  LISTEN: 'listen' as const,
};

export interface IWindow {
  postMessage: (typeof window)['postMessage'];
  addEventListener: (typeof window)['addEventListener'];
  removeEventListener: (typeof window)['removeEventListener'];
}

export interface IMessageEvent<T> extends MessageEvent {
  data: T;
}

export interface IEvents<T> {
  message: IMessageEvent<T>;
}

export type TProtocolType = 'listen' | 'dispatch';

/**
 * A protocol adapter that wraps the browser `postMessage` / `addEventListener` API.
 *
 * **Security note**: When constructing a DISPATCH protocol, always provide an explicit
 * `targetOrigin` (e.g. `'https://wallet.decentralchain.io'`). The default `'*'`
 * broadcasts to all origins, which is unsafe for sensitive data. Use
 * {@link WindowAdapter.createSimpleWindowAdapter} which resolves the origin automatically.
 */
export class WindowProtocol<T> extends EventEmitter<IEvents<T>> {
  private win: IWindow;
  private readonly handler: (event: IMessageEvent<T>) => void;
  private readonly type: TProtocolType;
  private readonly targetOrigin: string;

  constructor(win: IWindow, type: TProtocolType, targetOrigin = '*') {
    super();

    this.win = win;
    this.type = type;
    this.targetOrigin = targetOrigin;

    // Warn developers when dispatching to wildcard origin — potential security risk
    // for financial applications. Use an explicit origin whenever possible.
    if (type === PROTOCOL_TYPES.DISPATCH && targetOrigin === '*') {
      console.warn(
        '[WindowProtocol] DISPATCH protocol created with wildcard targetOrigin "*". ' +
          'This sends messages to ALL origins and may expose sensitive data. ' +
          'Pass an explicit origin (e.g. "https://your-domain.com") for production use.',
      );
    }

    this.handler = (event: IMessageEvent<T>) => {
      this.trigger('message', event);
    };

    if (type === PROTOCOL_TYPES.LISTEN) {
      this.win.addEventListener(
        'message',
        this.handler as EventListenerOrEventListenerObject,
        false,
      );
    }
  }

  public dispatch(data: unknown): this {
    this.win.postMessage(data, this.targetOrigin);
    return this;
  }

  public destroy(): void {
    if (this.type === PROTOCOL_TYPES.LISTEN) {
      this.win.removeEventListener(
        'message',
        this.handler as EventListenerOrEventListenerObject,
        false,
      );
    }
    this.win = WindowProtocol._fakeWin;
  }

  private static readonly _fakeWin: IWindow = (() => {
    const empty = () => null;
    return {
      addEventListener: empty as unknown as IWindow['addEventListener'],
      postMessage: empty as unknown as IWindow['postMessage'],
      removeEventListener: empty as unknown as IWindow['removeEventListener'],
    };
  })();
}
