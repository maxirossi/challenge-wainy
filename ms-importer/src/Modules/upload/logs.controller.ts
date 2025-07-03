import {
  Controller,
  Get,
  Query,
  Param,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ImportLoggerService } from './import-logger.service';

@ApiTags('Logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly importLoggerService: ImportLoggerService) {}

  @Get('imports')
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Obtener logs de importaciones',
    description: 'Retorna los logs de todas las importaciones realizadas, opcionalmente filtrados por fecha.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Fecha en formato YYYY-MM-DD para filtrar logs',
    example: '2025-07-03',
  })
  @ApiResponse({
    status: 200,
    description: 'Logs de importaciones obtenidos exitosamente',
  })
  async getImportLogs(@Query('date') date?: string) {
    const logs = await this.importLoggerService.getImportLogs(date);
    
    return {
      success: true,
      data: logs,
      total: logs.length,
      date: date || 'all',
    };
  }

  @Get('errors')
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Obtener logs de errores',
    description: 'Retorna los logs de errores de importación, opcionalmente filtrados por fecha.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Fecha en formato YYYY-MM-DD para filtrar logs',
    example: '2025-07-03',
  })
  @ApiResponse({
    status: 200,
    description: 'Logs de errores obtenidos exitosamente',
  })
  async getErrorLogs(@Query('date') date?: string) {
    const errors = await this.importLoggerService.getErrorLogs(date);
    
    return {
      success: true,
      data: errors,
      total: errors.length,
      date: date || 'all',
    };
  }

  @Get('imports/:importacionId')
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Obtener log de importación específica',
    description: 'Retorna el log detallado de una importación específica por su ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Log de importación obtenido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Importación no encontrada',
  })
  async getImportLog(@Param('importacionId') importacionId: string) {
    const log = await this.importLoggerService.getImportSummary(importacionId);
    
    if (!log) {
      return {
        success: false,
        message: 'Importación no encontrada',
      };
    }
    
    return {
      success: true,
      data: log,
    };
  }

  @Get('summary')
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Obtener resumen de logs',
    description: 'Retorna un resumen estadístico de todas las importaciones.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen de logs obtenido exitosamente',
  })
  async getLogsSummary() {
    const logs = await this.importLoggerService.getImportLogs();
    const errors = await this.importLoggerService.getErrorLogs();
    
    const totalImports = logs.length;
    const successfulImports = logs.filter(log => log.status === 'completado').length;
    const failedImports = logs.filter(log => log.status === 'error').length;
    const totalProcessedLines = logs.reduce((sum, log) => sum + log.processedLines, 0);
    const totalErrors = logs.reduce((sum, log) => sum + log.cantidadErrores, 0);
    const totalFileSize = logs.reduce((sum, log) => sum + log.fileSize, 0);
    
    return {
      success: true,
      data: {
        totalImports,
        successfulImports,
        failedImports,
        totalProcessedLines,
        totalErrors,
        totalFileSize,
        averageProcessingTime: logs.length > 0 
          ? logs.reduce((sum, log) => sum + log.tiempoProcesamiento, 0) / logs.length 
          : 0,
        errorLogs: errors.length,
        lastImport: logs.length > 0 ? logs[0] : null,
      },
    };
  }
} 