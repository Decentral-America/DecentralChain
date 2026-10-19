// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { classifyServerError, describeRequest } from './server-error';

const routeError = (status: number) => ({ data: 'x', internal: true, status, statusText: 'x' });

describe('classifyServerError', () => {
  it('logs unmatched routes and wrong methods at info, not as error stacks', () => {
    expect(classifyServerError(routeError(404), false)).toBe('info');
    expect(classifyServerError(routeError(405), false)).toBe('info');
  });

  it('keeps real failures as errors', () => {
    expect(classifyServerError(new Error('boom'), false)).toBe('error');
    expect(classifyServerError(routeError(500), false)).toBe('error');
  });

  it('ignores aborted requests', () => {
    expect(classifyServerError(new Error('aborted'), true)).toBe('ignore');
  });
});

describe('describeRequest', () => {
  it('summarises method, path and status on one line', () => {
    const request = new Request('https://scanner.test/.env?x=1');
    expect(describeRequest(routeError(404), request)).toBe('GET /.env -> 404');
  });
});
