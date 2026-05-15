import { Signal } from 'ts-utils';
import { type IWindow } from '../../src/protocols/WindowProtocol.js';

class Win {
  public onPostMessageRun: Signal<any> = new Signal();
  private _handlers: Record<string, ((...args: any[]) => void)[]> = Object.create(null);

  public postMessage(data: any, origin: string): void {
    this.onPostMessageRun.dispatch({ data, origin });
  }

  public removeEventListener(event: string, handler: any): void {
    if (!this._handlers[event]) {
      return void 0;
    }
    this._handlers[event] = this._handlers[event].filter((cb) => cb !== handler);
  }

  public addEventListener(event: string, handler: (...args: any[]) => void): void {
    if (!this._handlers[event]) {
      this._handlers[event] = [];
    }
    this._handlers[event].push(handler);
  }

  public runEventListeners(event: string, eventData: any): void {
    if (!this._handlers[event]) {
      return void 0;
    }

    this._handlers[event].forEach((cb) => {
      cb(eventData);
    });
  }
}

export function mockWindow<T>(): IMockWindow<T> {
  return new Win() as any;
}

export interface IMockWindow<T> extends IWindow {
  onPostMessageRun: Signal<IPostMessageEvent<T>>;
  runEventListeners(event: string, eventData: any): void;
}

export interface IPostMessageEvent<T> {
  data: T;
  origin: string;
}
