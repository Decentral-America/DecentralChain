import { type Adapter } from '../adapters/Adapter.js';
import { console } from '../utils/console/index.js';
import { uniqueId } from '../utils/utils/index.js';

/** Message type discriminator. */
export enum EventType {
  Event = 0,
  Action = 1,
  Response = 2,
}

/** Response status discriminator. */
export enum ResponseStatus {
  Success = 0,
  Error = 1,
}

/**
 * A message bus that enables typed event dispatch and request/response patterns
 * across browser window boundaries via an {@link Adapter} transport.
 */
export class Bus<
  // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
  T extends Record<string, any> = any,
  // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
  H extends Record<string, (data: any) => any> = any,
> {
  public id: string = uniqueId('bus');
  private _adapter: Adapter;
  private readonly _activeRequestHash: Record<string, ISentActionData>;
  private readonly _timeout: number;
  private readonly _eventHandlers: Record<string, IEventHandlerData[]>;
  private readonly _requestHandlers: H;

  constructor(adapter: Adapter, defaultTimeout?: number) {
    this._timeout = defaultTimeout ?? 5000;
    this._adapter = adapter;
    this._adapter.addListener((data) => {
      this._onMessage(data);
    });
    this._eventHandlers = Object.create(null) as Record<string, IEventHandlerData[]>;
    this._activeRequestHash = Object.create(null) as Record<string, ISentActionData>;
    this._requestHandlers = Object.create(null) as H;

    console.info(`Create Bus with id "${this.id}"`);
  }

  /** Dispatch an event to all connected bus instances. */
  public dispatchEvent<K extends keyof T>(name: K, data: T[K]): this {
    this._adapter.send(Bus._createEvent(name as string, data));
    console.info(`Dispatch event "${String(name)}"`, data);
    return this;
  }

  /** Send a request to the remote bus and wait for a response. */
  public request<E extends keyof H>(
    name: E,
    data?: Parameters<H[E]>[0],
    timeout?: number,
  ): Promise<ReturnType<H[E]> extends Promise<infer P> ? P : ReturnType<H[E]>> {
    // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
    return new Promise<any>((resolve, reject) => {
      const id = uniqueId(`${this.id}-action`);
      const wait = timeout ?? this._timeout;

      let timer: ReturnType<typeof setTimeout> | undefined;

      if ((timeout ?? this._timeout) !== -1) {
        timer = setTimeout(() => {
          delete this._activeRequestHash[id];
          const error = new Error(
            `Timeout error for request with name "${String(name)}" and timeout ${wait}!`,
          );
          console.error(error);
          reject(error);
        }, wait);
      }

      const cancelTimeout = () => {
        if (timer) {
          clearTimeout(timer);
        }
      };

      this._activeRequestHash[id] = {
        reject: (error: unknown) => {
          cancelTimeout();
          console.error(`Error request with name "${String(name)}"`, error);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
        resolve: (data: unknown) => {
          cancelTimeout();
          console.info(`Request with name "${String(name)}" success resolved!`, data);
          resolve(data);
        },
      };

      this._adapter.send({ id, type: EventType.Action, name, data });
      console.info(`Request with name "${String(name)}"`, data);
    });
  }

  /** Subscribe to an event by name. */
  // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
  public on<K extends keyof T>(name: K, handler: IOneArgFunction<T[K], void>, context?: any): this {
    return this._addEventHandler(name as string, handler, context, false);
  }

  /** Subscribe to an event once — the handler is removed after the first fire. */
  public once<K extends keyof T>(
    name: K,
    handler: IOneArgFunction<T[K], void>,
    // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
    context?: any,
  ): this {
    return this._addEventHandler(name as string, handler, context, true);
  }

  /** Unsubscribe from events. */
  public off(name?: string, handler?: IOneArgFunction<T[keyof T], void>): this;
  public off<K extends keyof T>(name?: K, handler?: IOneArgFunction<T[K], void>): this;
  public off(name?: string, handler?: IOneArgFunction<T[keyof T], void>): this {
    if (!name) {
      Object.keys(this._eventHandlers).forEach((n) => {
        this.off(n, handler);
      });
      return this;
    }

    if (!this._eventHandlers[name]) {
      return this;
    }

    if (!handler) {
      this._eventHandlers[name].slice().forEach((info) => {
        this.off(name, info.handler);
      });
      return this;
    }

    this._eventHandlers[name] = this._eventHandlers[name].filter(
      (info) => info.handler !== handler,
    );

    if (!this._eventHandlers[name].length) {
      delete this._eventHandlers[name];
    }

    return this;
  }

  /** Register a handler for incoming requests. */
  public registerRequestHandler(name: keyof H, handler: H[keyof H]): this {
    if (this._requestHandlers[name]) {
      throw new Error('Duplicate request handler!');
    }

    this._requestHandlers[name] = handler;

    return this;
  }

  /** Remove a previously registered request handler. */
  public unregisterHandler(name: keyof H): this {
    if (this._requestHandlers[name]) {
      delete this._requestHandlers[name];
    }
    return this;
  }

  /** Create a new Bus with the same handlers but a different adapter. */
  public changeAdapter(adapter: Adapter): Bus {
    const bus = new Bus(adapter, this._timeout);

    Object.keys(this._eventHandlers).forEach((name) => {
      // biome-ignore lint/style/noNonNullAssertion: asserted safe
      this._eventHandlers[name]!.forEach((info) => {
        if (info.once) {
          bus.once(name, info.handler, info.context);
        } else {
          bus.on(name, info.handler, info.context);
        }
      });
    });

    Object.keys(this._requestHandlers as Record<string, unknown>).forEach((name) => {
      bus.registerRequestHandler(
        name,
        (this._requestHandlers as Record<string, unknown>)[name] as H[keyof H],
      );
    });

    return bus;
  }

  /** Destroy this bus and its adapter. */
  public destroy(): void {
    console.info('Destroy Bus');
    this.off();

    // Reject all pending requests and clear their timers to prevent
    // dangling closures, memory leaks, and stale timeout callbacks.
    for (const id of Object.keys(this._activeRequestHash)) {
      const entry = this._activeRequestHash[id];
      if (entry) {
        entry.reject(new Error('Bus destroyed'));
      }
      delete this._activeRequestHash[id];
    }

    this._adapter.destroy();
  }

  private _addEventHandler(
    name: string,
    // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
    handler: IOneArgFunction<any, void>,
    context: unknown,
    once: boolean,
  ): this {
    this._eventHandlers[name] ??= [];
    this._eventHandlers[name].push({ handler, once, context });

    return this;
  }

  private _onMessage(message: TMessageContent): void {
    switch (message.type) {
      case EventType.Event:
        console.info(`Has event with name "${String(message.name)}"`, message.data);
        this._fireEvent(String(message.name), message.data);
        break;
      case EventType.Action:
        console.info(
          `Start action with id "${message.id}" and name "${String(message.name)}"`,
          message.data,
        );
        this._createResponse(message);
        break;
      case EventType.Response:
        console.info(
          `Start response with name "${message.id}" and status "${String(message.status)}"`,
          message.content,
        );
        this._fireEndAction(message);
        break;
    }
  }

  private _createResponse(message: IRequestData): void {
    const sendError = (error: Error) => {
      console.error(error);
      this._adapter.send({
        id: message.id,
        type: EventType.Response,
        status: ResponseStatus.Error,
        content: Bus._dataToMessage(error),
      });
    };

    const handlerName = String(message.name);
    if (!this._requestHandlers[handlerName]) {
      sendError(new Error(`Has no handler for "${handlerName}" action!`));
      return;
    }

    try {
      const result: unknown = (this._requestHandlers[handlerName] as (data: unknown) => unknown)(
        message.data,
      );

      if (Bus._isPromise(result)) {
        result.then((data: unknown) => {
          this._adapter.send({
            id: message.id,
            type: EventType.Response,
            status: ResponseStatus.Success,
            content: Bus._dataToMessage(data),
          });
        }, sendError);
      } else {
        this._adapter.send({
          id: message.id,
          type: EventType.Response,
          status: ResponseStatus.Success,
          content: Bus._dataToMessage(result),
        });
      }
    } catch (e) {
      sendError(e as Error);
    }
  }

  private _fireEndAction(message: IResponseData) {
    const activeRequest = this._activeRequestHash[message.id];
    if (activeRequest) {
      switch (message.status) {
        case ResponseStatus.Error:
          activeRequest.reject(Bus._messageToData(message.content as IInternalMessage));
          break;
        case ResponseStatus.Success:
          activeRequest.resolve(Bus._messageToData(message.content as IInternalMessage));
          break;
      }
      delete this._activeRequestHash[message.id];
    }
  }

  private _fireEvent(name: string, value: unknown): void {
    const handlers = this._eventHandlers[name];
    if (!handlers) {
      return;
    }

    this._eventHandlers[name] = handlers.slice().filter((handlerInfo) => {
      try {
        handlerInfo.handler.call(handlerInfo.context, value);
      } catch (e) {
        console.warn(e);
      }
      return !handlerInfo.once;
    });

    if (!this._eventHandlers[name].length) {
      delete this._eventHandlers[name];
    }
  }

  private static _createEvent(eventName: string, data: unknown): IEventData {
    return {
      type: EventType.Event,
      name: eventName,
      data,
    };
  }

  private static _isPromise(some: unknown): some is Promise<unknown> {
    return (
      typeof some === 'object' &&
      some !== null &&
      'then' in some &&
      typeof (some as { then: unknown }).then === 'function'
    );
  }

  private static _dataToMessage(data: unknown): IInternalMessage {
    if (data instanceof Error) {
      return {
        type: 'error',
        content: data.message,
        name: data.name,
        // Stack traces intentionally omitted — sending them over postMessage
        // would leak internal code paths to potentially untrusted windows.
      };
    }
    return { type: 'data', content: data };
  }

  private static _messageToData(message: unknown): unknown {
    if (
      typeof message !== 'object' ||
      message === null ||
      !('type' in message) ||
      !('content' in message)
    ) {
      return message;
    }
    const msg = message as IInternalMessage;
    if (!['error', 'data'].includes(msg.type)) {
      return message;
    }
    if (msg.type === 'error') {
      const error = new Error(typeof msg.content === 'string' ? msg.content : 'Unknown error');
      if ('name' in msg && typeof msg.name === 'string') {
        error.name = msg.name;
      }
      // Remote stack traces are intentionally NOT applied — they originate
      // from an untrusted window and could mislead debugging or mask attacks.
      return error;
    }
    return msg.content;
  }
}

/** A single-argument function type. */
export type IOneArgFunction<T, R> = (data: T) => R;

/** Union of all message content types sent through the bus. */
export type TMessageContent = IEventData | IRequestData | IResponseData;

/** Channel identifier type. */
export type TChannelId = string | number;

/** Event message shape. */
export interface IEventData {
  type: EventType.Event;
  channelId?: TChannelId | undefined;
  name: string | number | symbol;
  // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
  data?: any;
}

/** Request (action) message shape. */
export interface IRequestData {
  id: string | number;
  channelId?: TChannelId | undefined;
  type: EventType.Action;
  name: string | number | symbol;
  // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
  data?: any;
}

/** Response message shape. */
export interface IResponseData {
  id: string | number;
  channelId?: TChannelId | undefined;
  type: EventType.Response;
  status: ResponseStatus;
  // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
  content: any;
}

interface ISentActionData {
  resolve: (data: unknown) => void;
  reject: (error: unknown) => void;
}

interface IEventHandlerData {
  context: unknown;
  once: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
  handler: IOneArgFunction<any, void>;
}

interface IInternalMessage {
  type: 'data' | 'error';
  content: unknown;
  /** Original error name (e.g. 'TypeError', 'RangeError'). */
  name?: string | undefined;
}
