import { Adapter } from './Adapter.js';
import type { IOneArgFunction, TChannelId, TMessageContent } from '../bus/Bus.js';
import { EventType, ResponseStatus } from '../bus/Bus.js';
import { console } from '../utils/console/index.js';
import { pipe, toArray, uniqueId } from '../utils/utils/index.js';
import { UniqPrimitiveCollection } from '../utils/UniqPrimitiveCollection.js';
import { WindowProtocol } from '../protocols/WindowProtocol.js';

type TOrList<T> = T | T[];
type TContent = HTMLIFrameElement | WindowProtocol.IWindow;

const EMPTY_OPTIONS: WindowAdapter.IOptions<TOrList<string>, TOrList<TChannelId>> = {
  origins: [],
  availableChannelId: [],
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
    UniqPrimitiveCollection<TChannelId>
  >;
  private readonly callbacks: IOneArgFunction<TMessageContent, void>[] = [];

  constructor(
    listen: WindowProtocol<TMessageContent>[],
    dispatch: WindowProtocol<TMessageContent>[],
    options?: Partial<WindowAdapter.IOptions<TOrList<string>, TOrList<TChannelId>>>,
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
    const message = { ...data, channelId: this.options.channelId };
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
    if (typeof event.data !== 'object' || event.data?.type == null) {
      console.info('WindowAdapter: Block event. Wrong event format!', event.data);
      return false;
    }

    // Runtime schema validation: reject messages that don't conform to the protocol
    if (!WindowAdapter.isValidMessage(event.data)) {
      console.info('WindowAdapter: Block event. Invalid message schema!', event.data);
      return false;
    }

    if (!this.options.origins.has('*') && !this.options.origins.has(event.origin)) {
      console.info(`SimpleWindowAdapter: Block event by origin "${event.origin}"`);
      return false;
    }

    if (!this.options.availableChannelId.size) {
      return true;
    }

    const access = !!(
      event.data.channelId && this.options.availableChannelId.has(event.data.channelId)
    );

    if (!access) {
      console.info(
        `SimpleWindowAdapter: Block event by channel id "${String(event.data.channelId)}"`,
      );
    }

    return access;
  }

  /**
   * Validates that a message conforms to the expected protocol schema.
   * Rejects messages with wrong field types that could cause runtime errors.
   */
  private static isValidMessage(data: TMessageContent): boolean {
    // Cast to number: this validates untrusted postMessage data at runtime
    const type = data.type as number;

    // type must be a valid EventType enum value
    if (
      type !== (EventType.Event as number) &&
      type !== (EventType.Action as number) &&
      type !== (EventType.Response as number)
    ) {
      return false;
    }

    // Events and Actions require a 'name' field
    if (type === (EventType.Event as number) || type === (EventType.Action as number)) {
      const msg = data as { name?: unknown };
      if (msg.name == null) {
        return false;
      }
    }

    // Actions and Responses require an 'id' field
    if (type === (EventType.Action as number) || type === (EventType.Response as number)) {
      const msg = data as { id?: unknown };
      if (msg.id == null) {
        return false;
      }
    }

    // Responses require a valid 'status' field
    if (type === (EventType.Response as number)) {
      const msg = data as { status?: unknown };
      if (msg.status !== ResponseStatus.Success && msg.status !== ResponseStatus.Error) {
        return false;
      }
    }

    return true;
  }

  public static createSimpleWindowAdapter(
    iframe?: TContent,
    options?: Partial<WindowAdapter.IOptions<TOrList<string>, TOrList<TChannelId>>>,
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
        origin ?? '*',
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
    options: Partial<WindowAdapter.IOptions<TOrList<string>, TOrList<TChannelId>>> = EMPTY_OPTIONS,
  ): WindowAdapter.IOptions<UniqPrimitiveCollection<string>, UniqPrimitiveCollection<TChannelId>> {
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
    const channelId = getCollection<TChannelId>(
      options.availableChannelId ?? [],
      new UniqPrimitiveCollection(),
    );

    return { ...options, origins, availableChannelId: channelId };
  }

  private static unPrepareOptions(
    options: WindowAdapter.IOptions<
      UniqPrimitiveCollection<string>,
      UniqPrimitiveCollection<TChannelId>
    >,
  ): WindowAdapter.IOptions<TOrList<string>, TOrList<TChannelId>> {
    return {
      origins: options.origins.toArray(),
      availableChannelId: options.availableChannelId.toArray(),
      channelId: options.channelId,
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
  export interface IOptions<ORIGINS, CHANNEL_ID> {
    origins: ORIGINS;
    availableChannelId: CHANNEL_ID;
    channelId?: TChannelId | undefined;
  }
}
