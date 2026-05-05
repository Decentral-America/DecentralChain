import getErrorMessage from '../../errorHandling/getErrorMessage';

import logTaskProgress from '../utils/logTaskProgress';
import sql from './sql';

/** loop :: Object -> Task a b */
const loop = ({ logTask, pg, pairsTableName }) => {
  const logMessages = {
    error: (e, timeTaken) => ({
      error: getErrorMessage(e),
      message: '[PAIRS] update error',
      time: timeTaken,
    }),
    start: (timeStart) => ({
      message: '[PAIRS] update started',
      time: timeStart,
    }),
    success: (_, timeTaken) => ({
      message: '[PAIRS] update success',
      time: timeTaken,
    }),
  };

  return logTask(
    logMessages,
    pg.tx((t) =>
      t.batch([t.none(sql.truncateTable(pairsTableName)), t.none(sql.fillTable(pairsTableName))]),
    ),
  );
};

export default ({ logger, pg, pairsTableName }) => {
  const unsafeLogTaskProgress = logTaskProgress(logger);

  return {
    loop: () => loop({ logTask: unsafeLogTaskProgress, pairsTableName, pg }),
  };
};
