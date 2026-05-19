type Handler<T> = (data: T) => void;

interface HandlerEntry<T> {
  fn: Handler<T>;
  once: boolean;
}

/**
 * Minimal typed pub/sub Signal — replaces ts-utils Signal<T>.
 * API-compatible with the subset used in this codebase:
 *   on / once / off / dispatch
 */
export class Signal<T> {
  private _handlers: Array<HandlerEntry<T>> = [];

  on(handler: Handler<T>): void {
    this._handlers.push({ fn: handler, once: false });
  }

  once(handler: Handler<T>): void {
    this._handlers.push({ fn: handler, once: true });
  }

  off(handler?: Handler<T>): void {
    if (handler == null) {
      this._handlers = [];
    } else {
      this._handlers = this._handlers.filter((h) => h.fn !== handler);
    }
  }

  dispatch(data: T): void {
    // Snapshot handlers before mutation so dispatch is re-entrant safe.
    const snapshot = [...this._handlers];
    // Remove once-handlers before invoking so nested dispatch sees a clean slate.
    this._handlers = this._handlers.filter((h) => !h.once);
    for (const { fn } of snapshot) {
      fn(data);
    }
  }
}
