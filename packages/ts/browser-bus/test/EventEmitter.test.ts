import { describe, expect, it, vi } from 'vitest';

import { EventEmitter } from '../src/utils/EventEmitter.js';

describe('EventEmitter', () => {
  it('once() fires handler only once', () => {
    const emitter = new EventEmitter<{ ping: string }>();
    const handler = vi.fn();

    emitter.once('ping', handler);
    emitter.trigger('ping', 'a');
    emitter.trigger('ping', 'b');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('a');
    // after firing once, the event key should be cleaned up
    expect(emitter.hasListeners('ping')).toBe(false);
  });

  it('once() auto-removes entry so remaining.length === 0 deletes the key', () => {
    const emitter = new EventEmitter<{ x: number }>();
    emitter.once('x', () => {});
    expect(emitter.getActiveEvents()).toContain('x');

    emitter.trigger('x', 1);
    expect(emitter.getActiveEvents()).not.toContain('x');
  });

  it('onError callback is invoked when a listener throws', () => {
    const emitter = new EventEmitter<{ boom: string }>();
    const errors: { error: unknown; eventName: string }[] = [];

    emitter.onError = (error, eventName) => {
      errors.push({ error, eventName });
    };

    emitter.on('boom', () => {
      throw new Error('handler exploded');
    });

    emitter.trigger('boom', 'data');

    expect(errors).toHaveLength(1);
    expect(errors[0]?.eventName).toBe('boom');
    expect(errors[0]?.error).toBeInstanceOf(Error);
  });

  it('off() with no arguments removes all listeners', () => {
    const emitter = new EventEmitter<{ a: number; b: number }>();
    emitter.on('a', () => {});
    emitter.on('b', () => {});

    expect(emitter.getActiveEvents()).toHaveLength(2);

    emitter.off();

    expect(emitter.getActiveEvents()).toHaveLength(0);
    expect(emitter.hasListeners('a')).toBe(false);
    expect(emitter.hasListeners('b')).toBe(false);
  });

  it('off(eventName) without handler removes all listeners for that event', () => {
    const emitter = new EventEmitter<{ a: number }>();
    emitter.on('a', () => {});
    emitter.on('a', () => {});

    expect(emitter.hasListeners('a')).toBe(true);

    emitter.off('a');

    expect(emitter.hasListeners('a')).toBe(false);
  });

  it('off(eventName, handler) removes only the specific handler', () => {
    const emitter = new EventEmitter<{ a: number }>();
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on('a', h1);
    emitter.on('a', h2);

    emitter.off('a', h1);
    emitter.trigger('a', 42);

    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledWith(42);
  });

  it('off(eventName, handler) cleans up key when last handler removed', () => {
    const emitter = new EventEmitter<{ a: number }>();
    const h = vi.fn();
    emitter.on('a', h);

    emitter.off('a', h);
    expect(emitter.hasListeners('a')).toBe(false);
  });

  it('trigger does not throw when no listeners registered for event', () => {
    const emitter = new EventEmitter<{ ghost: string }>();
    expect(() => emitter.trigger('ghost', 'boo')).not.toThrow();
  });

  it('handler context is applied correctly', () => {
    const emitter = new EventEmitter<{ ctx: string }>();
    const ctx = { value: 0 };

    emitter.on(
      'ctx',
      function (this: typeof ctx) {
        this.value = 99;
      },
      ctx,
    );

    emitter.trigger('ctx', 'go');
    expect(ctx.value).toBe(99);
  });
});
