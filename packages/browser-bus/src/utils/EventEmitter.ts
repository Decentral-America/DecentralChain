/**
 * Minimal typed event emitter — zero-dependency replacement for `typed-ts-events`.
 * @internal
 */

interface HandlerEntry<D = unknown> {
  handler: (data: Readonly<D>) => void;
  context: unknown;
  once: boolean;
}

/** Per-event typed handler storage — preserves T[K] through the handler lifecycle. */
type EventStore<T> = {
  [K in keyof T]?: HandlerEntry<T[K]>[];
};

export class EventEmitter<T extends { [K in keyof T]: unknown } = Record<string, unknown>> {
  private readonly _events = Object.create(null) as EventStore<T>;

  /**
   * Optional error handler invoked when a listener throws.
   * If not set, errors are silently swallowed (legacy behavior).
   */
  public onError?: (error: unknown, eventName: string) => void;

  public hasListeners(eventName: keyof T): boolean {
    const handlers = this._events[eventName];
    return !!(handlers && handlers.length > 0);
  }

  public getActiveEvents(): (keyof T)[] {
    return (Object.keys(this._events as Record<string, unknown>) as (keyof T)[]).filter((name) =>
      this.hasListeners(name),
    );
  }

  public trigger<K extends keyof T>(eventName: K, params: Readonly<T[K]>): void {
    const handlers = this._events[eventName];
    if (!handlers) return;

    const remaining = handlers.filter((entry) => {
      try {
        entry.handler.call(entry.context, params);
      } catch (error: unknown) {
        if (this.onError) {
          this.onError(error, eventName as string);
        }
      }
      return !entry.once;
    });

    if (remaining.length === 0) {
      delete this._events[eventName];
    } else {
      this._events[eventName] = remaining;
    }
  }

  public on<K extends keyof T>(eventName: K, handler: IHandler<T[K]>, context?: unknown): void {
    this._register(eventName, handler, context, false);
  }

  public once<K extends keyof T>(eventName: K, handler: IHandler<T[K]>, context?: unknown): void {
    this._register(eventName, handler, context, true);
  }

  public off(): void;
  public off<K extends keyof T>(eventName: K, handler?: IHandler<T[K]>): void;
  public off<K extends keyof T>(eventName?: K, handler?: IHandler<T[K]>): void {
    if (eventName === undefined) {
      for (const key of Object.keys(this._events as Record<string, unknown>)) {
        delete (this._events as Record<string, unknown>)[key];
      }
      return;
    }

    if (!handler) {
      delete this._events[eventName];
      return;
    }

    const entries = this._events[eventName];
    if (entries) {
      const remaining = entries.filter((item) => item.handler !== handler);
      if (remaining.length === 0) {
        delete this._events[eventName];
      } else {
        this._events[eventName] = remaining;
      }
    }
  }

  private _register<K extends keyof T>(
    eventName: K,
    handler: IHandler<T[K]>,
    context: unknown,
    once: boolean,
  ): void {
    this._events[eventName] ??= [];
    this._events[eventName]?.push({ context, handler, once });
  }
}

export type IHandler<T> = (data: Readonly<T>) => void;
