// @ts-nocheck
import { createPgDriver } from '../../../../db';
import { loadConfig } from '../../../../loadConfig';
import create from '../../index';

const options = loadConfig();

const ADDRESS = '3NAkqT9JJHLF7hZyiZ5SncWsW8SQh2duZek';

describe('Aliases', () => {
  const service = create({
    drivers: { pg: createPgDriver(options) },
    emitEvent: () => () => null,
  });

  describe('request by alias', () => {
    it('should return Alias for one correctly', (done) => {
      service
        .get('test-alias')
        .run()
        .listen({
          onRejected: done.fail,
          onResolved: (alias) => {
            expect(alias.unsafeGet()).toMatchSnapshot();
            done();
          },
        });
    });

    it('should return null for non existing alias', (done) => {
      service
        .get('NON_EXISTING_ALIAS')
        .run()
        .listen({
          onRejected: done.fail,
          onResolved: (nullable) => {
            expect(nullable).toBeNothing();
            done();
          },
        });
    });
  });

  describe('request by address', () => {
    it('should return List(Alias) if requested without showBroken', (done) => {
      service
        .search({ address: ADDRESS })
        .run()
        .listen({
          onRejected: done.fail,
          onResolved: (mxs) => {
            expect(mxs).toMatchSnapshot();
            done();
          },
        });
    });

    it('should return List(Alias) if requested with showBroken', (done) => {
      service
        .search({
          address: ADDRESS,
          showBroken: true,
        })
        .run()
        .listen({
          onRejected: done.fail,
          onResolved: (mxs) => {
            expect(mxs).toMatchSnapshot();
            done();
          },
        });
    });
  });
});
