import { type IncomingHttpHeaders, type Server } from 'node:http';
import { request } from '../utils/request';
import { delay } from '../utils/utils';
import { type ConnectProvider } from './ConnectProvider';

interface HttpConnectProviderOptions {
  port: number;
  url: string;
  ttl?: number;
}

interface SendOptions {
  timeout?: number;
  attempts?: number;
}

type SimpleConnectCallback = (
  data: unknown,
  url: URL,
  headers: IncomingHttpHeaders,
) => Promise<unknown>;

export class HttpConnectProvider implements ConnectProvider {
  private active = true;
  private server: Server;

  constructor(private options: HttpConnectProviderOptions) {}

  public async send<T>(data: string, options: SendOptions = {}): Promise<T> {
    this.checkActive();

    const { timeout = 1000, attempts = 1 } = options;

    for (let i = attempts; i > 0; i--) {
      try {
        const res = await request<T>({
          fetchOptions: {
            body: data,
            method: 'POST',
          },
          url: this.options.url,
        });

        return res;
      } catch {
        await delay(timeout);
      }
    }

    throw new Error('Could not connect');
  }

  public async listen(cb: SimpleConnectCallback): Promise<void> {
    this.checkActive();
    this.server = (
      window as unknown as {
        SimpleConnect: { listen: (port: number, cb: SimpleConnectCallback) => Server };
      }
    ).SimpleConnect.listen(this.options.port, cb);

    if (this.options.ttl) {
      await delay(this.options.ttl);
      this.server.close();
    }
  }

  public destroy(): void {
    this.active = false;

    if (this.server) {
      this.server.close();
    }
  }

  private checkActive(): void {
    if (!this.active) {
      throw new Error('Provider was destroyed');
    }
  }
}
