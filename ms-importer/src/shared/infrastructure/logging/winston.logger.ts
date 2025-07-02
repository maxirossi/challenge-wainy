import type { ILogger } from './logger.interface';

export class WinstonLogger implements ILogger {
  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    // Constructor simple sin dependencias problemáticas
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[INFO] ${message}`, meta || '');
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
    });
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, meta || '');
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, meta || '');
    }
  }

  verbose(message: string, meta?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.log(`[VERBOSE] ${message}`, meta || '');
    }
  }
}
