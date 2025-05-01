import winston, { createLogger, format, transports } from 'winston';
import Utils from './utils';
import { is } from '@electron-toolkit/utils';
import { join } from 'path';
import { PATH_LOG } from './constants';

export default class Logger {
  public static instance: Logger | undefined;
  private winston: winston.Logger;

  constructor() {
    Logger.instance = this;
    this.winston = createLogger({
      level: is.dev ? 'debug' : 'info',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.printf(({ level, message, timestamp, module }): string => {
          return `[${timestamp}][${level}][${module || 'Unknown'}] ${message}`;
        })
      ),
      transports: !is.dev
        ? [
            new transports.File({
              filename: join(PATH_LOG, `log-${Utils.getShortTimeString()}.log`),
            }),
          ]
        : [
            new transports.File({
              filename: join(PATH_LOG, `log-${Utils.getShortTimeString()}.log`),
            }),
            new transports.Console(),
          ],
    });
  }

  static getInstance(): Logger {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }

  public info(msg: string, module: string) {
    this.winston.info(msg, {
      module,
    });
  }

  public warn(msg: string, module: string) {
    this.winston.warn(msg, {
      module,
    });
  }

  public error(msg: string, module: string) {
    this.winston.error(msg, {
      module,
    });
  }

  public debug(msg: string, module: string) {
    this.winston.debug(msg, {
      module,
    });
  }
}
