import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Importacion, CrearImportacionDto } from '../../domain/importacion.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImportacionRepository {
  private readonly logger = new Logger(ImportacionRepository.name);
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName = 'importaciones_bcra';

  constructor() {
    const dynamoClient = new DynamoDBClient({
      endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient);
  }

  async crear(dto: CrearImportacionDto): Promise<Importacion> {
    const importacion: Importacion = {
      id: uuidv4(),
      nombreArchivo: dto.nombreArchivo,
      fechaImportacion: new Date().toISOString(),
      usuario: dto.usuario,
      s3Key: dto.s3Key,
      estado: 'en_proceso',
      cantidadRegistros: 0,
      cantidadErrores: 0,
      contenidoArchivo: dto.contenidoArchivo,
      tamanoArchivo: dto.tamanoArchivo,
      tipoArchivo: dto.tipoArchivo,
    };

    try {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: importacion,
      }));

      this.logger.log(`Importación creada: ${importacion.id}`);
      return importacion;
    } catch (error) {
      this.logger.error(`Error creando importación: ${error.message}`);
      throw new Error(`Error creando importación: ${error.message}`);
    }
  }

  async actualizarEstadisticas(
    id: string,
    cantidadRegistros: number,
    cantidadErrores: number,
    estado: 'completado' | 'error',
  ): Promise<void> {
    try {
      await this.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET cantidadRegistros = :reg, cantidadErrores = :err, estado = :est',
        ExpressionAttributeValues: {
          ':reg': cantidadRegistros,
          ':err': cantidadErrores,
          ':est': estado,
        },
      }));

      this.logger.log(`Estadísticas actualizadas para importación: ${id}`);
    } catch (error) {
      this.logger.error(`Error actualizando estadísticas: ${error.message}`);
      throw new Error(`Error actualizando estadísticas: ${error.message}`);
    }
  }

  async obtenerPorId(id: string): Promise<Importacion | null> {
    try {
      const result = await this.client.send(new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }));

      return result.Item as Importacion || null;
    } catch (error) {
      this.logger.error(`Error obteniendo importación: ${error.message}`);
      throw new Error(`Error obteniendo importación: ${error.message}`);
    }
  }
} 