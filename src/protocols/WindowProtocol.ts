import { EventEmitter } from '../utils/EventEmitter.js';

/**
 * A protocol adapter that wraps the browser `postMessage` / `addEventListener` API.
 */
export class WindowProtocol<T> extends EventEmitter<WindowProtocol.IEvents<T>> {
  private win: WindowProtocol.IWindow;
  private readonly handler: (event: WindowProtocol.IMessageEvent<T>) => void;
  private readonly type: WindowProtocol.TProtocolType;
  private readonly targetOrigin: string;

  constructor(win: WindowProtocol.IWindow, type: WindowProtocol.TProtocolType, targetOrigin = '*') {
    super();

    this.win = win;
    this.type = type;
    this.targetOrigin = targetOrigin;

    this.handler = (event: WindowProtocol.IMessageEvent<T>) => {
      this.trigger('message', event);
    };

    if (type === WindowProtocol.PROTOCOL_TYPES.LISTEN) {
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
    if (this.type === WindowProtocol.PROTOCOL_TYPES.LISTEN) {
      this.win.removeEventListener(
        'message',
        this.handler as EventListenerOrEventListenerObject,
        false,
      );
    }
    this.win = WindowProtocol._fakeWin;
  }

  private static readonly _fakeWin: WindowProtocol.IWindow = (function () {
    const empty = () => null;
    return {
      postMessage: empty as unknown as WindowProtocol.IWindow['postMessage'],
      addEventListener: empty as unknown as WindowProtocol.IWindow['addEventListener'],
      removeEventListener: empty as unknown as WindowProtocol.IWindow['removeEventListener'],
    };
  })();
}

/* v8 ignore next */
export namespace WindowProtocol {
  export const PROTOCOL_TYPES = {
    LISTEN: 'listen' as const,
    DISPATCH: 'dispatch' as const,
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
}
