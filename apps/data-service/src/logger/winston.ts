import winston from 'winston';
import { stringify } from './utils';

const {
  format: { combine, timestamp, printf },
} = winston;

const myFormat = printf(stringify);
const JSONFormat = combine(timestamp(), myFormat);

const consoleTransport = new winston.transports.Console({
  format: JSONFormat,
});

// Initialization
const createLogger = (options: any) =>
  winston.createLogger({
    level: options.logLevel,
    transports: [consoleTransport],
  });

export default createLogger;
