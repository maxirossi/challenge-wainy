import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DeudorImportado, CrearDeudorImportadoDto } from '../../domain/deudor-importado.entity';

@Injectable()
export class DeudorImportadoRepository {
  private readonly logger = new Logger(DeudorImportadoRepository.name);
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName = 'deudores_bcra';

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

  async crear(dto: CrearDeudorImportadoDto): Promise<DeudorImportado> {
    const deudor: DeudorImportado = {
      cuit: dto.cuit,
      importacionId: dto.importacionId,
      codigoEntidad: dto.codigoEntidad,
      fechaInformacion: dto.fechaInformacion,
      tipoIdentificacion: dto.tipoIdentificacion,
      numeroIdentificacion: dto.numeroIdentificacion,
      actividad: dto.actividad,
      situacion: dto.situacion,
      prestamosGarantias: dto.prestamosGarantias,
      fechaImportacion: new Date().toISOString(),
      lineaArchivo: dto.lineaArchivo,
    };

    try {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: deudor,
      }));

      this.logger.log(`Deudor importado guardado: ${deudor.cuit}`);
      return deudor;
    } catch (error) {
      this.logger.error(`Error guardando deudor importado: ${error.message}`);
      throw new Error(`Error guardando deudor importado: ${error.message}`);
    }
  }

  async obtenerPorCuit(cuit: string): Promise<DeudorImportado | null> {
    try {
      const result = await this.client.send(new GetCommand({
        TableName: this.tableName,
        Key: { cuit },
      }));

      return result.Item as DeudorImportado || null;
    } catch (error) {
      this.logger.error(`Error obteniendo deudor por CUIT: ${error.message}`);
      throw new Error(`Error obteniendo deudor por CUIT: ${error.message}`);
    }
  }

  async obtenerPorImportacion(importacionId: string): Promise<DeudorImportado[]> {
    try {
      const result = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'importacionId-index', // Necesitaremos crear este GSI
        KeyConditionExpression: 'importacionId = :importacionId',
        ExpressionAttributeValues: {
          ':importacionId': importacionId,
        },
      }));

      return (result.Items || []) as DeudorImportado[];
    } catch (error) {
      this.logger.error(`Error obteniendo deudores por importación: ${error.message}`);
      throw new Error(`Error obteniendo deudores por importación: ${error.message}`);
    }
  }
} 