/**
 * Minimal typed event emitter — zero-dependency replacement for `typed-ts-events`.
 * @internal
 */

interface HandlerEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous handler storage
  handler: (...args: any[]) => any;
  context: unknown;
  once: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic event map base constraint
export class EventEmitter<T extends Record<string, any>> {
  private readonly _events: Record<string, HandlerEntry[]> = Object.create(null) as Record<
    string,
    HandlerEntry[]
  >;

  /**
   * Optional error handler invoked when a listener throws.
   * If not set, errors are silently swallowed (legacy behavior).
   */
  public onError?: (error: unknown, eventName: string) => void;

  public hasListeners(eventName: keyof T): boolean {
    const handlers = this._events[eventName as string];
    return !!(handlers && handlers.length > 0);
  }

  public getActiveEvents(): (keyof T)[] {
    return (Object.keys(this._events) as (keyof T)[]).filter((name) => this.hasListeners(name));
  }

  public trigger<K extends keyof T>(eventName: K, params: Readonly<T[K]>): void {
    const key = eventName as string;
    const handlers = this._events[key];
    if (!handlers) return;

    const remaining = handlers.filter((entry) => {
      try {
        entry.handler.call(entry.context, params);
      } catch (error: unknown) {
        if (this.onError) {
          this.onError(error, key);
        }
      }
      return !entry.once;
    });

    if (remaining.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed hash cleanup
      delete this._events[key];
    } else {
      this._events[key] = remaining;
    }
  }

  public on<K extends keyof T>(
    eventName: K,
    handler: EventEmitter.IHandler<T[K]>,
    context?: unknown,
  ): void {
    this._register(eventName, handler, context, false);
  }

  public once<K extends keyof T>(
    eventName: K,
    handler: EventEmitter.IHandler<T[K]>,
    context?: unknown,
  ): void {
    this._register(eventName, handler, context, true);
  }

  public off(): void;
  public off<K extends keyof T>(eventName: K, handler?: EventEmitter.IHandler<T[K]>): void;
  public off<K extends keyof T>(eventName?: K, handler?: EventEmitter.IHandler<T[K]>): void {
    if (eventName === undefined) {
      for (const key of Object.keys(this._events)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed hash cleanup
        delete this._events[key];
      }
      return;
    }

    const key = eventName as string;

    if (!handler) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed hash cleanup
      delete this._events[key];
      return;
    }

    const entries = this._events[key];
    if (entries) {
      const remaining = entries.filter((item) => item.handler !== handler);
      if (remaining.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed hash cleanup
        delete this._events[key];
      } else {
        this._events[key] = remaining;
      }
    }
  }

  private _register<K extends keyof T>(
    eventName: K,
    handler: EventEmitter.IHandler<T[K]>,
    context: unknown,
    once: boolean,
  ): void {
    const key = eventName as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment -- handler variance cast
    const entry: HandlerEntry = { handler: handler as any, context, once };
    this._events[key] ??= [];
    this._events[key].push(entry);
  }
}

export namespace EventEmitter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- handler return type must be flexible
  export type IHandler<T> = (data: Readonly<T>) => any;
}
