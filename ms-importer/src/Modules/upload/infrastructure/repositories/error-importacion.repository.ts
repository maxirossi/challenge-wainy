import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ErrorImportacion, CrearErrorImportacionDto } from '../../domain/error-importacion.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ErrorImportacionRepository {
  private readonly logger = new Logger(ErrorImportacionRepository.name);
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName = 'importaciones_errores';

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

  async crear(dto: CrearErrorImportacionDto): Promise<ErrorImportacion> {
    const error: ErrorImportacion = {
      id: uuidv4(),
      importacionId: dto.importacionId,
      linea: dto.linea,
      error: dto.error,
      contenidoLinea: dto.contenidoLinea,
      timestamp: new Date().toISOString(),
      tipoError: dto.tipoError,
    };

    try {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: error,
      }));

      this.logger.warn(`Error de importación registrado: ${error.id}`);
      return error;
    } catch (error) {
      this.logger.error(`Error guardando error de importación: ${error.message}`);
      throw new Error(`Error guardando error de importación: ${error.message}`);
    }
  }

  async obtenerPorImportacion(importacionId: string): Promise<ErrorImportacion[]> {
    try {
      const result = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'importacionId-index', // Necesitaremos crear este GSI
        KeyConditionExpression: 'importacionId = :importacionId',
        ExpressionAttributeValues: {
          ':importacionId': importacionId,
        },
      }));

      return (result.Items || []) as ErrorImportacion[];
    } catch (error) {
      this.logger.error(`Error obteniendo errores por importación: ${error.message}`);
      throw new Error(`Error obteniendo errores por importación: ${error.message}`);
    }
  }
} 