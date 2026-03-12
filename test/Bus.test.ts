import { Signal } from 'ts-utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Bus, config, console, EventType, type TMessageContent } from '../src/index.js';
import { MockAdapter } from './mock/MockAdapter.js';

describe('Bus', () => {
  let adapter: MockAdapter;
  let bus: Bus;

  beforeEach(() => {
    config.console.logLevel = config.console.LOG_LEVEL.PRODUCTION;
    adapter = new MockAdapter();
    bus = new Bus(adapter);
  });

  it('destroy', () => {
    let counter = 0;
    adapter.destroy = () => {
      counter++;
    };
    bus.destroy();
    expect(counter).toBe(1);
  });

  it('bus id is unique', () => {
    const first = new Bus(new MockAdapter());
    const second = new Bus(new MockAdapter());

    expect(first.id).not.toBe(second.id);
  });

  it('bus dispatch event', () => {
    const adapter = new MockAdapter();
    const bus = new Bus(adapter);
    const eventName = 'test';
    const eventData = { some: true };
    let wasCall = 0;

    adapter.onSend.once((eventData: TMessageContent) => {
      if (eventData.type !== EventType.Event) {
        throw new Error('Wrong event type!');
      }

      expect(eventData.type).toBe(EventType.Event);
      expect(eventData.name).toBe(eventName);
      expect(eventData.data).toBe(undefined);
      wasCall++;
    });

    bus.dispatchEvent(eventName, void 0);

    adapter.onSend.once((event: TMessageContent) => {
      if (event.type !== EventType.Event) {
        throw new Error('Wrong event type!');
      }
      wasCall++;
      expect(event.data).toBe(eventData);
    });

    bus.dispatchEvent(eventName, eventData);

    expect(wasCall).toBe(2);
  });

  describe('console', () => {
    const consoleModule = ((root: { console: Console }) => root.console)(
      typeof self !== 'undefined' ? self : globalThis,
    );

    const originError = consoleModule.error;
    const originInfo = consoleModule.info;

    let info: Signal<Array<any>>;
    let error: Signal<Array<any>>;

    beforeEach(() => {
      info = new Signal<Array<any>>();
      error = new Signal<Array<any>>();
      consoleModule.info = (...args: Array<any>) => {
        info.dispatch(args);
      };
      consoleModule.error = (...args: Array<any>) => {
        error.dispatch(args);
      };
    });

    it('Check production level', () =>
      new Promise<void>((done) => {
        let counter = 0;
        info.on(() => {
          counter++;
        });
        error.on(() => {
          counter++;
        });

        new MockAdapter();
        new Bus(adapter).request('some', null, 10).catch(() => {
          expect(counter).toBe(0);
          const message = console.getSavedMessages('error');
          const infoMessages = console.getSavedMessages('info');
          expect(infoMessages).toHaveLength(0);
          expect(String(message[0]?.[0])).toBe(
            'Error: Timeout error for request with name "some" and timeout 10!',
          );
          done();
        });
      }));

    it('Check errors level', () =>
      new Promise<void>((done) => {
        config.console.logLevel = config.console.LOG_LEVEL.ERRORS;
        let counter = 0;
        info.on(() => {
          counter++;
        });
        error.on((e) => {
          expect(String(e)).toBe(
            'Error: Timeout error for request with name "some" and timeout 10!',
          );
          counter++;
        });

        new MockAdapter();
        new Bus(adapter).request('some', null, 10).catch(() => {
          expect(counter).toBe(1);
          done();
        });
      }));

    it('Check verbose level', () =>
      new Promise<void>((done) => {
        config.console.logLevel = config.console.LOG_LEVEL.VERBOSE;
        let counter = 0;
        info.on(() => {
          counter++;
        });
        error.on((e) => {
          expect(String(e)).toBe(
            'Error: Timeout error for request with name "some" and timeout 10!',
          );
          counter++;
        });

        new MockAdapter();
        new Bus(adapter).request('some', null, 10).catch(() => {
          expect(counter).toBe(3);
          done();
        });
      }));

    afterAll(() => {
      consoleModule.error = originError;
      consoleModule.info = originInfo;
    });
  });

  it('change adapter', () => {
    let count = 0;

    bus.once('some-event', () => {
      count++;
    });

    bus.on('some-event', () => {
      count++;
    });

    bus.registerRequestHandler('some-request', () => {
      count++;
    });

    const newAdapter = new MockAdapter();
    bus.changeAdapter(newAdapter);

    newAdapter.dispatchAdapterEvent({ name: 'some-request', id: 0, type: EventType.Action });
    newAdapter.dispatchAdapterEvent({ name: 'some-event', type: EventType.Event });

    expect(count).toBe(3);
  });

  describe('event emitter', () => {
    const event = {
      type: EventType.Event,
      name: 'test-event',
      data: { someData: true },
    } as const;

    it('on', () => {
      let count = 0;

      bus.on(event.name, (data) => {
        count++;
        expect(data).toBe(event.data);
      });

      bus.on(event.name, (data) => {
        count++;
        expect(data).toBe(event.data);
      });

      adapter.dispatchAdapterEvent(event as any);
      adapter.dispatchAdapterEvent({ ...event, name: 'new' } as any);
      adapter.dispatchAdapterEvent(event as any);

      expect(count).toBe(4);
    });

    it('once', () => {
      let count = 0;

      bus.once(event.name, (data) => {
        count++;
        expect(data).toBe(event.data);
      });

      adapter.dispatchAdapterEvent(event as any);
      adapter.dispatchAdapterEvent({ ...event, name: 'new' } as any);
      adapter.dispatchAdapterEvent(event as any);

      expect(count).toBe(1);
    });

    it('off', () => {
      let count = 0;

      const handlers = [() => count++, () => count++];

      handlers.forEach((handler) => {
        bus.on(event.name, handler);
      });
      bus.off(event.name, handlers[0]).off('some-event');

      adapter.dispatchAdapterEvent(event as any);
      expect(count).toBe(1);

      bus.off();

      adapter.dispatchAdapterEvent(event as any);
      expect(count).toBe(1);
    });

    it('should call second handler', () => {
      let count = 0;
      const eventName = 'some-event';
      [
        () => {
          throw new Error('Some error!');
        },
        () => count++,
      ].forEach((f) => {
        bus.on(eventName, f);
      });

      adapter.dispatchAdapterEvent({
        name: eventName,
        type: EventType.Event,
      });

      expect(count).toBe(1);
    });
  });

  describe('request api', () => {
    it('timeout error', () =>
      new Promise<void>((done) => {
        const adapter = new MockAdapter();
        const bus = new Bus(adapter, 50);

        bus.request('some-event').catch((e: Error) => {
          expect(e.message).toBe(
            'Timeout error for request with name "some-event" and timeout 50!',
          );
          done();
        });
      }));

    it('response without request', () => {
      adapter.dispatchAdapterEvent({
        type: EventType.Response,
        id: 'some',
      } as any);
    });

    it('request', () =>
      new Promise<void>((done) => {
        const requestData = {
          count: 0,
          name: 'getRequestCount' as const,
          handler: (c: number) => {
            requestData.count++;
            return requestData.count + c;
          },
        };

        const secondAdapter = new MockAdapter();
        const secondBus = new Bus<
          Record<string, unknown>,
          { getRequestCount: (data: number) => number }
        >(secondAdapter);

        secondBus.registerRequestHandler(requestData.name, requestData.handler);

        adapter.onSend.once((data) => {
          secondAdapter.onSend.once((d) => adapter.dispatchAdapterEvent(d));
          secondAdapter.dispatchAdapterEvent(data);
        });

        bus.request(requestData.name, 10, 100).then((r) => {
          expect(r).toBe(11);
          done();
        });
      }));

    it('request async', () =>
      new Promise<void>((done) => {
        const requestData = {
          count: 0,
          name: 'getRequestCount' as const,
          handler: (c: number) => {
            requestData.count++;
            return Promise.resolve(requestData.count + c);
          },
        };

        const secondAdapter = new MockAdapter();
        const secondBus = new Bus<
          Record<string, unknown>,
          { getRequestCount: (data: number) => Promise<number> }
        >(secondAdapter);

        secondBus.registerRequestHandler(requestData.name, requestData.handler);

        adapter.onSend.once((data) => {
          secondAdapter.onSend.once((d) => adapter.dispatchAdapterEvent(d));
          secondAdapter.dispatchAdapterEvent(data);
        });

        bus.request(requestData.name, 10, 100).then((r) => {
          expect(r).toBe(11);

          secondBus.unregisterHandler(requestData.name);

          bus.request(requestData.name, 10, 100).catch(() => {
            done();
          });
        });
      }));

    it('has no handler for request', () =>
      new Promise<void>((done) => {
        const requestData = {
          name: 'getRequestCount',
          handler: () => null,
        };

        const secondAdapter = new MockAdapter();
        new Bus(secondAdapter);

        adapter.onSend.once((data) => {
          secondAdapter.onSend.once((d) => adapter.dispatchAdapterEvent(d));
          secondAdapter.dispatchAdapterEvent(data);
        });

        bus.request(requestData.name, null, 100).catch((e: Error) => {
          expect(String(e)).toBe('Error: Has no handler for "getRequestCount" action!');
          done();
        });
      }));

    it('handler with exception', () =>
      new Promise<void>((done) => {
        const requestData = {
          count: 0,
          name: 'getRequestCount',
          handler: () => {
            throw new Error('Test error!');
          },
        };

        const secondAdapter = new MockAdapter();
        const secondBus = new Bus(secondAdapter);

        secondBus.registerRequestHandler(requestData.name, requestData.handler);

        adapter.onSend.once((data) => {
          secondAdapter.onSend.once((d) => adapter.dispatchAdapterEvent(d));
          secondAdapter.dispatchAdapterEvent(data);
        });

        bus.request(requestData.name, 10, 100).catch((e: Error) => {
          console.log(e);
          expect(String(e)).toBe('Error: Test error!');
          done();
        });
      }));

    it('duplicate handler', () => {
      const f = () => null,
        name = 'test';

      bus.registerRequestHandler(name, f);
      expect(() => bus.registerRequestHandler(name, f)).toThrow('Duplicate request handler!');
    });
  });

  describe('_messageToData edge cases (defensive parsing)', () => {
    it('handler receives plain string when response content is a non-object', () =>
      new Promise<void>((done) => {
        const secondAdapter = new MockAdapter();
        const secondBus = new Bus(secondAdapter);

        secondBus.registerRequestHandler('echo', (d: unknown) => d);

        adapter.onSend.once((data) => {
          // Intercept the outgoing request and craft a malformed response
          secondAdapter.onSend.once(() => {
            // Send response with primitive content (not IInternalMessage)
            adapter.dispatchAdapterEvent({
              id: (data as any).id,
              type: EventType.Response,
              status: 0, // Success
              content: 'raw-string-content',
            } as any);
          });
          secondAdapter.dispatchAdapterEvent(data);
        });

        bus.request('echo', null, 500).then((result) => {
          // When content is not an object, _messageToData returns it as-is
          expect(result).toBe('raw-string-content');
          done();
        });
      }));

    it('handler receives original object when content has unrecognized type field', () =>
      new Promise<void>((done) => {
        adapter.onSend.once((data) => {
          // Send response with an object that has type/content but type is not 'error'/'data'
          adapter.dispatchAdapterEvent({
            id: (data as any).id,
            type: EventType.Response,
            status: 0, // Success
            content: { type: 'unknown-type', content: 42 },
          } as any);
        });

        bus.request('echo', null, 500).then((result) => {
          // When msg.type is not 'error' or 'data', returns the whole object
          expect(result).toEqual({ type: 'unknown-type', content: 42 });
          done();
        });
      }));

    it('response without active request is silently ignored', () => {
      // Dispatch a response for an ID that does not exist in _activeRequestHash
      adapter.dispatchAdapterEvent({
        type: EventType.Response,
        id: 'nonexistent-id',
        status: 0,
        content: { type: 'data', content: null },
      } as any);
      // No error thrown — the method just returns
    });
  });

  describe('error serialization', () => {
    it('preserves error name across bus boundary but strips remote stack', () =>
      new Promise<void>((done) => {
        const secondAdapter = new MockAdapter();
        const secondBus = new Bus(secondAdapter);

        secondBus.registerRequestHandler('fail', () => {
          const err = new TypeError('bad input');
          throw err;
        });

        adapter.onSend.once((data) => {
          // Verify the serialized error does NOT contain a stack trace
          secondAdapter.onSend.once((d) => {
            if (d.type === EventType.Response) {
              expect(d.content).not.toHaveProperty('stack');
            }
            adapter.dispatchAdapterEvent(d);
          });
          secondAdapter.dispatchAdapterEvent(data);
        });

        bus.request('fail', null, 500).catch((e: Error) => {
          expect(e.message).toBe('bad input');
          expect(e.name).toBe('TypeError');
          // The error has a local stack (from reconstruction), but it does NOT
          // contain the remote throwing side's stack (security hardening).
          expect(typeof e.stack).toBe('string');
          done();
        });
      }));
  });

  describe('destroy() cleans up pending requests', () => {
    it('rejects pending requests on destroy', () =>
      new Promise<void>((done) => {
        const adapter = new MockAdapter();
        let adapterDestroyed = false;
        adapter.destroy = () => {
          adapterDestroyed = true;
        };
        const bus = new Bus(adapter, 60_000);

        bus.request('long-running', null).catch((e: Error) => {
          expect(e.message).toBe('Bus destroyed');
          expect(adapterDestroyed).toBe(true);
          done();
        });

        // Destroy while the request is still pending
        bus.destroy();
      }));

    it('destroy with no pending requests does not throw', () => {
      const adapter = new MockAdapter();
      const bus = new Bus(adapter);
      expect(() => bus.destroy()).not.toThrow();
    });
  });
});
