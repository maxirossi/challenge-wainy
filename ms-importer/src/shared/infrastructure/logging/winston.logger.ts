import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import type { ILogger } from './logger.interface';

export class WinstonLogger implements ILogger {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = this.createLogger();
  }

  private createConsoleTransport(): winston.transport {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return new winston.transports.Console({
      level: isDevelopment ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : '';
          return `${String(timestamp)} [${String(level)}]: ${String(message)} ${String(metaString)}`;
        }),
      ),
    });
  }

  private createFileTransports(): winston.transport[] {
    return [
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info',
      }),
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
      }),
    ];
  }

  private createLogger(): winston.Logger {
    const isDevelopment = process.env.NODE_ENV === 'development';

    const transports: winston.transport[] = [this.createConsoleTransport()];

    // File transports para producción
    if (!isDevelopment) {
      transports.push(...this.createFileTransports());
    }

    return winston.createLogger({
      level: isDevelopment ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'ms-importer' },
      transports,
    });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
    });
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  verbose(message: string, meta?: Record<string, unknown>): void {
    this.logger.verbose(message, meta);
  }
}
