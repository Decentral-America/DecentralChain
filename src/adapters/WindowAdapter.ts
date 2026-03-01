import { Adapter } from './Adapter.js';
import type { IOneArgFunction, TChanelId, TMessageContent } from '../bus/Bus.js';
import { console } from '../utils/console/index.js';
import { pipe, toArray, uniqueId } from '../utils/utils/index.js';
import { UniqPrimitiveCollection } from '../utils/UniqPrimitiveCollection.js';
import { WindowProtocol } from '../protocols/WindowProtocol.js';

type TOrList<T> = T | T[];
type TContent = HTMLIFrameElement | WindowProtocol.IWindow;

const EMPTY_OPTIONS: WindowAdapter.IOptions<TOrList<string>, TOrList<TChanelId>> = {
  origins: [],
  availableChanelId: [],
};

/**
 * An adapter that bridges the Bus with browser windows/iframes via `postMessage`.
 */
export class WindowAdapter extends Adapter {
  public readonly id: string = uniqueId('wa');
  private readonly dispatch: WindowProtocol<TMessageContent>[];
  private readonly listen: WindowProtocol<TMessageContent>[];
  private readonly options: WindowAdapter.IOptions<
    UniqPrimitiveCollection<string>,
    UniqPrimitiveCollection<TChanelId>
  >;
  private readonly callbacks: IOneArgFunction<TMessageContent, void>[] = [];

  constructor(
    listen: WindowProtocol<TMessageContent>[],
    dispatch: WindowProtocol<TMessageContent>[],
    options?: Partial<WindowAdapter.IOptions<TOrList<string>, TOrList<TChanelId>>>,
  ) {
    super();

    this.options = WindowAdapter.prepareOptions(options);
    this.listen = listen;
    this.dispatch = dispatch;
    this.listen.forEach((protocol) => {
      protocol.on('message', (event) => {
        this.onMessage(event);
      });
    });
  }

  public addListener(cb: IOneArgFunction<TMessageContent, void>): this {
    this.callbacks.push(cb);
    console.info('WindowAdapter: Add iframe message listener');
    return this;
  }

  public send(data: TMessageContent): this {
    const message = { ...data, chanelId: this.options.chanelId };
    this.dispatch.forEach((protocol) => protocol.dispatch(message));
    console.info('WindowAdapter: Send message', message);
    return this;
  }

  public destroy(): void {
    this.listen.forEach((protocol) => {
      protocol.destroy();
    });
    this.dispatch.forEach((protocol) => {
      protocol.destroy();
    });
    console.info('WindowAdapter: Destroy');
  }

  private onMessage(event: WindowProtocol.IMessageEvent<TMessageContent>): void {
    if (this.accessEvent(event)) {
      this.callbacks.forEach((cb) => {
        try {
          cb(event.data);
        } catch (e) {
          console.warn('WindowAdapter: Unhandled exception!', e);
        }
      });
    }
  }

  private accessEvent(event: WindowProtocol.IMessageEvent<TMessageContent>): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard for unknown postMessage data
    if (typeof event.data !== 'object' || event.data.type == null) {
      console.info('WindowAdapter: Block event. Wrong event format!', event.data);
      return false;
    }

    if (!this.options.origins.has('*') && !this.options.origins.has(event.origin)) {
      console.info(`SimpleWindowAdapter: Block event by origin "${event.origin}"`);
      return false;
    }

    if (!this.options.availableChanelId.size) {
      return true;
    }

    const access = !!(
      event.data.chanelId && this.options.availableChanelId.has(event.data.chanelId)
    );

    if (!access) {
      console.info(
        `SimpleWindowAdapter: Block event by chanel id "${String(event.data.chanelId)}"`,
      );
    }

    return access;
  }

  public static createSimpleWindowAdapter(
    iframe?: TContent,
    options?: Partial<WindowAdapter.IOptions<TOrList<string>, TOrList<TChanelId>>>,
  ): Promise<WindowAdapter> {
    const origin = this.getContentOrigin(iframe);
    const myOptions = this.prepareOptions(options);
    const events: WindowProtocol.IMessageEvent<TMessageContent>[] = [];

    if (origin) {
      myOptions.origins.add(origin);
    }

    const listen = new WindowProtocol<TMessageContent>(
      window,
      WindowProtocol.PROTOCOL_TYPES.LISTEN,
    );
    const handler: (e: WindowProtocol.IMessageEvent<TMessageContent>) => void = (event) => {
      events.push(event);
    };

    listen.on('message', handler);

    return this.getIframeContent(iframe).then((win) => {
      const dispatch = new WindowProtocol<TMessageContent>(
        win.win,
        WindowProtocol.PROTOCOL_TYPES.DISPATCH,
      );
      const adapter = new WindowAdapter([listen], [dispatch], this.unPrepareOptions(myOptions));

      events.forEach((event) => {
        adapter.onMessage(event);
      });
      listen.off('message', handler);

      return adapter;
    });
  }

  private static prepareOptions(
    options: Partial<WindowAdapter.IOptions<TOrList<string>, TOrList<TChanelId>>> = EMPTY_OPTIONS,
  ): WindowAdapter.IOptions<UniqPrimitiveCollection<string>, UniqPrimitiveCollection<TChanelId>> {
    const concat =
      <U extends string | number | symbol>(initialValue: UniqPrimitiveCollection<U>) =>
      (list: U[]) =>
        list.reduce((set, item) => set.add(item), initialValue);
    const getCollection = <U extends string | number | symbol>(
      data: TOrList<U>,
      initial: UniqPrimitiveCollection<U>,
    ) => pipe<TOrList<U>, U[], UniqPrimitiveCollection<U>>(toArray, concat(initial))(data);

    const origins = getCollection<string>(
      options.origins ?? [],
      new UniqPrimitiveCollection([window.location.origin]),
    );
    const chanelId = getCollection<TChanelId>(
      options.availableChanelId ?? [],
      new UniqPrimitiveCollection(),
    );

    return { ...options, origins, availableChanelId: chanelId };
  }

  private static unPrepareOptions(
    options: WindowAdapter.IOptions<
      UniqPrimitiveCollection<string>,
      UniqPrimitiveCollection<TChanelId>
    >,
  ): WindowAdapter.IOptions<TOrList<string>, TOrList<TChanelId>> {
    return {
      origins: options.origins.toArray(),
      availableChanelId: options.availableChanelId.toArray(),
      chanelId: options.chanelId,
    };
  }

  private static getIframeContent(content?: TContent): Promise<{ win: WindowProtocol.IWindow }> {
    if (!content) {
      return Promise.resolve({ win: (window.opener ?? window.parent) as WindowProtocol.IWindow });
    }
    if (!(content instanceof HTMLIFrameElement)) {
      return Promise.resolve({ win: content });
    }
    /* v8 ignore start -- requires real browser iframe load lifecycle */
    if (content.contentWindow) {
      return Promise.resolve({ win: content.contentWindow as WindowProtocol.IWindow });
    }
    return new Promise((resolve, reject) => {
      content.addEventListener(
        'load',
        () => {
          resolve({ win: content.contentWindow as WindowProtocol.IWindow });
        },
        false,
      );
      content.addEventListener('error', reject, false);
    });
    /* v8 ignore stop */
  }

  private static getContentOrigin(content?: TContent): string | null {
    if (!content) {
      try {
        return new URL(document.referrer).origin;
      } catch (_e) {
        return null;
      }
    }

    if (!(content instanceof HTMLIFrameElement)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- window.top exists in normal browsing contexts
        return window.top!.origin;
      } catch (_e) {
        return null;
      }
    }

    /* v8 ignore start -- requires real browser iframe with src */
    try {
      return new URL(content.src).origin || null;
    } catch (_e) {
      return null;
    }
    /* v8 ignore stop */
  }
}

export namespace WindowAdapter {
  export interface IOptions<ORIGINS, CHANEL_ID> {
    origins: ORIGINS;
    availableChanelId: CHANEL_ID;
    chanelId?: TChanelId | undefined;
  }
}
