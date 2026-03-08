import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { EventType, type IEventData, type TMessageContent, WindowAdapter } from '../src/index.js';
import { PROTOCOL_TYPES, WindowProtocol } from '../src/protocols/WindowProtocol.js';
import { EventEmitter } from '../src/utils/EventEmitter.js';
import { type IMockWindow, mockWindow } from './mock/Win.js';

describe('Window adapter', () => {
  const eventData: IEventData = {
    type: EventType.Event,
    name: 'test',
    data: 'some data for event',
    channelId: undefined,
  };

  let listen: Array<WindowProtocol<TMessageContent>>;
  let dispatch: Array<WindowProtocol<TMessageContent>>;
  let adapter: WindowAdapter;
  let listenWin: IMockWindow<TMessageContent> = mockWindow();
  let dispatchWin: IMockWindow<TMessageContent> = mockWindow();

  beforeEach(() => {
    listenWin = mockWindow();
    dispatchWin = mockWindow();
    listen = [new WindowProtocol(listenWin, PROTOCOL_TYPES.LISTEN)];
    dispatch = [new WindowProtocol(dispatchWin, PROTOCOL_TYPES.DISPATCH)];
    adapter = new WindowAdapter(listen, dispatch, {});
  });

  describe('check connect by channel id', () => {
    it('with same chain id', () => {
      let ok = false;

      adapter = new WindowAdapter(listen, dispatch, {
        channelId: 1,
        origins: ['*'],
        availableChannelId: [2],
      });

      adapter.addListener((event) => {
        ok = event.type === EventType.Event && event.data === 1 && event.name === 'test';
      });

      listenWin.runEventListeners('message', {
        origin: 'https://some-origin.com',
        data: {
          type: EventType.Event,
          data: 1,
          name: 'test',
        },
      });

      expect(ok).toBe(false);

      listenWin.runEventListeners('message', {
        origin: 'https://some-origin.com',
        data: {
          type: EventType.Event,
          data: 1,
          name: 'test',
          channelId: 2,
        },
      });

      expect(ok).toBe(true);
    });
  });

  it('all origin', () => {
    listenWin = mockWindow();
    listen = [new WindowProtocol(listenWin, PROTOCOL_TYPES.LISTEN)];
    dispatch = [new WindowProtocol(mockWindow(), PROTOCOL_TYPES.DISPATCH)];
    adapter = new WindowAdapter(listen, dispatch, { origins: '*' });

    let count = 0;

    adapter.addListener(() => {
      count++;
    });

    listenWin.runEventListeners('message', {
      origin: 'https://dispatch-origin.com',
      data: { ...eventData },
    });

    expect(count).toBe(1);
  });

  it('Exception in handler', () => {
    let ok = false;

    adapter.addListener(() => {
      throw new Error('Some error');
    });
    adapter.addListener(() => {
      ok = true;
    });

    listenWin.runEventListeners('message', {
      origin: window.location.origin,
      data: { ...eventData },
    });
    expect(ok).toBe(true);
  });

  it('Wrong event format', () => {
    let ok = true;
    adapter.addListener(() => {
      ok = false;
    });

    listenWin.runEventListeners('message', {
      origin: window.location.origin,
      data: null,
    });
    listenWin.runEventListeners('message', {
      origin: window.location.origin,
      data: {},
    });
    expect(ok).toBe(true);
  });

  it('send', () => {
    let wasEvent = false;

    dispatchWin.onPostMessageRun.once((message: any) => {
      wasEvent = true;
      expect(message.data).toEqual(eventData);
    });
    const sendResult = adapter.send(eventData);

    expect(sendResult).toBe(adapter);
    expect(wasEvent).toBe(true);
  });

  it('listen with origin', () => {
    let count = 0;
    const data = [
      { ...eventData, data: 'test 1' },
      { ...eventData, data: 'test 2' },
    ];

    const addListenerResult = adapter.addListener((eventData: any) => {
      if (eventData !== data[count]) {
        throw new Error('Wrong data in event!');
      }
      count++;
    });

    listenWin.runEventListeners('message', {
      origin: window.location.origin,
      data: data[0],
    });

    listenWin.runEventListeners('message', {
      origin: window.location.origin,
      data: data[1],
    });

    listenWin.runEventListeners('message', {
      origin: 'some-origin',
      data: eventData,
    });

    expect(addListenerResult).toBe(adapter);
    expect(count).toBe(2);
  });

  it('destroy', () => {
    let wasPostMessage = false;
    let wasListenEvent = false;

    dispatchWin.onPostMessageRun.once(() => {
      wasPostMessage = true;
    });

    adapter.addListener(() => {
      wasListenEvent = true;
    });

    const destroyResult = adapter.destroy();
    adapter.destroy();

    adapter.send(eventData);
    listenWin.runEventListeners('message', {
      origin: 'listen.origin',
      data: 'some data',
    });

    expect(destroyResult).toBe(undefined);
    expect(wasPostMessage).toBe(false);
    expect(wasListenEvent).toBe(false);
  });

  describe('SimpleWindowAdapter', () => {
    const addEventListener = window.addEventListener;
    const removeEventListener = window.removeEventListener;
    const postMessage = window.postMessage;
    const emitter = new EventEmitter<any>();

    beforeEach(() => {
      (window as any).origin = window.location.origin;
      emitter.off();
      window.addEventListener = (event: string, handler: any) => {
        emitter.on(event, handler);
      };
      window.removeEventListener = (event: string, handler: any) => {
        emitter.off(event, handler);
      };
      window.postMessage = ((data: any, origin: any) => {
        emitter.trigger('message', { data, origin });
      }) as any;
    });

    afterAll(() => {
      window.addEventListener = addEventListener;
      window.removeEventListener = removeEventListener;
      window.postMessage = postMessage;
    });

    it('Create', () =>
      new Promise<void>((done) => {
        WindowAdapter.createSimpleWindowAdapter().then(() => {
          done();
        });
      }));

    it('Add Listener', () =>
      new Promise<void>((done) => {
        WindowAdapter.createSimpleWindowAdapter().then((adapter) => {
          let ok = false;

          adapter.addListener(() => {
            ok = true;
          });

          window.postMessage({ type: EventType.Event, name: 'test' }, window.origin);
          expect(ok).toBe(true);
          done();
        });
      }));

    it('Destroy', () =>
      new Promise<void>((done) => {
        const win = mockWindow();
        (window as any).opener = win;

        WindowAdapter.createSimpleWindowAdapter().then((adapter) => {
          let listenerCount = 0;
          let sendCount = 0;

          win.onPostMessageRun.on(() => {
            sendCount++;
          });

          adapter.addListener(() => {
            listenerCount++;
          });

          window.postMessage({ type: EventType.Event, name: 'test' }, window.origin);
          adapter.send({ type: EventType.Event, data: '', name: 'test' });
          adapter.destroy();
          adapter.send({ type: EventType.Event, data: '', name: 'test' });
          window.postMessage({ type: EventType.Event, name: 'test' }, window.origin);

          expect(listenerCount).toBe(1);
          expect(sendCount).toBe(1);
          done();
        });
      }));
  });

  describe('WindowProtocol dispatch-type destroy', () => {
    it('destroy on dispatch protocol replaces win with fakeWin', () => {
      const win = mockWindow<TMessageContent>();
      const protocol = new WindowProtocol<TMessageContent>(win, PROTOCOL_TYPES.DISPATCH);

      let callCount = 0;
      win.onPostMessageRun.on(() => {
        callCount++;
      });

      protocol.dispatch({ type: EventType.Event, name: 'pre', data: null });
      expect(callCount).toBe(1);

      protocol.destroy();

      // After destroy, dispatch goes to fakeWin (no-op), original window not called
      protocol.dispatch({ type: EventType.Event, name: 'post', data: null });
      expect(callCount).toBe(1);
    });
  });

  describe('accessEvent edge cases', () => {
    it('blocks events with null data', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: null,
      });
      expect(count).toBe(0);
    });

    it('blocks events with missing type field', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { name: 'test' },
      });
      expect(count).toBe(0);
    });

    it('blocks events with non-matching origin when origins are restricted', () => {
      const restrictedAdapter = new WindowAdapter(listen, dispatch, {
        origins: ['https://trusted.com'],
      });
      let count = 0;
      restrictedAdapter.addListener(() => {
        count++;
      });

      listenWin.runEventListeners('message', {
        origin: 'https://malicious.com',
        data: { ...eventData },
      });
      expect(count).toBe(0);
    });

    it('allows events with matching channel id', () => {
      const channelAdapter = new WindowAdapter(listen, dispatch, {
        channelId: 'a',
        origins: ['*'],
        availableChannelId: ['b'],
      });
      let count = 0;
      channelAdapter.addListener(() => {
        count++;
      });

      // Wrong channel id — blocked
      listenWin.runEventListeners('message', {
        origin: 'https://any.com',
        data: { ...eventData, channelId: 'c' },
      });
      expect(count).toBe(0);

      // Correct channel id — allowed
      listenWin.runEventListeners('message', {
        origin: 'https://any.com',
        data: { ...eventData, channelId: 'b' },
      });
      expect(count).toBe(1);
    });
  });

  describe('message schema validation', () => {
    it('blocks events with invalid type value (out of range)', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { type: 99, name: 'test' },
      });
      expect(count).toBe(0);
    });

    it('blocks events with non-numeric type', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { type: 'Event', name: 'test' },
      });
      expect(count).toBe(0);
    });

    it('blocks Event messages without name field', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { type: 0 },
      });
      expect(count).toBe(0);
    });

    it('blocks Action messages without id field', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { type: 1, name: 'test' },
      });
      expect(count).toBe(0);
    });

    it('blocks Response messages without status field', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { type: 2, id: 'x' },
      });
      expect(count).toBe(0);
    });

    it('blocks Response messages with invalid status value', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { type: 2, id: 'x', status: 5 },
      });
      expect(count).toBe(0);
    });

    it('allows valid Event messages', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { type: 0, name: 'test', data: 'hello' },
      });
      expect(count).toBe(1);
    });

    it('allows valid Action messages', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { type: 1, id: 'req-1', name: 'doSomething' },
      });
      expect(count).toBe(1);
    });

    it('allows valid Response messages', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { type: 2, id: 'req-1', status: 0, content: 'ok' },
      });
      expect(count).toBe(1);
    });

    it('blocks negative type values', () => {
      let count = 0;
      adapter.addListener(() => {
        count++;
      });
      listenWin.runEventListeners('message', {
        origin: window.location.origin,
        data: { type: -1, name: 'test' },
      });
      expect(count).toBe(0);
    });
  });

  describe('createSimpleWindowAdapter with mock window content', () => {
    const addEventListener = window.addEventListener;
    const removeEventListener = window.removeEventListener;
    const postMessage = window.postMessage;
    const emitter = new EventEmitter<any>();

    beforeEach(() => {
      (window as any).origin = window.location.origin;
      emitter.off();
      window.addEventListener = (event: string, handler: any) => {
        emitter.on(event, handler);
      };
      window.removeEventListener = (event: string, handler: any) => {
        emitter.off(event, handler);
      };
      window.postMessage = ((data: any, origin: any) => {
        emitter.trigger('message', { data, origin });
      }) as any;
    });

    afterAll(() => {
      window.addEventListener = addEventListener;
      window.removeEventListener = removeEventListener;
      window.postMessage = postMessage;
    });

    it('creates adapter with a mock window (non-iframe) content', () =>
      new Promise<void>((done) => {
        const targetWin = mockWindow<TMessageContent>();

        WindowAdapter.createSimpleWindowAdapter(targetWin as any).then((adapter) => {
          let callCount = 0;
          targetWin.onPostMessageRun.on(() => {
            callCount++;
          });

          adapter.send({ type: EventType.Event, data: 'hello', name: 'ping' });
          expect(callCount).toBe(1);

          adapter.destroy();
          done();
        });
      }));
  });
});
