import { createPgDriver } from '../../../../db';
import { loadConfig } from '../../../../loadConfig';
const options = loadConfig();
import create from '../..';

const ADDRESS = '3PDSJEfqQQ8BNk7QtiwAFPq7SgyAh5kzfBy';

describe('Aliases', () => {
  const service = create({
    drivers: { pg: createPgDriver(options) },
    emitEvent: () => () => null,
  });

  describe('request by alias', () => {
    it('should return Maybe(alias) for one correctly', (done) => {
      service
        .get('sexy-boys')
        .run()
        .listen({
          onRejected: done.fail,
          onResolved: (maybeX) => {
            expect(maybeX.unsafeGet()).toMatchSnapshot();
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
          onResolved: (maybeX) => {
            expect(maybeX).toBeNothing();
            done();
          },
        });
    });
  });

  describe('request by address', () => {
    it('should return correct data if requested without showBroken', (done) => {
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

    it('should return correct data if requested with showBroken', (done) => {
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
