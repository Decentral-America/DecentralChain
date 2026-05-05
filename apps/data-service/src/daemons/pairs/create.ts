import getErrorMessage from '../../errorHandling/getErrorMessage';

import logTaskProgress from '../utils/logTaskProgress';
import * as sql from './sql';

/** loop :: Object -> Task a b */
const loop = ({
  logTask,
  pg,
  pairsTableName,
}: {
  logTask: any;
  pg: any;
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
    pg.tx((t: any) =>
      t.batch([t.none(sql.truncateTable(pairsTableName)), t.none(sql.fillTable(pairsTableName))]),
    ),
  );
};

export default ({
  logger,
  pg,
  pairsTableName,
}: {
  logger: any;
  pg: any;
  pairsTableName: string;
}) => {
  const unsafeLogTaskProgress = logTaskProgress(logger);

  return {
    loop: () => loop({ logTask: unsafeLogTaskProgress, pairsTableName, pg }),
  };
};
