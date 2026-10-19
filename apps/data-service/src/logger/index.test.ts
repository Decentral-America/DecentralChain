import { describe, expect, it } from 'vitest';
import { AppError } from '../errorHandling';
import { createEvent, describeFailure } from './index';

describe('createEvent(ERROR)', () => {
  it('does not throw for a failure without an inner error (Effect NoSuchElementException)', () => {
    const ev = createEvent({
      data: { _tag: 'NoSuchElementException' },
      message: 'ERROR',
      request: {},
    });
    expect(ev.level).toBe('error');
    expect(JSON.stringify(ev.obj)).toContain('NoSuchElementException');
  });

  it('logs client errors (parse / validation) at warn', () => {
    expect(
      createEvent({ data: AppError.Parse('Max limit 100 exceeded'), message: 'ERROR', request: {} })
        .level,
    ).toBe('warn');
    expect(
      createEvent({ data: AppError.Validation('bad input'), message: 'ERROR', request: {} }).level,
    ).toBe('warn');
  });

  it('logs server errors at error and keeps the message', () => {
    const ev = createEvent({
      data: AppError.Db('connection refused'),
      message: 'ERROR',
      request: {},
    });
    expect(ev.level).toBe('error');
    expect(JSON.stringify(ev.obj)).toContain('connection refused');
  });
});

describe('describeFailure', () => {
  it('handles raw Errors, strings and null', () => {
    expect(describeFailure(new Error('boom')).message).toBe('boom');
    expect(describeFailure('plain').message).toBe('plain');
    expect(describeFailure(null).type).toBe('Unknown');
  });
});
