import type postgres from 'postgres';
import { type PgDriver } from '../../db/driver';
import getErrorMessage from '../../errorHandling/getErrorMessage';

import logTaskProgress from '../utils/logTaskProgress';
import * as sql from './sql';

type Logger = { info: (msg: unknown) => void; error: (msg: unknown) => void };

/** loop :: Object -> Task a b */
const loop = ({
  logTask,
  pg,
  pairsTableName,
}: {
  logTask: ReturnType<typeof logTaskProgress>;
  pg: PgDriver;
  pairsTableName: string;
}) => {
  const logMessages = {
    error: (e: unknown, timeTaken: number) => ({
      error: getErrorMessage(e as Error),
      message: '[PAIRS] update error',
      time: timeTaken,
    }),
    start: (timeStart: Date) => ({
      message: '[PAIRS] update started',
      time: timeStart,
    }),
    success: (_: unknown, timeTaken: number) => ({
      message: '[PAIRS] update success',
      time: timeTaken,
    }),
  };

  return logTask(
    logMessages,
    pg.tx(async (t: postgres.TransactionSql) => {
      await t.unsafe(sql.truncateTable(pairsTableName));
      await t.unsafe(sql.fillTable(pairsTableName));
    }),
  );
};

export default ({
  logger,
  pg,
  pairsTableName,
}: {
  logger: Logger;
  pg: PgDriver;
  pairsTableName: string;
}) => {
  const unsafeLogTaskProgress = logTaskProgress(logger);

  return {
    loop: () => loop({ logTask: unsafeLogTaskProgress, pairsTableName, pg }),
  };
};
