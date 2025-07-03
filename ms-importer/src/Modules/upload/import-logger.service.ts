import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ImportLogData {
  importacionId: string;
  timestamp: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  s3Key: string;
  processedLines: number;
  cantidadErrores: number;
  tiempoProcesamiento: number;
  status: 'iniciado' | 'completado' | 'error';
  errors?: Array<{
    linea: number;
    error: string;
    contenidoLinea?: string;
    tipoError: string;
  }>;
  summary?: {
    totalDeudores: number;
    totalEntidades: number;
    situacionDistribution: Record<string, number>;
  };
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    requestId?: string;
  };
}

@Injectable()
export class ImportLoggerService {
  private readonly logger = new Logger(ImportLoggerService.name);
  private readonly logsDir = 'logs_importer';

  constructor() {
    this.ensureLogsDirectory();
  }

  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      this.logger.log(`Created logs directory: ${this.logsDir}`);
    }
  }

  async logImportStart(data: Omit<ImportLogData, 'timestamp' | 'status'>): Promise<void> {
    const logData: ImportLogData = {
      ...data,
      timestamp: new Date().toISOString(),
      status: 'iniciado',
    };

    await this.writeLogFile(logData);
    this.logger.log(`Import started: ${data.importacionId} - ${data.fileName}`);
  }

  async logImportComplete(data: Omit<ImportLogData, 'timestamp' | 'status'>): Promise<void> {
    const logData: ImportLogData = {
      ...data,
      timestamp: new Date().toISOString(),
      status: 'completado',
    };

    await this.writeLogFile(logData);
    this.logger.log(`Import completed: ${data.importacionId} - ${data.processedLines} lines processed`);
  }

  async logImportError(data: Omit<ImportLogData, 'timestamp' | 'status'>): Promise<void> {
    const logData: ImportLogData = {
      ...data,
      timestamp: new Date().toISOString(),
      status: 'error',
    };

    await this.writeLogFile(logData);
    this.logger.error(`Import failed: ${data.importacionId} - ${data.cantidadErrores} errors`);
  }

  async logError(importacionId: string, error: any, linea?: number, contenidoLinea?: string): Promise<void> {
    const errorLog = {
      importacionId,
      timestamp: new Date().toISOString(),
      linea,
      error: error.message || error.toString(),
      contenidoLinea,
      tipoError: 'processing',
      stack: error.stack,
    };

    await this.writeErrorLogFile(errorLog);
  }

  private async writeLogFile(logData: ImportLogData): Promise<void> {
    try {
      const fileName = `import_${logData.importacionId}_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = path.join(this.logsDir, fileName);
      
      // Read existing logs or create new array
      let logs: ImportLogData[] = [];
      if (fs.existsSync(filePath)) {
        const existingContent = fs.readFileSync(filePath, 'utf-8');
        logs = JSON.parse(existingContent);
      }

      // Add new log entry
      logs.push(logData);

      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(logs, null, 2));
    } catch (error) {
      this.logger.error(`Error writing log file: ${error.message}`);
    }
  }

  private async writeErrorLogFile(errorLog: any): Promise<void> {
    try {
      const fileName = `errors_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = path.join(this.logsDir, fileName);
      
      // Read existing error logs or create new array
      let errorLogs: any[] = [];
      if (fs.existsSync(filePath)) {
        const existingContent = fs.readFileSync(filePath, 'utf-8');
        errorLogs = JSON.parse(existingContent);
      }

      // Add new error log entry
      errorLogs.push(errorLog);

      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(errorLogs, null, 2));
    } catch (error) {
      this.logger.error(`Error writing error log file: ${error.message}`);
    }
  }

  async getImportLogs(date?: string): Promise<ImportLogData[]> {
    try {
      const fileName = date 
        ? `import_*_${date}.json`
        : `import_*_${new Date().toISOString().split('T')[0]}.json`;
      
      const files = fs.readdirSync(this.logsDir)
        .filter(file => file.startsWith('import_') && file.endsWith('.json'));

      const allLogs: ImportLogData[] = [];
      
      for (const file of files) {
        const filePath = path.join(this.logsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const logs = JSON.parse(content);
        allLogs.push(...logs);
      }

      return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      this.logger.error(`Error reading import logs: ${error.message}`);
      return [];
    }
  }

  async getErrorLogs(date?: string): Promise<any[]> {
    try {
      const fileName = date 
        ? `errors_${date}.json`
        : `errors_${new Date().toISOString().split('T')[0]}.json`;
      
      const filePath = path.join(this.logsDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Error reading error logs: ${error.message}`);
      return [];
    }
  }

  async getImportSummary(importacionId: string): Promise<ImportLogData | null> {
    try {
      const logs = await this.getImportLogs();
      return logs.find(log => log.importacionId === importacionId) || null;
    } catch (error) {
      this.logger.error(`Error getting import summary: ${error.message}`);
      return null;
    }
  }
} 