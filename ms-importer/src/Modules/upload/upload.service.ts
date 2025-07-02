import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from './s3.service';
import { BcraLineParser } from './bcra-line-parser.service';
import { RegisterDeudorUseCase } from '../deudores/application/use-cases/register-deudor.usecase';
import { ImportacionRepository } from './infrastructure/repositories/importacion.repository';
import { DeudorImportadoRepository } from './infrastructure/repositories/deudor-importado.repository';
import { ErrorImportacionRepository } from './infrastructure/repositories/error-importacion.repository';
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
    this.logger.log(`Iniciando procesamiento de archivo: ${file.originalname} (${file.size} bytes)`);

    // Generar clave única para S3
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const s3Key = `bcra-files/${timestamp}-${file.originalname}`;

    // Crear registro de importación
    const importacion = await this.importacionRepository.crear({
      nombreArchivo: file.originalname,
      s3Key,
      contenidoArchivo: '', // No guardamos el contenido completo para archivos grandes
      tamanoArchivo: file.size,
      tipoArchivo: file.mimetype,
    });

    let processedLines = 0;
    let cantidadErrores = 0;

    try {
      // Crear stream a partir del buffer del archivo
      const fileStream = Readable.from(file.buffer);
      
      // Subir archivo a S3 usando streaming
      await this.s3Service.uploadFileStream(fileStream, s3Key, file.mimetype);
      this.logger.log(`Archivo subido a S3: ${s3Key}`);

      // Crear un nuevo stream para el procesamiento (ya que el anterior se consumió)
      const processingStream = Readable.from(file.buffer);
      
      // Procesar archivo línea por línea usando streaming
      const result = await this.processFileByStreaming(processingStream, importacion.id);
      processedLines = result.processedLines;
      cantidadErrores = result.cantidadErrores;

      const tiempoProcesamiento = Date.now() - startTime;

      // Actualizar estadísticas de la importación
      await this.importacionRepository.actualizarEstadisticas(
        importacion.id,
        processedLines,
        cantidadErrores,
        'completado',
      );

      return {
        message: 'Archivo procesado exitosamente',
        processedLines,
        s3Key,
        importacionId: importacion.id,
        cantidadErrores,
        tamanoArchivo: file.size,
        tiempoProcesamiento,
      };
    } catch (error) {
      this.logger.error(`Error procesando archivo: ${error.message}`);
      
      // Actualizar estado a error
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

    const lineProcessor = new Transform({
      objectMode: true,
      transform: async (chunk: Buffer, encoding: string, callback: Function) => {
        try {
          const chunkStr = chunk.toString('utf-8');
          buffer += chunkStr;

          // Procesar líneas completas
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Mantener la línea incompleta en el buffer

          for (const line of lines) {
            lineaNumero++;
            if (line.trim().length === 0) continue;

            try {
              const parsedData = this.bcraLineParser.parseLine(line);
              
              if (parsedData) {
                // Registrar en el módulo de deudores (lógica de negocio)
                await this.registerDeudorUseCase.execute(
                  parsedData.numero_identificacion,
                  parseInt(parsedData.situacion, 10),
                  parsedData.prestamos_total_garantias,
                );

                // Guardar en DynamoDB para auditoría
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

                processedLines++;
              } else {
                // Línea no válida
                await this.errorImportacionRepository.crear({
                  importacionId,
                  linea: lineaNumero,
                  error: 'Línea no válida o vacía',
                  contenidoLinea: line,
                  tipoError: 'parsing',
                });
                cantidadErrores++;
              }
            } catch (error) {
              this.logger.warn(`Error procesando línea ${lineaNumero}: ${error.message}`);
              
              // Registrar error en DynamoDB
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
          // Procesar la última línea si hay algo en el buffer
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

                processedLines++;
              } else {
                await this.errorImportacionRepository.crear({
                  importacionId,
                  linea: lineaNumero,
                  error: 'Línea no válida o vacía',
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
          callback();
        } catch (error) {
          callback(error);
        }
      },
    });

    // Procesar el stream
    await pipeline(stream, lineProcessor);

    return { processedLines, cantidadErrores };
  }
} 