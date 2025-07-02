import type { ILogger } from './logger.interface';
import { WinstonLogger } from './winston.logger';

export class LoggerService {
  private static instance: LoggerService;
  private readonly logger: ILogger;

  private constructor() {
    this.logger = new WinstonLogger();
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  getLogger(): ILogger {
    return this.logger;
  }

  // Métodos de conveniencia para logging directo
  static info(message: string, meta?: Record<string, unknown>): void {
    LoggerService.getInstance().logger.info(message, meta);
  }

  static error(
    message: string,
    error?: Error,
    meta?: Record<string, unknown>,
  ): void {
    LoggerService.getInstance().logger.error(message, error, meta);
  }

  static warn(message: string, meta?: Record<string, unknown>): void {
    LoggerService.getInstance().logger.warn(message, meta);
  }

  static debug(message: string, meta?: Record<string, unknown>): void {
    LoggerService.getInstance().logger.debug(message, meta);
  }

  static verbose(message: string, meta?: Record<string, unknown>): void {
    LoggerService.getInstance().logger.verbose(message, meta);
  }
}
