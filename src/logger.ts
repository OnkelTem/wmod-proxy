import winston, { format, Logger as BaseLogger } from 'winston';

type Logger = {
  err: (message: string) => void;
  info: (message: string) => void;
  dbg: (message: string) => void;
  logger: BaseLogger;
};
let logger: Logger;

const loggerLevelsInfo = {
  levels: {
    err: 0,
    info: 1,
    dbg: 2,
  },
  colors: {
    err: 'brightRed',
    info: 'brightBlue',
    dbg: 'gray',
  },
};
type LoggerLevelsInfo = typeof loggerLevelsInfo;
type LoggerLevels = keyof LoggerLevelsInfo['levels'];

const colorizer = winston.format.colorize();

export function initLogger(level: LoggerLevels) {
  if (logger != null) {
    throw new Error('Logger has been already initialized');
  }

  const baseLogger = winston.createLogger({
    levels: loggerLevelsInfo.levels,
    level,
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS' }),
      format.align(),
      format.printf((info) => {
        return colorizer.colorize(info.level, `${info.timestamp} ${info.level}: ${info.message}`);
      }),
    ),
    transports: [new winston.transports.Console()],
  });
  winston.addColors(loggerLevelsInfo.colors);
  logger = {
    err(message: string) {
      baseLogger.log('err', message);
    },
    info(message: string) {
      baseLogger.log('info', message);
    },
    dbg(message: string) {
      baseLogger.log('dbg', message);
    },
    logger: baseLogger,
  };
}

export function getLogger() {
  if (logger == null) {
    throw new Error('Attempt to use not initialized Logger');
  }
  return logger;
}
