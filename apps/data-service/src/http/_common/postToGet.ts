import { stringify } from 'qs';
import { type AppContext } from './types';

type HonoHandler = (c: AppContext) => Promise<Response>;

export const postToGet =
  (routeHandler: HonoHandler): HonoHandler =>
  async (c: AppContext): Promise<Response> => {
    let body: Record<string, unknown> = {};
    try {
      body = await c.req.json<Record<string, unknown>>();
    } catch {
      // ignore parse errors — empty body is valid
    }
    // serialise body as query string and stash for createHttpHandler to pick up
    c.set('postBodyQuery', stringify(body, { indices: false }));
    return routeHandler(c);
  };
