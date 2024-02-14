import { emptyFunction, memoize } from '../utils';

export interface Logger extends Pick<typeof console, 'debug' | 'log' | 'warn' | 'error' | 'time' | 'timeEnd' | 'timeLog'> {
}

export type LazyLogger = {
  [P in keyof Logger]: Logger[P] | null;
};

export enum LogLevel {
  None = 0,

  Debug = 1,
  Information = 2,
  Warning = 3,
  Error = 4
}

const getEmptyLoggerFactory = <TNoneFunction extends typeof emptyFunction | null>(
  noneFunction: TNoneFunction
): TNoneFunction extends null ? LazyLogger : Logger => ({
  debug: noneFunction,
  log: noneFunction,
  warn: noneFunction,
  error: noneFunction,
  time: noneFunction,
  timeEnd: noneFunction,
  timeLog: noneFunction
}) as TNoneFunction extends null ? LazyLogger : Logger;
const emptyLogger = getEmptyLoggerFactory(emptyFunction);
const emptyLazyLogger = getEmptyLoggerFactory(null);

const getDebugLevelLogger = memoize(
  (loggerInternal: Logger) => ({
    debug: loggerInternal.debug,
    log: loggerInternal.log,
    warn: loggerInternal.warn,
    error: loggerInternal.error,
    time: loggerInternal.time,
    timeEnd: loggerInternal.timeEnd,
    timeLog: loggerInternal.timeLog
  })
);
const getDebugLevelLazyLogger = getDebugLevelLogger;

const getLogLevelLoggerFactory = <TNoneFunction extends typeof emptyFunction | null>(
  noneFunction: TNoneFunction
): (loggerInternal: Logger) => TNoneFunction extends null ? LazyLogger : Logger => memoize(
  (loggerInternal: Logger) => ({
    debug: noneFunction,
    log: loggerInternal.log,
    warn: loggerInternal.warn,
    error: loggerInternal.error,
    time: loggerInternal.time,
    timeEnd: loggerInternal.timeEnd,
    timeLog: loggerInternal.timeLog
  }) as TNoneFunction extends null ? LazyLogger : Logger
);
const getLogLevelLogger = getLogLevelLoggerFactory(emptyFunction);
const getLogLevelLazyLogger = getLogLevelLoggerFactory(null);

const getWarnLevelLoggerFactory = <TNoneFunction extends typeof emptyFunction | null>(
  noneFunction: TNoneFunction
): (loggerInternal: Logger) => TNoneFunction extends null ? LazyLogger : Logger => memoize(
  (loggerInternal: Logger) => ({
    debug: noneFunction,
    log: noneFunction,
    warn: loggerInternal.warn,
    error: loggerInternal.error,
    time: noneFunction,
    timeEnd: noneFunction,
    timeLog: noneFunction
  }) as TNoneFunction extends null ? LazyLogger : Logger
);
const getWarnLevelLogger = getWarnLevelLoggerFactory(emptyFunction);
const getWarnLevelLazyLogger = getWarnLevelLoggerFactory(null);

const getErrorLevelLoggerFactory = <TNoneFunction extends typeof emptyFunction | null>(
  noneFunction: TNoneFunction
): (loggerInternal: Logger) => TNoneFunction extends null ? LazyLogger : Logger => memoize(
  (loggerInternal: Logger) => ({
    debug: noneFunction,
    log: noneFunction,
    warn: noneFunction,
    error: loggerInternal.error,
    time: noneFunction,
    timeEnd: noneFunction,
    timeLog: noneFunction
  }) as TNoneFunction extends null ? LazyLogger : Logger
);
const getErrorLevelLogger = getErrorLevelLoggerFactory(emptyFunction);
const getErrorLevelLazyLogger = getErrorLevelLoggerFactory(null);

class LoggerProvider {
  private internalLogger: Logger;
  private _logLevel: LogLevel = LogLevel.Information;

  private _logger: Logger = emptyLogger;
  private _lazyLogger: LazyLogger = emptyLazyLogger;

  constructor(internalLogger: Logger, logLevel: LogLevel) {
    this.internalLogger = internalLogger;
    this._logLevel = logLevel;

    this.updateLogger();
  }

  get logger() {
    return this._logger;
  }

  get lazyLogger() {
    return this._lazyLogger;
  }

  get logLevel() {
    return this._logLevel;
  }

  setLogger(internalLogger: Logger) {
    this.internalLogger = internalLogger;
    this.updateLogger();
  }

  setLogLevel(logLevel: LogLevel) {
    this._logLevel = logLevel;
    this.updateLogger();
  }

  private updateLogger() {
    switch (this._logLevel) {
      case LogLevel.None:
        this._logger = emptyLogger;
        this._lazyLogger = emptyLazyLogger;
        break;
      case LogLevel.Debug:
        this._logger = getDebugLevelLogger(this.internalLogger);
        this._lazyLogger = getDebugLevelLazyLogger(this.internalLogger);
        break;
      case LogLevel.Information:
        this._logger = getLogLevelLogger(this.internalLogger);
        this._lazyLogger = getLogLevelLazyLogger(this.internalLogger);
        break;
      case LogLevel.Warning:
        this._logger = getWarnLevelLogger(this.internalLogger);
        this._lazyLogger = getWarnLevelLazyLogger(this.internalLogger);
        break;
      case LogLevel.Error:
        this._logger = getErrorLevelLogger(this.internalLogger);
        this._lazyLogger = getErrorLevelLazyLogger(this.internalLogger);
        break;
    }
  }
}

export const loggerProvider = new LoggerProvider(console, LogLevel.None);
