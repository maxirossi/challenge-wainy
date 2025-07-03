import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from './s3.service';
import { BcraLineParser } from './bcra-line-parser.service';
import { RegisterDeudorUseCase } from '../deudores/application/use-cases/register-deudor.usecase';
import { ImportacionRepository } from './infrastructure/repositories/importacion.repository';
import { DeudorImportadoRepository } from './infrastructure/repositories/deudor-importado.repository';
import { ErrorImportacionRepository } from './infrastructure/repositories/error-importacion.repository';
import { SQSClient } from '../../shared/infrastructure/aws/sqs/sqs.client';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';

export interface UploadResult {
  message: string;
  processedLines: number;
  s3Key: string;
  importacionId: string;
  cantidadErrores: number;
  tamanoArchivo: number;
  tiempoProcesamiento: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly CHUNK_SIZE = 64 * 1024; // 64KB chunks
  private readonly BATCH_SIZE = 20; // Batch size for SQS
  private readonly sqsClient = new SQSClient();
  private readonly queueUrl = 'http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/deudores-import-queue';

  constructor(
    private readonly s3Service: S3Service,
    private readonly bcraLineParser: BcraLineParser,
    private readonly registerDeudorUseCase: RegisterDeudorUseCase,
    private readonly importacionRepository: ImportacionRepository,
    private readonly deudorImportadoRepository: DeudorImportadoRepository,
    private readonly errorImportacionRepository: ErrorImportacionRepository,
  ) {}

  async processFile(file: any): Promise<UploadResult> {
    const startTime = Date.now();
    this.logger.log(`Starting file processing: ${file.originalname} (${file.size} bytes)`);

    // Generate unique key for S3
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const s3Key = `bcra-files/${timestamp}-${file.originalname}`;

    // Create import record
    const importacion = await this.importacionRepository.crear({
      nombreArchivo: file.originalname,
      s3Key,
      contenidoArchivo: '', // Don't save complete content for large files
      tamanoArchivo: file.size,
      tipoArchivo: file.mimetype,
    });

    let processedLines = 0;
    let cantidadErrores = 0;

    try {
      // Create stream from file buffer
      const fileStream = Readable.from(file.buffer);
      
      // Upload file to S3 using streaming
      await this.s3Service.uploadFileStream(fileStream, s3Key, file.mimetype);
      this.logger.log(`File uploaded to S3: ${s3Key}`);

      // Create new stream for processing (previous one was consumed)
      const processingStream = Readable.from(file.buffer);
      
      // Process file line by line using streaming
      const result = await this.processFileByStreaming(processingStream, importacion.id);
      processedLines = result.processedLines;
      cantidadErrores = result.cantidadErrores;

      const tiempoProcesamiento = Date.now() - startTime;

      // Update import statistics
      await this.importacionRepository.actualizarEstadisticas(
        importacion.id,
        processedLines,
        cantidadErrores,
        'completado',
      );

      return {
        message: 'File processed successfully',
        processedLines,
        s3Key,
        importacionId: importacion.id,
        cantidadErrores,
        tamanoArchivo: file.size,
        tiempoProcesamiento,
      };
    } catch (error) {
      this.logger.error(`Error processing file: ${error.message}`);
      
      // Update status to error
      await this.importacionRepository.actualizarEstadisticas(
        importacion.id,
        processedLines,
        cantidadErrores,
        'error',
      );

      throw error;
    }
  }

  private async processFileByStreaming(
    stream: Readable,
    importacionId: string,
  ): Promise<{ processedLines: number; cantidadErrores: number }> {
    let processedLines = 0;
    let cantidadErrores = 0;
    let buffer = '';
    let lineaNumero = 0;
    let messageBatch: string[] = []; // Buffer for SQS messages

    const lineProcessor = new Transform({
      objectMode: true,
      transform: async (chunk: Buffer, encoding: string, callback: Function) => {
        try {
          const chunkStr = chunk.toString('utf-8');
          buffer += chunkStr;

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            lineaNumero++;
            if (line.trim().length === 0) continue;

            try {
              const parsedData = this.bcraLineParser.parseLine(line);
              
              if (parsedData) {
                // Register in deudores module (business logic)
                await this.registerDeudorUseCase.execute(
                  parsedData.numero_identificacion,
                  parseInt(parsedData.situacion, 10),
                  parsedData.prestamos_total_garantias,
                );

                // Save to DynamoDB for audit
                await this.deudorImportadoRepository.crear({
                  cuit: parsedData.numero_identificacion,
                  importacionId,
                  codigoEntidad: parsedData.codigo_entidad,
                  fechaInformacion: parsedData.fecha_informacion,
                  tipoIdentificacion: parsedData.tipo_identificacion,
                  numeroIdentificacion: parsedData.numero_identificacion,
                  actividad: parsedData.actividad,
                  situacion: parseInt(parsedData.situacion, 10),
                  prestamosGarantias: parsedData.prestamos_total_garantias,
                  lineaArchivo: lineaNumero,
                });

                // Prepare message for SQS (Laravel compatible format)
                const messageBody = JSON.stringify({
                  deudores: [{
                    cuit: parsedData.numero_identificacion,
                    situacion: parseInt(parsedData.situacion, 10),
                    monto: parsedData.prestamos_total_garantias,
                    codigoEntidad: parsedData.codigo_entidad,
                    fechaInformacion: parsedData.fecha_informacion,
                    tipoIdentificacion: parsedData.tipo_identificacion,
                    actividad: parsedData.actividad,
                    importacionId,
                    lineaArchivo: lineaNumero,
                  }]
                });
                
                messageBatch.push(messageBody);

                this.logger.log(`[SQS] Mensaje agregado al batch (${messageBatch.length}/${this.BATCH_SIZE})`);

                // Forzar envío inmediato si hay menos de 20 mensajes (para debug):
                if (messageBatch.length > 0) {
                  try {
                    await this.sendSqsBatch(messageBatch);
                    this.logger.log(`[SQS] Batch de ${messageBatch.length} mensajes enviado a SQS (forzado)`);
                  } catch (sqsError) {
                    this.logger.error(`[SQS] Error enviando batch a SQS: ${sqsError.message}`);
                  }
                  messageBatch = [];
                }

                processedLines++;
              } else {
                // Invalid line
                await this.errorImportacionRepository.crear({
                  importacionId,
                  linea: lineaNumero,
                  error: 'Invalid or empty line',
                  contenidoLinea: line,
                  tipoError: 'parsing',
                });
                cantidadErrores++;
              }
            } catch (error) {
              this.logger.warn(`Error processing line ${lineaNumero}: ${error.message}`);
              
              // Log error in DynamoDB
              await this.errorImportacionRepository.crear({
                importacionId,
                linea: lineaNumero,
                error: error.message,
                contenidoLinea: line,
                tipoError: 'parsing',
              });
              
              cantidadErrores++;
            }
          }

          callback();
        } catch (error) {
          callback(error);
        }
      },
      flush: async (callback: Function) => {
        try {
          // Process last line if there's something in buffer
          if (buffer.trim().length > 0) {
            lineaNumero++;
            try {
              const parsedData = this.bcraLineParser.parseLine(buffer);
              
              if (parsedData) {
                await this.registerDeudorUseCase.execute(
                  parsedData.numero_identificacion,
                  parseInt(parsedData.situacion, 10),
                  parsedData.prestamos_total_garantias,
                );

                await this.deudorImportadoRepository.crear({
                  cuit: parsedData.numero_identificacion,
                  importacionId,
                  codigoEntidad: parsedData.codigo_entidad,
                  fechaInformacion: parsedData.fecha_informacion,
                  tipoIdentificacion: parsedData.tipo_identificacion,
                  numeroIdentificacion: parsedData.numero_identificacion,
                  actividad: parsedData.actividad,
                  situacion: parseInt(parsedData.situacion, 10),
                  prestamosGarantias: parsedData.prestamos_total_garantias,
                  lineaArchivo: lineaNumero,
                });

                // Prepare message for SQS (Laravel compatible format)
                const messageBody = JSON.stringify({
                  deudores: [{
                    cuit: parsedData.numero_identificacion,
                    situacion: parseInt(parsedData.situacion, 10),
                    monto: parsedData.prestamos_total_garantias,
                    codigoEntidad: parsedData.codigo_entidad,
                    fechaInformacion: parsedData.fecha_informacion,
                    tipoIdentificacion: parsedData.tipo_identificacion,
                    actividad: parsedData.actividad,
                    importacionId,
                    lineaArchivo: lineaNumero,
                  }]
                });
                
                messageBatch.push(messageBody);

                processedLines++;
              } else {
                await this.errorImportacionRepository.crear({
                  importacionId,
                  linea: lineaNumero,
                  error: 'Invalid or empty line',
                  contenidoLinea: buffer,
                  tipoError: 'parsing',
                });
                cantidadErrores++;
              }
            } catch (error) {
              await this.errorImportacionRepository.crear({
                importacionId,
                linea: lineaNumero,
                error: error.message,
                contenidoLinea: buffer,
                tipoError: 'parsing',
              });
              cantidadErrores++;
            }
          }

          // Send final batch if there are pending messages
          if (messageBatch.length > 0) {
            try {
              await this.sendSqsBatch(messageBatch);
              this.logger.debug(`Final batch of ${messageBatch.length} messages sent to SQS`);
            } catch (sqsError) {
              this.logger.error(`Error sending final batch to SQS: ${sqsError.message}`);
              // Don't fail processing due to SQS error
            }
          }

          callback();
        } catch (error) {
          callback(error);
        }
      },
    });

    // Process the stream
    await pipeline(stream, lineProcessor);

    return { processedLines, cantidadErrores };
  }

  /**
   * Sends a batch of messages to SQS
   */
  private async sendSqsBatch(messages: string[]): Promise<void> {
    if (messages.length === 0) return;

    try {
      await this.sqsClient.sendBatch(this.queueUrl, messages);
      this.logger.debug(`Batch of ${messages.length} messages sent successfully to SQS`);
    } catch (error) {
      this.logger.error(`Error sending batch to SQS: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
} 