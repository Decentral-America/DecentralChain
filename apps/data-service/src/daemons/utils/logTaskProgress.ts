import { Effect, pipe } from 'effect';

type Logger = {
  info: (msg: unknown) => void;
  error: (msg: unknown) => void;
};

type Messages<E, A> = {
  start: (t: Date) => unknown;
  success: (result: A, elapsed: number) => unknown;
  error: (err: E, elapsed: number) => unknown;
};

/** Wraps an Effect with start/success/error log messages. */
const logTaskProgress =
  (logger: Logger) =>
  <E, A>(messages: Messages<E, A>, eff: Effect.Effect<A, E>): Effect.Effect<void, E> =>
    pipe(
      Effect.sync(() => {
        const timeStart = new Date();
        logger.info(messages.start(timeStart));
        return timeStart;
      }),
      Effect.flatMap((timeStart) =>
        pipe(
          eff,
          Effect.mapBoth({
            onFailure: (l) => {
              logger.error(messages.error(l, Date.now() - +timeStart));
              return l;
            },
            onSuccess: (r) => {
              logger.info(messages.success(r, Date.now() - +timeStart));
            },
          }),
        ),
      ),
    );

export default logTaskProgress;
