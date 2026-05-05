import { daemon } from '../daemon';
import Task from 'folktale/concurrency/task';

const createLogger = () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
};

describe('Preset for create daemon', () => {
  describe('Should started without any or all function', () => {
    it.skip('should throw exception if no loop', (done) => {
      const logger = createLogger();
      const init = jest.fn(() => Task.of());

      daemon({ init }, { test: 1 }, 1000, 2000, logger)
        .promise()
        .catch((e) => {
          expect(e.toString()).toEqual('[DAEMON] loop function not found');
          expect(logger.error.mock.calls[0][0]).toMatchObject({
            error: '[DAEMON] loop function not found',
            message: '[DAEMON] loop error',
          });
          done();
        });
    });

    it('should warn if no init', (done) => {
      const logger = createLogger();
      const loop = jest.fn(() => Task.of());

      const d = daemon({ loop }, { conf: 'qwerty' }, 1000, 2000, logger).listen({
        onCancelled: () => {
          expect(logger.warn).toBeCalledWith({
            message: '[DAEMON] init function not found',
          });
          expect(logger.error).toBeCalledWith({
            message: `[DAEMON] loop canceled`,
          });
          expect(loop).toBeCalledWith({ conf: 'qwerty' });
          done();
        },
      });

      setTimeout(() => d.cancel(), 20);
    });

    it.skip('should stop if no init and no loop', (done) => {
      const logger = createLogger();

      daemon({}, {}, 1000, 2000, logger)
        .promise()
        .catch((e) => {
          expect(e.toString()).toEqual('[DAEMON] loop function not found');
          expect(logger.warn).toBeCalledWith({
            message: '[DAEMON] init function not found',
          });
          expect(logger.warn).toBeCalledWith({
            message: '[DAEMON] loop function not found',
          });
          done();
        });
    });
  });

  describe('Should throw exception when timeout expired, run loop with interval', () => {
    it('should work with planing next run as interval-(run time loop iteration)', (done) => {
      const loop = jest.fn(() => Task.of());
      const logger = createLogger();

      const d = daemon({ loop }, {}, 50, 100, logger).listen({
        onCancelled: () => {
          expect(logger.warn).toBeCalledWith({
            message: '[DAEMON] init function not found',
          });
          expect(logger.error).toBeCalledWith({
            message: `[DAEMON] loop canceled`,
          });
          expect(loop).toHaveBeenCalledTimes(3);
          done();
        },
      });

      setTimeout(() => d.cancel(), 140);
    });

    it('should rerun immedently if interval < loop', (done) => {
      const loop = jest.fn(() => Task.task((resolver) => setTimeout(() => resolver.resolve(), 50)));
      const logger = createLogger();

      const d = daemon({ loop }, {}, 10, 100, logger).listen({
        onCancelled: () => {
          expect(logger.warn).toBeCalledWith({
            message: '[DAEMON] init function not found',
          });
          expect(logger.error).toBeCalledWith({
            message: `[DAEMON] loop canceled`,
          });
          expect(loop).toHaveBeenCalledTimes(3);
          done();
        },
      });

      setTimeout(() => d.cancel(), 140);
    });

    it.skip('should throw exception when timeout expired', (done) => {
      const loop = jest.fn(() => Task.task((resolver) => setTimeout(resolver.resolve, 10000)));
      const logger = createLogger();

      daemon({ loop }, {}, 1, 1, logger)
        .promise()
        .catch((e) => {
          expect(e.toString()).toEqual('Error: Daemon timeout expired');
          expect(loop).toHaveBeenCalledTimes(1);
          done();
        });
    });
  });
});
