/**
 * Browser-native event emitter backed by EventTarget.
 *
 * Drop-in replacement for the Node.js `events` package in browser-extension
 * controllers. Provides `.on` / `.off` / `.once` / `.emit` with the same
 * calling convention as Node.js EventEmitter so every call-site — both inside
 * the controller classes and in `background.ts` — works without modification.
 *
 * Multi-argument emits are serialised as `CustomEvent.detail` arrays so
 * `emit('event', a, b)` → listener receives `(a, b)`.
 *
 * Implementation notes:
 *  - `#wrappers` uses a two-level structure: `WeakMap<listener, Map<type, wrapped>>`
 *    so the same function can be registered for multiple event types without key
 *    collision. WeakMap keys are GC-eligible once the original listener is no
 *    longer referenced elsewhere, preventing leaks in long-lived services.
 *  - `once` delegates to `on` with `{ once: true }` — EventTarget handles the
 *    auto-removal. The wrapper entry stays in `#wrappers` until the WeakMap key
 *    is collected; calling `off` before the event fires also works correctly.
 *  - `emit` returns the boolean from `dispatchEvent` (false only if a listener
 *    called `preventDefault()`; no DCC code inspects this return value).
 *
 * Browser / platform support:
 *  - Subclassing EventTarget: Chrome 64 · Firefox 59 · Safari 14
 *    (all above the MV3 floor of Chrome 88).
 *  - CustomEvent in Service Workers: available in every Chromium MV3 background.
 */
export class TypedEventEmitter extends EventTarget {
  /**
   * Two-level indirection:
   *   original listener → per-event-type → wrapped EventListener
   *
   * Allows the same function to be registered for multiple event types.
   */
  // biome-ignore lint/suspicious/noExplicitAny: listener map must accept any function signature to match EventEmitter API
  readonly #wrappers = new WeakMap<(...args: any[]) => void, Map<string, EventListener>>();

  // biome-ignore lint/suspicious/noExplicitAny: matches Node.js EventEmitter API — positional args are heterogeneous
  on(type: string, listener: (...args: any[]) => void): this {
    return this.#register(type, listener, {});
  }

  // biome-ignore lint/suspicious/noExplicitAny: matches Node.js EventEmitter API — positional args are heterogeneous
  once(type: string, listener: (...args: any[]) => void): this {
    return this.#register(type, listener, { once: true });
  }

  // biome-ignore lint/suspicious/noExplicitAny: matches Node.js EventEmitter API — positional args are heterogeneous
  off(type: string, listener: (...args: any[]) => void): this {
    const wrapped = this.#wrappers.get(listener)?.get(type);
    if (wrapped != null) {
      this.removeEventListener(type, wrapped);
      this.#wrappers.get(listener)?.delete(type);
    }
    return this;
  }

  emit(type: string, ...args: unknown[]): boolean {
    return this.dispatchEvent(new CustomEvent(type, { detail: args }));
  }

  #register(
    type: string,
    // biome-ignore lint/suspicious/noExplicitAny: EventEmitter listener pattern — heterogeneous positional args
    listener: (...args: any[]) => void,
    options: AddEventListenerOptions,
  ): this {
    const wrapped: EventListener = (e) => listener(...(e as CustomEvent<unknown[]>).detail);

    let byType = this.#wrappers.get(listener);
    if (byType == null) {
      byType = new Map<string, EventListener>();
      this.#wrappers.set(listener, byType);
    }
    byType.set(type, wrapped);

    this.addEventListener(type, wrapped, options);
    return this;
  }
}
